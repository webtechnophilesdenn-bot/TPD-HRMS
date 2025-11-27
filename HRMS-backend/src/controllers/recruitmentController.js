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

// Utility Functions
async function getJobStatistics() {
  try {
    const totalJobs = await Job.countDocuments();
    const openJobs = await Job.countDocuments({ status: "Open" });
    const closedJobs = await Job.countDocuments({ status: "Closed" });
    const draftJobs = await Job.countDocuments({ status: "Draft" });

    // Applications per job
    const applicationsStats = await Job.aggregate([
      {
        $group: {
          _id: null,
          totalApplications: { $sum: "$applications" },
          avgApplications: { $avg: "$applications" },
        },
      },
    ]);

    // Jobs by department
    const departmentStats = await Job.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
        },
      },
    ]);

    // Jobs by location
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
          _id: "$stage",
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

    const experienceStats = await Candidate.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avgExperience: { $avg: "$totalExperience" },
          minExperience: { $min: "$totalExperience" },
          maxExperience: { $max: "$totalExperience" },
        },
      },
    ]);

    const statusStats = await Candidate.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      totalCandidates,
      byStage: stages,
      bySource: sources,
      byStatus: statusStats,
      experience: experienceStats[0] || {},
    };
  } catch (error) {
    console.error("Error getting candidate statistics:", error);
    return {};
  }
}

async function getRecruitmentMetrics(timeframe, department) {
  try {
    let dateFilter = {};
    const now = new Date();

    switch (timeframe) {
      case "7d":
        dateFilter = {
          createdAt: { $gte: new Date(now.setDate(now.getDate() - 7)) },
        };
        break;
      case "30d":
        dateFilter = {
          createdAt: { $gte: new Date(now.setDate(now.getDate() - 30)) },
        };
        break;
      case "90d":
        dateFilter = {
          createdAt: { $gte: new Date(now.setDate(now.getDate() - 90)) },
        };
        break;
      default:
        dateFilter = {
          createdAt: { $gte: new Date(now.setDate(now.getDate() - 30)) },
        };
    }

    const departmentFilter = department ? { department } : {};

    // Overall metrics
    const totalJobs = await Job.countDocuments({
      ...dateFilter,
      ...departmentFilter,
    });
    const totalCandidates = await Candidate.countDocuments(dateFilter);
    const hiredCandidates = await Candidate.countDocuments({
      ...dateFilter,
      stage: "Hired",
    });

    // Time to fill metrics
    const timeToFillStats = await Candidate.aggregate([
      { $match: { ...dateFilter, stage: "Hired" } },
      {
        $lookup: {
          from: "jobs",
          localField: "job",
          foreignField: "_id",
          as: "job",
        },
      },
      { $unwind: "$job" },
      {
        $project: {
          timeToFill: {
            $divide: [
              { $subtract: ["$updatedAt", "$appliedDate"] },
              1000 * 60 * 60 * 24, // Convert to days
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgTimeToFill: { $avg: "$timeToFill" },
          minTimeToFill: { $min: "$timeToFill" },
          maxTimeToFill: { $max: "$timeToFill" },
        },
      },
    ]);

    // Application sources
    const sourceStats = await Candidate.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
        },
      },
    ]);

    // Candidate pipeline
    const pipelineStats = await Candidate.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$stage",
          count: { $sum: 1 },
        },
      },
    ]);

    // Department performance
    const departmentPerformance = await Job.aggregate([
      { $match: { ...dateFilter, ...departmentFilter } },
      {
        $lookup: {
          from: "candidates",
          localField: "_id",
          foreignField: "job",
          as: "candidates",
        },
      },
      {
        $project: {
          department: 1,
          applications: { $size: "$candidates" },
          hires: {
            $size: {
              $filter: {
                input: "$candidates",
                as: "candidate",
                cond: { $eq: ["$$candidate.stage", "Hired"] },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$department",
          totalApplications: { $sum: "$applications" },
          totalHires: { $sum: "$hires" },
          jobCount: { $sum: 1 },
        },
      },
    ]);

    return {
      timeframe,
      totalJobs,
      totalCandidates,
      hiredCandidates,
      offerAcceptanceRate:
        totalCandidates > 0 ? (hiredCandidates / totalCandidates) * 100 : 0,
      timeToFill: timeToFillStats[0] || {},
      sources: sourceStats,
      pipeline: pipelineStats,
      departmentPerformance,
    };
  } catch (error) {
    console.error("Error getting recruitment metrics:", error);
    return {};
  }
}

// Helper Functions
async function autoPostJobToBoards(job) {
  try {
    // Simulate auto-posting to job boards
    const jobBoards = ["LinkedIn", "Naukri", "Indeed", "Glassdoor"];
    console.log(`Auto-posting job ${job.title} to:`, jobBoards);

    // In a real implementation, you would have API calls to each job board
    job.postedOnJobPortals = jobBoards;
    await job.save();

    return true;
  } catch (error) {
    console.error("Error auto-posting job:", error);
    return false;
  }
}

async function sendApplicationConfirmation(candidate, job) {
  try {
    const emailData = {
      to: candidate.email,
      subject: `Application Confirmation - ${job.title}`,
      template: "applicationConfirmation",
      data: {
        candidateName: candidate.name,
        jobTitle: job.title,
        companyName: "Your Company",
        applicationId: candidate.candidateId,
      },
    };

    await sendEmail(emailData);
  } catch (error) {
    console.error("Error sending application confirmation:", error);
  }
}

async function autoScreenCandidate(candidateId) {
  try {
    const candidate = await Candidate.findById(candidateId).populate("job");
    if (!candidate) return;

    // Basic auto-screening logic
    let screeningScore = 0;

    // Check experience match
    if (candidate.totalExperience >= candidate.job.requiredExperience) {
      screeningScore += 30;
    }

    // Check notice period (prefer shorter notice periods)
    if (
      candidate.noticePeriod &&
      candidate.noticePeriod.includes("Immediate")
    ) {
      screeningScore += 20;
    } else if (
      candidate.noticePeriod &&
      candidate.noticePeriod.includes("15")
    ) {
      screeningScore += 15;
    } else if (
      candidate.noticePeriod &&
      candidate.noticePeriod.includes("30")
    ) {
      screeningScore += 10;
    }

    // Update candidate score
    candidate.screeningScore = screeningScore;
    candidate.overallRating = screeningScore;

    // Auto-advance if score is high
    if (screeningScore >= 40) {
      candidate.stage = "Resume Screening";
    }

    await candidate.save();
  } catch (error) {
    console.error("Error in auto-screening:", error);
  }
}

function getStageFromInterviewRound(round) {
  const stageMap = {
    "Phone Screening": "Phone Screening",
    "Technical Round": "Technical Round",
    "HR Round": "HR Round",
    "Manager Round": "Manager Round",
    "Final Round": "Final Round",
  };

  return stageMap[round] || "Technical Round";
}

async function sendStageUpdateNotification(candidate, previousStage, newStage) {
  try {
    const emailData = {
      to: candidate.email,
      subject: `Application Update - ${candidate.job.title}`,
      template: "stageUpdate",
      data: {
        candidateName: candidate.name,
        jobTitle: candidate.job.title,
        previousStage,
        newStage,
        companyName: "Your Company",
      },
    };

    await sendEmail(emailData);
  } catch (error) {
    console.error("Error sending stage update notification:", error);
  }
}

async function sendInterviewInvites(candidate, interview) {
  try {
    // Send to candidate
    const candidateEmail = {
      to: candidate.email,
      subject: `Interview Invitation - ${candidate.job.title}`,
      template: "interviewInvite",
      data: {
        candidateName: candidate.name,
        jobTitle: candidate.job.title,
        interviewRound: interview.round,
        interviewDate: interview.date,
        interviewType: interview.type,
        meetingLink: interview.meetingLink,
        duration: interview.duration,
        instructions: interview.instructions,
        requiredPreparation: interview.requiredPreparation,
      },
    };

    // Send to interviewers
    const interviewers = await Employee.find({
      _id: { $in: interview.interviewers },
    });
    const interviewerEmails = interviewers.map((interviewer) => ({
      to: interviewer.email,
      subject: `Interview Scheduled - ${candidate.job.title} - ${candidate.name}`,
      template: "interviewerInvite",
      data: {
        interviewerName: interviewer.firstName,
        candidateName: candidate.name,
        jobTitle: candidate.job.title,
        interviewRound: interview.round,
        interviewDate: interview.date,
        interviewType: interview.type,
        meetingLink: interview.meetingLink,
        duration: interview.duration,
        candidateProfile: `${candidate.currentDesignation} at ${candidate.currentCompany}`,
      },
    }));

    await sendEmail(candidateEmail);
    for (const email of interviewerEmails) {
      await sendEmail(email);
    }
  } catch (error) {
    console.error("Error sending interview invites:", error);
  }
}

async function updateCandidateScores(candidate, interview) {
  try {
    // Update scores based on interview feedback
    if (interview.rating) {
      switch (interview.round) {
        case "Technical Round":
          candidate.technicalScore = interview.rating;
          break;
        case "HR Round":
          candidate.hrScore = interview.rating;
          break;
        default:
          // For other rounds, update overall rating
          candidate.overallRating = interview.rating;
      }
    }

    // Calculate overall rating if we have multiple scores
    const scores = [
      candidate.technicalScore,
      candidate.hrScore,
      candidate.screeningScore,
    ].filter((score) => score);
    if (scores.length > 0) {
      candidate.overallRating = scores.reduce((a, b) => a + b) / scores.length;
    }

    await candidate.save();
  } catch (error) {
    console.error("Error updating candidate scores:", error);
  }
}

async function sendBulkCandidateNotifications(candidateIds, updates) {
  try {
    const candidates = await Candidate.find({
      _id: { $in: candidateIds },
    }).populate("job");

    for (const candidate of candidates) {
      if (updates.stage) {
        await sendStageUpdateNotification(
          candidate,
          candidate.stage,
          updates.stage
        );
      }
    }
  } catch (error) {
    console.error("Error sending bulk notifications:", error);
  }
}

// Enhanced Job Creation with AI Analysis
async function createJob(req, res, next) {
  try {
    const jobData = {
      ...req.body,
      postedBy: req.user._id,
      hiringManager: req.body.hiringManager || req.user._id, // Auto-assign if not provided
    };

    // AI-powered job description analysis (with fallback)
    if (jobData.description) {
      try {
        // Check if analyzeJobDescription function exists
        if (typeof analyzeJobDescription === "function") {
          const analysis = await analyzeJobDescription(jobData.description);
          jobData.skills = analysis.skills || jobData.skills;
          jobData.seniorityLevel =
            analysis.seniorityLevel || jobData.seniorityLevel;
          jobData.requiredExperience =
            analysis.requiredExperience || jobData.requiredExperience;
        } else {
          // Fallback: Extract skills from description using simple regex
          jobData.skills = extractSkillsFromDescription(jobData.description);
          console.log(
            "AI analysis not available, using fallback skill extraction"
          );
        }
      } catch (aiError) {
        console.error("AI analysis failed, using fallback:", aiError);
        jobData.skills = extractSkillsFromDescription(jobData.description);
      }
    }

    const job = await Job.create(jobData);

    // Auto-post to job boards
    await autoPostJobToBoards(job);

    sendResponse(res, 201, true, "Job created successfully", job);
  } catch (error) {
    next(error);
  }
}

// Fallback skill extraction function
function extractSkillsFromDescription(description) {
  const commonSkills = [
    "JavaScript",
    "Python",
    "Java",
    "React",
    "Node.js",
    "SQL",
    "AWS",
    "HTML",
    "CSS",
    "TypeScript",
    "Angular",
    "Vue",
    "MongoDB",
    "PostgreSQL",
    "Docker",
    "Kubernetes",
    "Git",
    "REST API",
    "GraphQL",
    "Machine Learning",
    "Data Analysis",
    "Project Management",
    "Agile",
    "Scrum",
    "Communication",
    "Problem Solving",
    "Leadership",
    "Teamwork",
  ];

  const foundSkills = commonSkills.filter((skill) =>
    description.toLowerCase().includes(skill.toLowerCase())
  );

  return foundSkills.length > 0 ? foundSkills : ["General Skills"];
}
// Advanced Job Search with Filters
async function getAllJobs(req, res, next) {
  try {
    const {
      department,
      location,
      employmentType,
      experience,
      skills,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter query
    const filter = { status: "Open" };

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
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(filter);

    // Get job statistics
    const stats = await getJobStatistics();

    sendResponse(res, 200, true, "Jobs fetched successfully", {
      jobs,
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
}

// Get Job By Id
async function getJobById(req, res, next) {
  try {
    const job = await Job.findById(req.params.id).populate(
      "postedBy",
      "firstName lastName"
    );
    if (!job) {
      return sendResponse(res, 404, false, "Job not found");
    }
    sendResponse(res, 200, true, "Job fetched successfully", job);
  } catch (error) {
    next(error);
  }
}

// Update Job
async function updateJob(req, res, next) {
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
}

// Delete Job
async function deleteJob(req, res, next) {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return sendResponse(res, 404, false, "Job not found");
    }
    sendResponse(res, 200, true, "Job deleted successfully");
  } catch (error) {
    next(error);
  }
}

// Enhanced Candidate Application with Duplicate Check
async function applyForJob(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { jobId } = req.params;
    const {
      name,
      email,
      phone,
      resume,
      coverLetter,
      currentLocation,
      currentCompany,
      currentDesignation,
      totalExperience,
      expectedSalary,
      noticePeriod,
      portfolio,
      linkedIn,
      github,
      source = "Website",
    } = req.body;

    // Check for duplicate application
    const existingApplication = await Candidate.findOne({
      job: jobId,
      email: email.toLowerCase(),
    }).session(session);

    if (existingApplication) {
      await session.abortTransaction();
      return sendResponse(
        res,
        400,
        false,
        "You have already applied for this job"
      );
    }

    // Validate job exists and is open
    const job = await Job.findOne({ _id: jobId, status: "Open" }).session(
      session
    );
    if (!job) {
      await session.abortTransaction();
      return sendResponse(res, 404, false, "Job not found or closed");
    }

    // Check if application deadline has passed
    if (job.deadline && new Date() > job.deadline) {
      await session.abortTransaction();
      return sendResponse(res, 400, false, "Application deadline has passed");
    }

    const candidate = await Candidate.create(
      [
        {
          job: jobId,
          name,
          email: email.toLowerCase(),
          phone,
          resume,
          coverLetter,
          currentLocation,
          currentCompany,
          currentDesignation,
          totalExperience,
          expectedSalary,
          noticePeriod,
          portfolio,
          linkedIn,
          github,
          source,
          stage: "Applied",
        },
      ],
      { session }
    );

    await session.commitTransaction();

    // Send confirmation email
    await sendApplicationConfirmation(candidate[0], job);

    // Auto-screening for qualified candidates
    await autoScreenCandidate(candidate[0]._id);

    sendResponse(
      res,
      201,
      true,
      "Application submitted successfully",
      candidate[0]
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
}

// Advanced Candidate Management
async function getCandidates(req, res, next) {
  try {
    const { jobId } = req.params;
    const {
      stage,
      status,
      source,
      minExperience,
      maxExperience,
      search,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = { job: jobId };

    if (stage) filter.stage = stage;
    if (status) filter.status = status;
    if (source) filter.source = source;
    if (minExperience || maxExperience) {
      filter.totalExperience = {};
      if (minExperience) filter.totalExperience.$gte = parseInt(minExperience);
      if (maxExperience) filter.totalExperience.$lte = parseInt(maxExperience);
    }
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { currentCompany: new RegExp(search, "i") },
        { currentDesignation: new RegExp(search, "i") },
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const candidates = await Candidate.find(filter)
      .populate("job", "title department")
      .populate("referredBy", "firstName lastName")
      .populate("interviews.interviewers", "firstName lastName")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Candidate.countDocuments(filter);

    // Get candidate statistics for this job
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
}

// AI-Powered Resume Ranking
async function rankCandidates(req, res, next) {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    const candidates = await Candidate.find({
      job: jobId,
      stage: { $in: ["Applied", "Resume Screening"] },
    });

    if (!candidates.length) {
      return sendResponse(res, 404, false, "No candidates found for ranking");
    }

    // AI-powered ranking
    const rankedCandidates = await rankResumes(job, candidates);

    // Update candidate scores in database
    const updatePromises = rankedCandidates.map((candidate) =>
      Candidate.findByIdAndUpdate(candidate._id, {
        aiScore: candidate.aiScore,
        overallRating: candidate.overallRating,
      })
    );

    await Promise.all(updatePromises);

    sendResponse(
      res,
      200,
      true,
      "Candidates ranked successfully",
      rankedCandidates
    );
  } catch (error) {
    next(error);
  }
}

// Enhanced Candidate Stage Management
async function updateCandidateStage(req, res, next) {
  try {
    const { id } = req.params;
    const { stage, notes, rejectionReason, notifyCandidate = true } = req.body;

    const candidate = await Candidate.findById(id).populate("job", "title");

    if (!candidate) {
      return sendResponse(res, 404, false, "Candidate not found");
    }

    const previousStage = candidate.stage;
    candidate.stage = stage;
    candidate.notes = notes || candidate.notes;

    if (["Rejected", "Offer Rejected"].includes(stage)) {
      candidate.rejectionReason = rejectionReason;
    }

    // Add to candidate history
    candidate.history = candidate.history || [];
    candidate.history.push({
      stage: stage,
      action: "Stage Updated",
      performedBy: req.user._id,
      notes: notes,
      timestamp: new Date(),
    });

    await candidate.save();

    // Send notification if enabled
    if (notifyCandidate) {
      await sendStageUpdateNotification(candidate, previousStage, stage);
    }

    sendResponse(
      res,
      200,
      true,
      "Candidate stage updated successfully",
      candidate
    );
  } catch (error) {
    next(error);
  }
}

// Advanced Interview Scheduling
async function scheduleInterview(req, res, next) {
  try {
    const { id } = req.params;
    const {
      round,
      date,
      interviewers,
      meetingLink,
      type,
      duration,
      instructions,
      requiredPreparation,
    } = req.body;

    const candidate = await Candidate.findById(id).populate("job", "title");

    if (!candidate) {
      return sendResponse(res, 404, false, "Candidate not found");
    }

    const interview = {
      round: round || `Round ${candidate.interviews.length + 1}`,
      date: new Date(date),
      interviewers,
      meetingLink,
      type: type || "Video",
      duration: duration || 60, // minutes
      instructions,
      requiredPreparation,
      status: "Scheduled",
    };

    candidate.interviews.push(interview);
    candidate.stage = getStageFromInterviewRound(interview.round);

    await candidate.save();

    // Send calendar invites to interviewers and candidate
    await sendInterviewInvites(candidate, interview);

    sendResponse(res, 200, true, "Interview scheduled successfully", {
      candidate,
      interview,
    });
  } catch (error) {
    next(error);
  }
}

// Interview Feedback Submission
async function submitInterviewFeedback(req, res, next) {
  try {
    const { id, interviewId } = req.params;
    const { feedback, rating, strengths, areasOfImprovement, recommendation } =
      req.body;

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
    interview.strengths = strengths;
    interview.areasOfImprovement = areasOfImprovement;
    interview.recommendation = recommendation;
    interview.status = "Completed";
    interview.completedAt = new Date();

    // Update candidate scores based on interview
    await updateCandidateScores(candidate, interview);

    await candidate.save();

    sendResponse(res, 200, true, "Feedback submitted successfully", candidate);
  } catch (error) {
    next(error);
  }
}

// Bulk Candidate Operations
async function bulkUpdateCandidates(req, res, next) {
  try {
    const { candidateIds, updates, notifyCandidates = false } = req.body;

    const result = await Candidate.updateMany(
      { _id: { $in: candidateIds } },
      updates
    );

    if (notifyCandidates) {
      // Send bulk notifications
      await sendBulkCandidateNotifications(candidateIds, updates);
    }

    sendResponse(
      res,
      200,
      true,
      `${result.modifiedCount} candidates updated successfully`
    );
  } catch (error) {
    next(error);
  }
}

// Recruitment Analytics Dashboard
async function getRecruitmentAnalytics(req, res, next) {
  try {
    const { timeframe = "30d", department } = req.query;

    const analytics = await getRecruitmentMetrics(timeframe, department);

    sendResponse(res, 200, true, "Analytics fetched successfully", analytics);
  } catch (error) {
    next(error);
  }
}

// Export all functions
module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  applyForJob,
  getCandidates,
  rankCandidates,
  updateCandidateStage,
  scheduleInterview,
  submitInterviewFeedback,
  bulkUpdateCandidates,
  getRecruitmentAnalytics,
};
