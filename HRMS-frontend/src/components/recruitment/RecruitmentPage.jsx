// src/pages/recruitment/RecruitmentPage.jsx

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  TrendingUp,
  Briefcase,
  MapPin,
  Clock,
  User,
  AlertCircle,
  DollarSign,
  X,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Star,
  MessageSquare,
  Video,
  Phone,
  Mail,
  Edit,
  Trash2,
  BarChart3,
  Brain,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import { apiService } from "../../services/apiService";

const RecruitmentPage = () => {
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();

  // ==================== STATE MANAGEMENT ====================
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  // Active view state
  const [activeView, setActiveView] = useState("jobs"); // "jobs" | "candidates" | "analytics"
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    department: "",
    location: "",
    employmentType: "",
    experience: "",
    search: "",
    status: "",
  });

  // Modals
  const [showJobModal, setShowJobModal] = useState(false);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  // New job form
  const [newJob, setNewJob] = useState({
    title: "",
    department: "",
    location: "",
    employmentType: "Full-Time",
    workMode: "Onsite",
    experience: "2-5 years",
    seniorityLevel: "Mid-Level",
    description: "",
    requirements: [""],
    responsibilities: [""],
    skills: [""],
    preferredSkills: [""],
    qualifications: [""],
    salary: { min: "", max: "", currency: "INR", isDisclosed: false },
    benefits: [""],
    vacancies: 1,
    deadline: "",
    hiringManager: user?._id || "",
    recruitmentProcess: "Standard",
    status: "Open",
  });

  // Application form
  const [applicationForm, setApplicationForm] = useState({
    resume: null,
    coverLetter: "",
    expectedSalary: "",
    noticePeriod: "",
    portfolioUrl: "",
    linkedinUrl: "",
    githubUrl: "",
  });

  // Interview scheduling
  const [interviewData, setInterviewData] = useState({
    candidateId: "",
    interviewDate: "",
    interviewTime: "",
    interviewType: "In-Person",
    interviewers: [],
    meetingLink: "",
    notes: "",
  });

  // ==================== LIFECYCLE HOOKS ====================
  useEffect(() => {
    loadJobs();
    loadStats();
    loadManagers();
  }, [filters]);

  useEffect(() => {
    if (activeView === "candidates" && selectedJob) {
      loadCandidates(selectedJob._id);
    }
  }, [activeView, selectedJob]);

  // ==================== DATA LOADING FUNCTIONS ====================
  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllJobs(filters);
      const jobsData =
        response.data?.jobs || response.jobs || response.data || [];
      setJobs(jobsData);
    } catch (error) {
      console.error("Error loading jobs:", error);
      showError("Failed to load jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Only load analytics if user is HR, Admin, or Manager
      if (["hr", "admin", "manager"].includes(user?.role?.toLowerCase())) {
        const response = await apiService.getRecruitmentAnalytics();
        if (response.success) {
          setStats(response.data);
        } else {
          setStats({
            openJobs: 0,
            totalApplications: 0,
            interviewsScheduled: 0,
            hiringRate: 0,
          });
        }
      } else {
        // For employees, set default stats
        setStats({
          openJobs: 0,
          totalApplications: 0,
          interviewsScheduled: 0,
          hiringRate: 0,
        });
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
      setStats({
        openJobs: 0,
        totalApplications: 0,
        interviewsScheduled: 0,
        hiringRate: 0,
      });
    }
  };
  const loadManagers = async () => {
    try {
      // Only load managers if user is HR, Admin, or Manager
      if (["hr", "admin", "manager"].includes(user?.role?.toLowerCase())) {
        const response = await apiService.getAllEmployees({
          role: "manager",
          status: "active",
        });

        // Handle different response structures
        let employeeList = [];

        if (response.success && response.data) {
          // Check if data is array or object with employees property
          if (Array.isArray(response.data)) {
            employeeList = response.data;
          } else if (Array.isArray(response.data.employees)) {
            employeeList = response.data.employees;
          }
        }

        // Filter and map managers
        const managersList = employeeList
          .filter(
            (emp) =>
              emp &&
              (emp.role === "manager" ||
                emp.role === "hr" ||
                emp.role === "admin")
          )
          .map((emp) => ({
            _id: emp._id,
            name: `${emp.firstName || ""} ${emp.lastName || ""}`.trim(),
            department: emp.department || "N/A",
          }));

        setManagers(managersList);
      } else {
        // For employees, set empty managers list
        setManagers([]);
      }
    } catch (error) {
      console.error("Failed to load managers:", error);
      setManagers([]); // Always set empty array on error
    }
  };

  const loadCandidates = async (jobId) => {
    try {
      setLoading(true);
      const response = await apiService.getCandidates(jobId);
      setCandidates(response.data?.candidates || response.candidates || []);
    } catch (error) {
      console.error("Error loading candidates:", error);
      showError("Failed to load candidates");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  // ==================== JOB MANAGEMENT FUNCTIONS ====================
  const handleCreateJob = async (e) => {
    e.preventDefault();

    if (!newJob.hiringManager) {
      showError("Please select a hiring manager");
      return;
    }

    try {
      const jobData = {
        ...newJob,
        requirements: newJob.requirements.filter((req) => req.trim() !== ""),
        responsibilities: newJob.responsibilities.filter(
          (resp) => resp.trim() !== ""
        ),
        skills: newJob.skills.filter((skill) => skill.trim() !== ""),
        preferredSkills: newJob.preferredSkills.filter(
          (skill) => skill.trim() !== ""
        ),
        qualifications: newJob.qualifications.filter(
          (qual) => qual.trim() !== ""
        ),
        benefits: newJob.benefits.filter((benefit) => benefit.trim() !== ""),
        salary: {
          ...newJob.salary,
          min: newJob.salary.min ? parseInt(newJob.salary.min) : undefined,
          max: newJob.salary.max ? parseInt(newJob.salary.max) : undefined,
        },
      };

      await apiService.createJob(jobData);
      showSuccess("Job posted successfully!");
      setShowJobModal(false);
      resetNewJobForm();
      setTimeout(() => loadJobs(), 500);
    } catch (error) {
      console.error("Job creation error:", error);
      showError(error.message || "Failed to create job");
    }
  };

  const handleUpdateJob = async (jobId, updates) => {
    try {
      await apiService.updateJob(jobId, updates);
      showSuccess("Job updated successfully!");
      loadJobs();
    } catch (error) {
      showError(error.message || "Failed to update job");
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;

    try {
      await apiService.deleteJob(jobId);
      showSuccess("Job deleted successfully!");
      loadJobs();
    } catch (error) {
      showError(error.message || "Failed to delete job");
    }
  };

  // ==================== APPLICATION FUNCTIONS ====================
  const handleApplyForJob = async (e) => {
    e.preventDefault();

    if (!applicationForm.resume) {
      showError("Please upload your resume");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("resume", applicationForm.resume);
      formData.append("coverLetter", applicationForm.coverLetter);
      formData.append("expectedSalary", applicationForm.expectedSalary);
      formData.append("noticePeriod", applicationForm.noticePeriod);
      formData.append("portfolioUrl", applicationForm.portfolioUrl);
      formData.append("linkedinUrl", applicationForm.linkedinUrl);
      formData.append("githubUrl", applicationForm.githubUrl);

      await apiService.applyForJob(selectedJob._id, formData);
      showSuccess("Application submitted successfully!");
      setShowApplyModal(false);
      resetApplicationForm();
    } catch (error) {
      console.error("Application error:", error);
      showError(error.message || "Failed to submit application");
    }
  };

  // ==================== CANDIDATE MANAGEMENT FUNCTIONS ====================
  const handleUpdateCandidateStatus = async (
    candidateId,
    status,
    feedback = ""
  ) => {
    try {
      await apiService.updateCandidateStatus(candidateId, { status, feedback });
      showSuccess(`Candidate status updated to ${status}`);
      loadCandidates(selectedJob._id);
    } catch (error) {
      showError(error.message || "Failed to update candidate status");
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();

    try {
      await apiService.scheduleInterview(interviewData.candidateId, {
        date: `${interviewData.interviewDate}T${interviewData.interviewTime}`,
        type: interviewData.interviewType,
        interviewers: interviewData.interviewers,
        meetingLink: interviewData.meetingLink,
        notes: interviewData.notes,
      });

      showSuccess("Interview scheduled successfully!");
      setShowInterviewModal(false);
      resetInterviewForm();
      loadCandidates(selectedJob._id);
    } catch (error) {
      showError(error.message || "Failed to schedule interview");
    }
  };

  const handleSubmitInterviewFeedback = async (candidateId, feedback) => {
    try {
      await apiService.submitInterviewFeedback(candidateId, feedback);
      showSuccess("Interview feedback submitted!");
      loadCandidates(selectedJob._id);
    } catch (error) {
      showError(error.message || "Failed to submit feedback");
    }
  };

  const handleRankCandidates = async (jobId) => {
    try {
      setLoading(true);
      const response = await apiService.rankCandidates(jobId);
      setCandidates(response.data?.rankedCandidates || []);
      showSuccess("Candidates ranked by AI successfully!");
    } catch (error) {
      showError(error.message || "Failed to rank candidates");
    } finally {
      setLoading(false);
    }
  };

  // ==================== HELPER FUNCTIONS ====================
  const resetNewJobForm = () => {
    setNewJob({
      title: "",
      department: "",
      location: "",
      employmentType: "Full-Time",
      workMode: "Onsite",
      experience: "2-5 years",
      seniorityLevel: "Mid-Level",
      description: "",
      requirements: [""],
      responsibilities: [""],
      skills: [""],
      preferredSkills: [""],
      qualifications: [""],
      salary: { min: "", max: "", currency: "INR", isDisclosed: false },
      benefits: [""],
      vacancies: 1,
      deadline: "",
      hiringManager: user?._id || "",
      recruitmentProcess: "Standard",
      status: "Open",
    });
  };

  const resetApplicationForm = () => {
    setApplicationForm({
      resume: null,
      coverLetter: "",
      expectedSalary: "",
      noticePeriod: "",
      portfolioUrl: "",
      linkedinUrl: "",
      githubUrl: "",
    });
  };

  const resetInterviewForm = () => {
    setInterviewData({
      candidateId: "",
      interviewDate: "",
      interviewTime: "",
      interviewType: "In-Person",
      interviewers: [],
      meetingLink: "",
      notes: "",
    });
  };

  const addArrayField = (field) => {
    setNewJob((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const updateArrayField = (field, index, value) => {
    setNewJob((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const removeArrayField = (field, index) => {
    setNewJob((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      department: "",
      location: "",
      employmentType: "",
      experience: "",
      search: "",
      status: "",
    });
  };

  const formatSalary = (salary) => {
    if (!salary || (!salary.min && !salary.max)) return "Salary not disclosed";
    if (salary.min && salary.max) {
      return `₹${salary.min?.toLocaleString()} - ₹${salary.max?.toLocaleString()}`;
    }
    if (salary.min) return `From ₹${salary.min?.toLocaleString()}`;
    if (salary.max) return `Up to ₹${salary.max?.toLocaleString()}`;
    return "Salary not disclosed";
  };

  const getStatusColor = (status) => {
    const colors = {
      Open: "bg-green-100 text-green-800",
      Closed: "bg-red-100 text-red-800",
      Draft: "bg-gray-100 text-gray-800",
      "On Hold": "bg-yellow-100 text-yellow-800",
      Cancelled: "bg-red-100 text-red-800",
      // Candidate statuses
      Applied: "bg-blue-100 text-blue-800",
      Screening: "bg-purple-100 text-purple-800",
      Interview: "bg-indigo-100 text-indigo-800",
      Offered: "bg-green-100 text-green-800",
      Hired: "bg-green-600 text-white",
      Rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Check if user can manage recruitment
  const isHROrAdmin = user?.role === "hr" || user?.role === "admin";
  const canCreateJob = isHROrAdmin || user?.role === "manager";

  // ==================== LOADING STATE ====================
  if (loading && jobs.length === 0 && candidates.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Recruitment & ATS
          </h1>
          <p className="text-gray-600">
            Manage job postings, candidates, and interviews
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {canCreateJob && (
            <button
              onClick={() => setShowJobModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Post New Job</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      {isHROrAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveView("jobs")}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === "jobs"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Briefcase className="h-4 w-4 inline mr-2" />
              Jobs
            </button>
            <button
              onClick={() => setActiveView("candidates")}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === "candidates"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Candidates
            </button>
            <button
              onClick={() => setActiveView("analytics")}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === "analytics"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Analytics
            </button>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Open Positions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.openJobs ||
                  stats.openPositions ||
                  jobs.filter((job) => job.status === "Open").length ||
                  0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Applications
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalApplications || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Interviews</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.interviewsScheduled || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hiring Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.hiringRate || 0}%
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {activeView === "jobs" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Department */}
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange("department", e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="Product">Product</option>
            </select>

            {/* Location */}
            <select
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Locations</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Delhi">Delhi</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Chennai">Chennai</option>
            </select>

            {/* Employment Type */}
            <select
              value={filters.employmentType}
              onChange={(e) =>
                handleFilterChange("employmentType", e.target.value)
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Types</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
              <option value="Remote">Remote</option>
            </select>

            {/* Experience */}
            <select
              value={filters.experience}
              onChange={(e) => handleFilterChange("experience", e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Experience</option>
              <option value="Fresher">Fresher</option>
              <option value="0-2 years">0-2 years</option>
              <option value="2-5 years">2-5 years</option>
              <option value="5-8 years">5-8 years</option>
              <option value="8+ years">8+ years</option>
            </select>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>
      )}

      {/* JOBS VIEW */}
      {activeView === "jobs" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                No jobs found
              </h3>
              <p className="text-gray-600 mb-4">
                {canCreateJob
                  ? "Post a new job to get started."
                  : "No open positions at the moment."}
              </p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {job.title}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ml-2 ${getStatusColor(
                      job.status
                    )}`}
                  >
                    {job.status}
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Briefcase className="h-4 w-4 mr-1" />
                  <span>{job.department}</span>
                </div>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>
                    {job.location} • {job.employmentType}
                  </span>
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {job.experience}
                  </span>
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                    {job.vacancies} position{job.vacancies > 1 ? "s" : ""}
                  </span>
                  {job.seniorityLevel && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      {job.seniorityLevel}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                  {job.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex flex-wrap gap-1">
                    {job.skills?.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills?.length > 3 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        +{job.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-indigo-600">
                    {formatSalary(job.salary)}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      setShowJobDetailsModal(true);
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Eye className="h-4 w-4 inline mr-1" />
                    View Details
                  </button>

                  {/* Employee Apply Button */}
                  {!isHROrAdmin && job.status === "Open" && (
                    <button
                      onClick={() => {
                        setSelectedJob(job);
                        setShowApplyModal(true);
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Send className="h-4 w-4 inline mr-1" />
                      Apply Now
                    </button>
                  )}

                  {/* HR/Admin Manage Button */}
                  {isHROrAdmin && (
                    <button
                      onClick={() => {
                        setSelectedJob(job);
                        setActiveView("candidates");
                        loadCandidates(job._id);
                      }}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Users className="h-4 w-4 inline mr-1" />
                      Manage ({job.applicantsCount || 0})
                    </button>
                  )}
                </div>

                {/* HR Admin Actions */}
                {isHROrAdmin && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setNewJob(job);
                        setShowJobModal(true);
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job._id)}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                )}

                {job.deadline && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>
                        Apply before:{" "}
                        {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* CANDIDATES VIEW */}
      {activeView === "candidates" && isHROrAdmin && (
        <div className="space-y-6">
          {/* Job Selection for Candidates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedJob
                    ? `Candidates for: ${selectedJob.title}`
                    : "Select a job to view candidates"}
                </h3>
                {selectedJob && (
                  <p className="text-sm text-gray-600">
                    {candidates.length} total application
                    {candidates.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {selectedJob && (
                  <button
                    onClick={() => handleRankCandidates(selectedJob._id)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                  >
                    <Brain className="h-5 w-5" />
                    <span>AI Rank Candidates</span>
                  </button>
                )}
                <select
                  value={selectedJob?._id || ""}
                  onChange={(e) => {
                    const job = jobs.find((j) => j._id === e.target.value);
                    setSelectedJob(job);
                    if (job) loadCandidates(job._id);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Job</option>
                  {jobs.map((job) => (
                    <option key={job._id} value={job._id}>
                      {job.title} ({job.applicantsCount || 0} applicants)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Candidates Table */}
          {candidates.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                No candidates yet
              </h3>
              <p className="text-gray-600">
                {selectedJob
                  ? "Applications will appear here once candidates apply."
                  : "Select a job to view candidates."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        AI Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Experience
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {candidates.map((candidate) => (
                      <tr key={candidate._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {candidate.name ||
                                  candidate.user?.firstName +
                                    " " +
                                    candidate.user?.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {candidate.email || candidate.user?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {candidate.aiScore ? (
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-500 mr-1" />
                              <span className="text-sm font-semibold text-gray-900">
                                {candidate.aiScore}/100
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {candidate.experience || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(
                            candidate.appliedAt || candidate.createdAt
                          ).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                              candidate.status
                            )}`}
                          >
                            {candidate.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setShowCandidateModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => {
                                setInterviewData({
                                  ...interviewData,
                                  candidateId: candidate._id,
                                });
                                setShowInterviewModal(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Calendar className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() =>
                                window.open(candidate.resumeUrl, "_blank")
                              }
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Download className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateCandidateStatus(
                                  candidate._id,
                                  "Rejected"
                                )
                              }
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS VIEW */}
      {activeView === "analytics" && isHROrAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Advanced Analytics Coming Soon
          </h3>
          <p className="text-gray-600 mb-6">
            Get insights on hiring trends, time-to-hire, source effectiveness,
            and more.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgTimeToHire || "N/A"}
              </p>
              <p className="text-sm text-gray-600">Avg. Time to Hire</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {stats.offerAcceptanceRate || "N/A"}%
              </p>
              <p className="text-sm text-gray-600">Offer Acceptance</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                ₹{stats.costPerHire || "N/A"}
              </p>
              <p className="text-sm text-gray-600">Cost Per Hire</p>
            </div>
          </div>
        </div>
      )}

      {/* CREATE/EDIT JOB MODAL */}
      {showJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {newJob._id ? "Edit Job" : "Create New Job"}
              </h2>
              <button
                onClick={() => {
                  setShowJobModal(false);
                  resetNewJobForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newJob.title}
                    onChange={(e) =>
                      setNewJob((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    required
                    value={newJob.department}
                    onChange={(e) =>
                      setNewJob((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                    <option value="Product">Product</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={newJob.location}
                    onChange={(e) =>
                      setNewJob((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Bangalore, Remote"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hiring Manager *
                  </label>
                  <select
                    required
                    value={newJob.hiringManager}
                    onChange={(e) =>
                      setNewJob((prev) => ({
                        ...prev,
                        hiringManager: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Hiring Manager</option>
                    {managers.map((manager) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.firstName} {manager.lastName}
                        {manager.department ? ` (${manager.department})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Type *
                  </label>
                  <select
                    required
                    value={newJob.employmentType}
                    onChange={(e) =>
                      setNewJob((prev) => ({
                        ...prev,
                        employmentType: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Mode *
                  </label>
                  <select
                    required
                    value={newJob.workMode}
                    onChange={(e) =>
                      setNewJob((prev) => ({
                        ...prev,
                        workMode: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Onsite">Onsite</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level *
                  </label>
                  <select
                    required
                    value={newJob.experience}
                    onChange={(e) =>
                      setNewJob((prev) => ({
                        ...prev,
                        experience: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Fresher">Fresher</option>
                    <option value="0-2 years">0-2 years</option>
                    <option value="2-5 years">2-5 years</option>
                    <option value="5-8 years">5-8 years</option>
                    <option value="8+ years">8+ years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seniority Level *
                  </label>
                  <select
                    required
                    value={newJob.seniorityLevel}
                    onChange={(e) =>
                      setNewJob((prev) => ({
                        ...prev,
                        seniorityLevel: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Intern">Intern</option>
                    <option value="Junior">Junior</option>
                    <option value="Mid-Level">Mid-Level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                    <option value="Manager">Manager</option>
                    <option value="Director">Director</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vacancies *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newJob.vacancies}
                    onChange={(e) =>
                      setNewJob((prev) => ({
                        ...prev,
                        vacancies: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recruitment Process
                  </label>
                  <select
                    value={newJob.recruitmentProcess}
                    onChange={(e) =>
                      setNewJob((prev) => ({
                        ...prev,
                        recruitmentProcess: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Fast-Track">Fast-Track</option>
                    <option value="Campus">Campus</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Min (₹)
                  </label>
                  <input
                    type="number"
                    value={newJob.salary.min}
                    onChange={(e) =>
                      setNewJob((prev) => ({
                        ...prev,
                        salary: { ...prev.salary, min: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Minimum salary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Max (₹)
                  </label>
                  <input
                    type="number"
                    value={newJob.salary.max}
                    onChange={(e) =>
                      setNewJob((prev) => ({
                        ...prev,
                        salary: { ...prev.salary, max: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Maximum salary"
                  />
                </div>

                <div className="md:col-span-2 flex items-center">
                  <input
                    type="checkbox"
                    id="isDisclosed"
                    checked={newJob.salary.isDisclosed}
                    onChange={(e) =>
                      setNewJob((prev) => ({
                        ...prev,
                        salary: {
                          ...prev.salary,
                          isDisclosed: e.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isDisclosed"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Disclose salary in job posting
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={newJob.deadline}
                    onChange={(e) =>
                      setNewJob((prev) => ({
                        ...prev,
                        deadline: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    required
                    rows="4"
                    value={newJob.description}
                    onChange={(e) =>
                      setNewJob((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Detailed job description..."
                  />
                </div>

                {/* Skills */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Skills
                  </label>
                  {newJob.skills.map((skill, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) =>
                          updateArrayField("skills", index, e.target.value)
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter skill"
                      />
                      {newJob.skills.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayField("skills", index)}
                          className="px-3 py-2 text-red-600 hover:text-red-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField("skills")}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Skill
                  </button>
                </div>

                {/* Responsibilities */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Responsibilities
                  </label>
                  {newJob.responsibilities.map((responsibility, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={responsibility}
                        onChange={(e) =>
                          updateArrayField(
                            "responsibilities",
                            index,
                            e.target.value
                          )
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter responsibility"
                      />
                      {newJob.responsibilities.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeArrayField("responsibilities", index)
                          }
                          className="px-3 py-2 text-red-600 hover:text-red-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField("responsibilities")}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Responsibility
                  </button>
                </div>

                {/* Requirements */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requirements
                  </label>
                  {newJob.requirements.map((requirement, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={requirement}
                        onChange={(e) =>
                          updateArrayField(
                            "requirements",
                            index,
                            e.target.value
                          )
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter requirement"
                      />
                      {newJob.requirements.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeArrayField("requirements", index)
                          }
                          className="px-3 py-2 text-red-600 hover:text-red-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField("requirements")}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Requirement
                  </button>
                </div>

                {/* Benefits */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Benefits
                  </label>
                  {newJob.benefits.map((benefit, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={benefit}
                        onChange={(e) =>
                          updateArrayField("benefits", index, e.target.value)
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter benefit"
                      />
                      {newJob.benefits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayField("benefits", index)}
                          className="px-3 py-2 text-red-600 hover:text-red-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField("benefits")}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Benefit
                  </button>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowJobModal(false);
                    resetNewJobForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {newJob._id ? "Update Job" : "Post Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOB DETAILS MODAL */}
      {showJobDetailsModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedJob.title}
                </h2>
                <div className="flex items-center space-x-3 mt-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                      selectedJob.status
                    )}`}
                  >
                    {selectedJob.status}
                  </span>
                  <span className="text-sm text-gray-600">
                    <Briefcase className="h-4 w-4 inline mr-1" />
                    {selectedJob.department}
                  </span>
                  <span className="text-sm text-gray-600">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    {selectedJob.location}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowJobDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Job Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Job Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Employment Type</p>
                    <p className="font-medium">{selectedJob.employmentType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Work Mode</p>
                    <p className="font-medium">{selectedJob.workMode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Experience Required</p>
                    <p className="font-medium">{selectedJob.experience}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Seniority Level</p>
                    <p className="font-medium">{selectedJob.seniorityLevel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vacancies</p>
                    <p className="font-medium">{selectedJob.vacancies}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Salary</p>
                    <p className="font-medium">
                      {formatSalary(selectedJob.salary)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {selectedJob.description}
                </p>
              </div>

              {/* Skills */}
              {selectedJob.skills && selectedJob.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Responsibilities */}
              {selectedJob.responsibilities &&
                selectedJob.responsibilities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Responsibilities
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      {selectedJob.responsibilities.map((resp, index) => (
                        <li key={index}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Requirements */}
              {selectedJob.requirements &&
                selectedJob.requirements.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Requirements
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      {selectedJob.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Benefits */}
              {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Benefits
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {selectedJob.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Apply Button */}
              {!isHROrAdmin && selectedJob.status === "Open" && (
                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowJobDetailsModal(false);
                      setShowApplyModal(true);
                    }}
                    className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2"
                  >
                    <Send className="h-5 w-5" />
                    <span>Apply for this Position</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* APPLICATION MODAL */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Apply for {selectedJob.title}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedJob.department} • {selectedJob.location}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowApplyModal(false);
                  resetApplicationForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleApplyForJob} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resume * (PDF, DOC, DOCX)
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    setApplicationForm((prev) => ({
                      ...prev,
                      resume: e.target.files[0],
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter
                </label>
                <textarea
                  rows="4"
                  value={applicationForm.coverLetter}
                  onChange={(e) =>
                    setApplicationForm((prev) => ({
                      ...prev,
                      coverLetter: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Tell us why you're a great fit for this role..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Salary (₹)
                  </label>
                  <input
                    type="number"
                    value={applicationForm.expectedSalary}
                    onChange={(e) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        expectedSalary: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 800000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Period (Days)
                  </label>
                  <input
                    type="number"
                    value={applicationForm.noticePeriod}
                    onChange={(e) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        noticePeriod: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portfolio URL
                </label>
                <input
                  type="url"
                  value={applicationForm.portfolioUrl}
                  onChange={(e) =>
                    setApplicationForm((prev) => ({
                      ...prev,
                      portfolioUrl: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://yourportfolio.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  value={applicationForm.linkedinUrl}
                  onChange={(e) =>
                    setApplicationForm((prev) => ({
                      ...prev,
                      linkedinUrl: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Profile
                </label>
                <input
                  type="url"
                  value={applicationForm.githubUrl}
                  onChange={(e) =>
                    setApplicationForm((prev) => ({
                      ...prev,
                      githubUrl: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://github.com/yourusername"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowApplyModal(false);
                    resetApplicationForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                >
                  <Send className="h-5 w-5" />
                  <span>Submit Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANDIDATE DETAILS MODAL */}
      {showCandidateModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedCandidate.name ||
                    selectedCandidate.user?.firstName +
                      " " +
                      selectedCandidate.user?.lastName}
                </h2>
                <p className="text-sm text-gray-600">
                  {selectedCandidate.email || selectedCandidate.user?.email}
                </p>
              </div>
              <button
                onClick={() => setShowCandidateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Candidate Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Experience</p>
                  <p className="font-medium">
                    {selectedCandidate.experience || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expected Salary</p>
                  <p className="font-medium">
                    ₹
                    {selectedCandidate.expectedSalary?.toLocaleString() ||
                      "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Notice Period</p>
                  <p className="font-medium">
                    {selectedCandidate.noticePeriod || "N/A"} days
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                      selectedCandidate.status
                    )}`}
                  >
                    {selectedCandidate.status}
                  </span>
                </div>
              </div>

              {/* AI Score */}
              {selectedCandidate.aiScore && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Brain className="h-6 w-6 text-yellow-600 mr-2" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          AI Matching Score
                        </p>
                        <p className="text-sm text-gray-600">
                          Based on resume analysis
                        </p>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-yellow-600">
                      {selectedCandidate.aiScore}/100
                    </div>
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              {selectedCandidate.coverLetter && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Cover Letter
                  </h3>
                  <p className="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                    {selectedCandidate.coverLetter}
                  </p>
                </div>
              )}

              {/* Links */}
              <div className="space-y-2">
                {selectedCandidate.portfolioUrl && (
                  <a
                    href={selectedCandidate.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-indigo-600 hover:text-indigo-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Portfolio
                  </a>
                )}
                {selectedCandidate.linkedinUrl && (
                  <a
                    href={selectedCandidate.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-indigo-600 hover:text-indigo-700"
                  >
                    LinkedIn Profile
                  </a>
                )}
                {selectedCandidate.githubUrl && (
                  <a
                    href={selectedCandidate.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-indigo-600 hover:text-indigo-700"
                  >
                    GitHub Profile
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() =>
                    handleUpdateCandidateStatus(
                      selectedCandidate._id,
                      "Screening"
                    )
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Move to Screening
                </button>
                <button
                  onClick={() => {
                    setInterviewData({
                      ...interviewData,
                      candidateId: selectedCandidate._id,
                    });
                    setShowCandidateModal(false);
                    setShowInterviewModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Schedule Interview
                </button>
                <button
                  onClick={() =>
                    handleUpdateCandidateStatus(
                      selectedCandidate._id,
                      "Rejected"
                    )
                  }
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTERVIEW SCHEDULING MODAL */}
      {showInterviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Schedule Interview
              </h2>
              <button
                onClick={() => {
                  setShowInterviewModal(false);
                  resetInterviewForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleScheduleInterview} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={interviewData.interviewDate}
                    onChange={(e) =>
                      setInterviewData((prev) => ({
                        ...prev,
                        interviewDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={interviewData.interviewTime}
                    onChange={(e) =>
                      setInterviewData((prev) => ({
                        ...prev,
                        interviewTime: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Type *
                </label>
                <select
                  required
                  value={interviewData.interviewType}
                  onChange={(e) =>
                    setInterviewData((prev) => ({
                      ...prev,
                      interviewType: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="In-Person">In-Person</option>
                  <option value="Video Call">Video Call</option>
                  <option value="Phone Call">Phone Call</option>
                </select>
              </div>

              {interviewData.interviewType === "Video Call" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    value={interviewData.meetingLink}
                    onChange={(e) =>
                      setInterviewData((prev) => ({
                        ...prev,
                        meetingLink: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://meet.google.com/xyz"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interviewers
                </label>
                <select
                  multiple
                  value={interviewData.interviewers}
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    );
                    setInterviewData((prev) => ({
                      ...prev,
                      interviewers: selected,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  size="4"
                >
                  {managers.map((manager) => (
                    <option key={manager._id} value={manager._id}>
                      {manager.firstName} {manager.lastName}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Hold Ctrl/Cmd to select multiple
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  rows="3"
                  value={interviewData.notes}
                  onChange={(e) =>
                    setInterviewData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Any additional notes for the interview..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowInterviewModal(false);
                    resetInterviewForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                >
                  <Calendar className="h-5 w-5" />
                  <span>Schedule Interview</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruitmentPage;
