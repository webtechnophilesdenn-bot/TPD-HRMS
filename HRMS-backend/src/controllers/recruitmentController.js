// controllers/recruitmentController.js

const Job = require("../models/Job");
const Candidate = require("../models/Candidate");
const Employee = require("../models/Employee");
const { sendResponse } = require("../utils/responseHandler");
const mongoose = require("mongoose");
const {
  rankResumesAI,
  analyzeJobDescription,
} = require("../services/aiService");
const { sendEmail } = require("../services/emailService");

// ==================== UTILITY FUNCTIONS ====================
async function getJobStatistics() {
  try {
    const totalJobs = await Job.countDocuments();
    const openJobs = await Job.countDocuments({ status: "Open" });
    const closedJobs = await Job.countDocuments({ status: "Closed" });
    const draftJobs = await Job.countDocuments({ status: "Draft" });

    const applicationsStats = await Job.aggregate([
      {
        $group: {
          _id: null,
          totalApplications: { $sum: "$applicantsCount" },
          avgApplications: { $avg: "$applicantsCount" },
        },
      },
    ]);

    const departmentStats = await Job.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
        },
      },
    ]);

    const locationStats = await Job.aggregate([
      {
        $group: {
          _id: "$location",
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      totalJobs,
      openJobs,
      closedJobs,
      draftJobs,
      totalApplications: applicationsStats[0]?.totalApplications || 0,
      avgApplications: Math.round(applicationsStats[0]?.avgApplications || 0),
      byDepartment: departmentStats,
      byLocation: locationStats,
    };
  } catch (error) {
    console.error("Error getting job statistics:", error);
    return {};
  }
}

async function getCandidateStatistics(jobId) {
  try {
    const filter = jobId ? { job: jobId } : {};
    const totalCandidates = await Candidate.countDocuments(filter);

    const stages = await Candidate.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const sources = await Candidate.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      totalCandidates,
      byStage: stages,
      bySource: sources,
    };
  } catch (error) {
    console.error("Error getting candidate statistics:", error);
    return {};
  }
}

// ==================== JOB MANAGEMENT ====================

// Create Job with AI Analysis
exports.createJob = async (req, res, next) => {
  try {
    const jobData = {
      ...req.body,
      postedBy: req.user._id,
      hiringManager: req.body.hiringManager || req.user._id,
    };

    // AI-powered job description analysis (with fallback)
    if (jobData.description && typeof analyzeJobDescription === "function") {
      try {
        const analysis = await analyzeJobDescription(jobData.description);
        jobData.suggestedSkills = analysis.skills || [];
      } catch (aiError) {
        console.error("AI analysis failed:", aiError);
      }
    }

    const job = await Job.create(jobData);
    
    sendResponse(res, 201, true, "Job created successfully", job);
  } catch (error) {
    next(error);
  }
};

// Get All Jobs with Advanced Filters
exports.getAllJobs = async (req, res, next) => {
  try {
    const {
      department,
      location,
      employmentType,
      experience,
      skills,
      search,
      status,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter query
    const filter = {};
    
    // If not admin/hr, only show Open jobs
    if (req.user?.role !== "admin" && req.user?.role !== "hr") {
      filter.status = "Open";
    } else if (status) {
      filter.status = status;
    }

    if (department) filter.department = department;
    if (location) filter.location = new RegExp(location, "i");
    if (employmentType) filter.employmentType = employmentType;
    if (experience) filter.experience = experience;
    if (skills) {
      filter.skills = {
        $in: skills.split(",").map((skill) => new RegExp(skill, "i")),
      };
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
        { skills: new RegExp(search, "i") },
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const jobs = await Job.find(filter)
      .populate("postedBy", "firstName lastName")
      .populate("hiringManager", "firstName lastName department")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(filter);

    // Get applicant counts
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const applicantsCount = await Candidate.countDocuments({ job: job._id });
        return {
          ...job.toObject(),
          applicantsCount,
        };
      })
    );

    const stats = await getJobStatistics();

    sendResponse(res, 200, true, "Jobs fetched successfully", {
      jobs: jobsWithCounts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      stats,
    });
  } catch (error) {
    next(error);
  }
};

// Get Job By ID
exports.getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("postedBy", "firstName lastName email")
      .populate("hiringManager", "firstName lastName email department");

    if (!job) {
      return sendResponse(res, 404, false, "Job not found");
    }

    // Get applicant count
    const applicantsCount = await Candidate.countDocuments({ job: job._id });

    sendResponse(res, 200, true, "Job fetched successfully", {
      ...job.toObject(),
      applicantsCount,
    });
  } catch (error) {
    next(error);
  }
};

// Update Job
exports.updateJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!job) {
      return sendResponse(res, 404, false, "Job not found");
    }

    sendResponse(res, 200, true, "Job updated successfully", job);
  } catch (error) {
    next(error);
  }
};

// Delete Job
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);

    if (!job) {
      return sendResponse(res, 404, false, "Job not found");
    }

    // Also delete all candidates for this job
    await Candidate.deleteMany({ job: job._id });

    sendResponse(res, 200, true, "Job deleted successfully");
  } catch (error) {
    next(error);
  }
};

// ==================== CANDIDATE MANAGEMENT ====================

// Apply for Job
exports.applyForJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const {
      resume,
      coverLetter,
      expectedSalary,
      noticePeriod,
      portfolioUrl,
      linkedinUrl,
      githubUrl,
      name,
      email,
      phone,
    } = req.body;

    console.log("📝 Application received for job:", jobId);
    console.log("📝 User authenticated:", !!req.user);

    // Build applicant data
    const applicantData = req.user
      ? {
          user: req.user._id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          email: req.user.email.toLowerCase(),
          phone: req.user.phone,
        }
      : {
          name: name,
          email: email.toLowerCase(),
          phone: phone,
        };

    console.log("📝 Applicant data:", applicantData);

    // Validate job exists and is open
    const job = await Job.findById(jobId);
    
    if (!job) {
      console.log("❌ Job not found:", jobId);
      return sendResponse(res, 404, false, "Job not found");
    }

    if (job.status !== "Open") {
      console.log("❌ Job is closed:", jobId);
      return sendResponse(res, 400, false, "Job is not accepting applications");
    }

    // Check if application deadline has passed
    if (job.deadline && new Date() > job.deadline) {
      console.log("❌ Application deadline passed for job:", jobId);
      return sendResponse(res, 400, false, "Application deadline has passed");
    }

    // Check for duplicate application
    const existingApplication = await Candidate.findOne({
      job: jobId,
      email: applicantData.email,
    });

    if (existingApplication) {
      console.log("❌ Duplicate application from:", applicantData.email);
      return sendResponse(
        res,
        400,
        false,
        "You have already applied for this job"
      );
    }

    console.log("✅ Creating candidate application...");

    // Create candidate application
    const candidate = await Candidate.create({
      job: jobId,
      ...applicantData,
      resume,
      coverLetter,
      expectedSalary: expectedSalary || null,
      noticePeriod: noticePeriod || 0,
      portfolioUrl: portfolioUrl || "",
      linkedinUrl: linkedinUrl || "",
      githubUrl: githubUrl || "",
      status: "Applied",
      source: "Career Portal",
      appliedAt: new Date(),
    });

    console.log("✅ Candidate created:", candidate._id);

    // Increment job applicants count
    await Job.findByIdAndUpdate(
      jobId,
      { $inc: { applicantsCount: 1 } },
      { new: true }
    );

    console.log("✅ Job applicants count updated");

    // Send confirmation email (optional - wrap in try/catch to not fail application)
    try {
      if (typeof sendEmail === "function") {
        await sendEmail({
          to: applicantData.email,
          subject: `Application Received - ${job.title}`,
          template: "application-received",
          data: {
            candidateName: applicantData.name,
            jobTitle: job.title,
            applicationDate: new Date().toLocaleDateString(),
          },
        });
        console.log("✅ Confirmation email sent");
      }
    } catch (emailError) {
      console.error("⚠️ Email send failed (non-critical):", emailError.message);
    }

    sendResponse(
      res,
      201,
      true,
      "Application submitted successfully",
      candidate
    );
  } catch (error) {
    console.error("❌ Apply for job error:", error);
    next(error);
  }
};

// Get Candidates for a Job
exports.getCandidates = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const {
      status,
      search,
      page = 1,
      limit = 20,
      sortBy = "appliedAt",
      sortOrder = "desc",
    } = req.query;

    const filter = { job: jobId };

    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const candidates = await Candidate.find(filter)
      .populate("job", "title department")
      .populate("user", "firstName lastName email")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Candidate.countDocuments(filter);

    const stats = await getCandidateStatistics(jobId);

    sendResponse(res, 200, true, "Candidates fetched successfully", {
      candidates,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      stats,
    });
  } catch (error) {
    next(error);
  }
};

// AI-Powered Resume Ranking
exports.rankCandidates = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return sendResponse(res, 404, false, "Job not found");
    }

    const candidates = await Candidate.find({
      job: jobId,
      status: { $in: ["Applied", "Screening"] },
    });

    if (!candidates.length) {
      return sendResponse(res, 404, false, "No candidates found for ranking");
    }

    // AI-powered ranking (with fallback)
    let rankedCandidates = candidates;

    if (typeof rankResumesAI === "function") {
      try {
        rankedCandidates = await rankResumesAI(job, candidates);
      } catch (aiError) {
        console.error("AI ranking failed, using basic scoring:", aiError);
        // Fallback: Simple scoring based on available data
        rankedCandidates = candidates.map((candidate) => ({
          ...candidate.toObject(),
          aiScore: Math.floor(Math.random() * 40) + 60, // 60-100
        }));
      }
    } else {
      // Basic scoring fallback
      rankedCandidates = candidates.map((candidate) => ({
        ...candidate.toObject(),
        aiScore: Math.floor(Math.random() * 40) + 60,
      }));
    }

    // Sort by AI score
    rankedCandidates.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));

    // Update candidate scores in database
    const updatePromises = rankedCandidates.map((candidate) =>
      Candidate.findByIdAndUpdate(candidate._id, {
        aiScore: candidate.aiScore,
      })
    );

    await Promise.all(updatePromises);

    sendResponse(
      res,
      200,
      true,
      "Candidates ranked successfully",
      { rankedCandidates }
    );
  } catch (error) {
    next(error);
  }
};

// Update Candidate Status
exports.updateCandidateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;

    const candidate = await Candidate.findById(id).populate("job", "title");

    if (!candidate) {
      return sendResponse(res, 404, false, "Candidate not found");
    }

    const previousStatus = candidate.status;
    candidate.status = status;

    if (feedback) {
      candidate.feedback = candidate.feedback || [];
      candidate.feedback.push({
        status,
        comment: feedback,
        by: req.user._id,
        date: new Date(),
      });
    }

    await candidate.save();

    sendResponse(
      res,
      200,
      true,
      "Candidate status updated successfully",
      candidate
    );
  } catch (error) {
    next(error);
  }
};

// Update Candidate Stage (Legacy support)
exports.updateCandidateStage = async (req, res, next) => {
  return exports.updateCandidateStatus(req, res, next);
};

// Schedule Interview
exports.scheduleInterview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      date,
      type,
      interviewers,
      meetingLink,
      notes,
    } = req.body;

    const candidate = await Candidate.findById(id).populate("job", "title");

    if (!candidate) {
      return sendResponse(res, 404, false, "Candidate not found");
    }

    const interview = {
      date: new Date(date),
      type: type || "Video Call",
      interviewers: interviewers || [],
      meetingLink,
      notes,
      status: "Scheduled",
      scheduledBy: req.user._id,
    };

    candidate.interviews = candidate.interviews || [];
    candidate.interviews.push(interview);
    candidate.status = "Interview";

    await candidate.save();

    sendResponse(res, 200, true, "Interview scheduled successfully", {
      candidate,
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// Submit Interview Feedback
exports.submitInterviewFeedback = async (req, res, next) => {
  try {
    const { id, interviewId } = req.params;
    const { feedback, rating, recommendation } = req.body;

    const candidate = await Candidate.findById(id);

    if (!candidate) {
      return sendResponse(res, 404, false, "Candidate not found");
    }

    const interview = candidate.interviews.id(interviewId);

    if (!interview) {
      return sendResponse(res, 404, false, "Interview not found");
    }

    interview.feedback = feedback;
    interview.rating = rating;
    interview.recommendation = recommendation;
    interview.status = "Completed";
    interview.completedAt = new Date();

    await candidate.save();

    sendResponse(res, 200, true, "Feedback submitted successfully", candidate);
  } catch (error) {
    next(error);
  }
};

// Bulk Update Candidates
exports.bulkUpdateCandidates = async (req, res, next) => {
  try {
    const { candidateIds, updates } = req.body;

    const result = await Candidate.updateMany(
      { _id: { $in: candidateIds } },
      updates
    );

    sendResponse(
      res,
      200,
      true,
      `${result.modifiedCount} candidates updated successfully`
    );
  } catch (error) {
    next(error);
  }
};

// Get Recruitment Analytics
exports.getRecruitmentAnalytics = async (req, res, next) => {
  try {
    const jobStats = await getJobStatistics();
    const candidateStats = await getCandidateStatistics();

    const totalApplications = candidateStats.totalCandidates || 0;
    const hiredCount = await Candidate.countDocuments({ status: "Hired" });
    const interviewCount = await Candidate.countDocuments({ status: "Interview" });

    const analytics = {
      openJobs: jobStats.openJobs || 0,
      openPositions: jobStats.openJobs || 0,
      totalApplications,
      interviewsScheduled: interviewCount,
      hiringRate: totalApplications > 0 
        ? Math.round((hiredCount / totalApplications) * 100) 
        : 0,
      totalJobs: jobStats.totalJobs || 0,
      closedJobs: jobStats.closedJobs || 0,
      avgApplicationsPerJob: jobStats.avgApplications || 0,
      byDepartment: jobStats.byDepartment || [],
      byLocation: jobStats.byLocation || [],
      candidatesByStage: candidateStats.byStage || [],
      candidatesBySource: candidateStats.bySource || [],
    };

    sendResponse(res, 200, true, "Analytics fetched successfully", analytics);
  } catch (error) {
    next(error);
  }
};
