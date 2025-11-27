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
  Eye
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import { apiService } from "../../services/apiService";

const RecruitmentPage = () => {
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    department: "",
    location: "",
    employmentType: "",
    experience: "",
    search: "",
    status: "", // Add status filter
  });
  const [showJobModal, setShowJobModal] = useState(false);
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
    status: "Open", // Change from "Draft" to "Open" to show immediately
  });

  useEffect(() => {
    loadJobs();
    loadStats();
    loadManagers();
  }, [filters]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      console.log("Loading jobs with filters:", filters);
      
      const response = await apiService.getAllJobs(filters);
      console.log("Jobs API Response:", response);
      
      // Handle different response structures
      let jobsData = [];
      if (response && typeof response === 'object') {
        jobsData = response.data?.jobs || response.jobs || response.data || [];
      }
      
      console.log("Extracted jobs data:", jobsData);
      setJobs(jobsData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading jobs:", error);
      showError("Failed to load jobs");
      setJobs([]);
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.getRecruitmentAnalytics();
      console.log("Stats response:", response);
      setStats(response.data || response || {});
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const loadManagers = async () => {
    try {
      let managersData = [];
      
      try {
        const response = await apiService.getAllEmployees();
        console.log("Managers API Response:", response);
        
        managersData = response.data?.employees || response.employees || response.data || [];
        
        console.log("Fetched employees:", managersData);
        
        if (managersData.length > 0) {
          const potentialManagers = managersData.filter(emp => 
            emp.role === 'manager' || 
            emp.role === 'admin' || 
            emp.role === 'hr' ||
            emp.designation?.toLowerCase().includes('manager') ||
            emp.designation?.toLowerCase().includes('lead') ||
            emp.designation?.toLowerCase().includes('head')
          );
          
          managersData = potentialManagers.length > 0 ? potentialManagers : managersData.slice(0, 10);
        }
      } catch (error) {
        console.log("Could not fetch employees from API:", error);
      }

      if (managersData.length === 0 && user) {
        console.log("No managers found, using current user as fallback");
        managersData = [{
          _id: user._id,
          firstName: user.firstName || 'You',
          lastName: user.lastName || '',
          email: user.email || '',
          department: user.department || 'General',
          designation: user.designation || 'User'
        }];
      }

      setManagers(managersData);
      
      if (managersData.length > 0 && !newJob.hiringManager) {
        const defaultManager = managersData[0]._id;
        setNewJob(prev => ({
          ...prev,
          hiringManager: defaultManager
        }));
      }
    } catch (error) {
      console.error("Failed to load managers:", error);
      if (user) {
        setManagers([{
          _id: user._id,
          firstName: user.firstName || 'You',
          lastName: user.lastName || '',
          email: user.email || '',
          department: user.department || 'General'
        }]);
        setNewJob(prev => ({
          ...prev,
          hiringManager: user._id
        }));
      }
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    
    if (!newJob.hiringManager) {
      showError("Please select a hiring manager");
      return;
    }

    try {
      console.log("Creating job with data:", newJob);
      
      const jobData = {
        ...newJob,
        requirements: newJob.requirements.filter(req => req.trim() !== ""),
        responsibilities: newJob.responsibilities.filter(resp => resp.trim() !== ""),
        skills: newJob.skills.filter(skill => skill.trim() !== ""),
        preferredSkills: newJob.preferredSkills.filter(skill => skill.trim() !== ""),
        qualifications: newJob.qualifications.filter(qual => qual.trim() !== ""),
        benefits: newJob.benefits.filter(benefit => benefit.trim() !== ""),
        salary: {
          ...newJob.salary,
          min: newJob.salary.min ? parseInt(newJob.salary.min) : undefined,
          max: newJob.salary.max ? parseInt(newJob.salary.max) : undefined,
        }
      };

      const response = await apiService.createJob(jobData);
      console.log("Job creation response:", response);
      
      showSuccess("Job posted successfully!");
      setShowJobModal(false);
      resetNewJobForm();
      
      // Reload jobs after a short delay to ensure backend has processed
      setTimeout(() => {
        loadJobs();
      }, 500);
      
    } catch (error) {
      console.error("Job creation error:", error);
      showError(error.message || "Failed to create job");
    }
  };

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
      status: "Open", // Changed to "Open"
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
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Debug: Log current state
  useEffect(() => {
    console.log("Current jobs state:", jobs);
    console.log("Current filters:", filters);
  }, [jobs, filters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruitment</h1>
          <p className="text-gray-600">
            Manage job postings and candidate applications
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Debug button to check current state */}
          <button
            onClick={() => {
              console.log("Current jobs:", jobs);
              console.log("Current filters:", filters);
              loadJobs();
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>Debug</span>
          </button>
          
          {(user?.role === "hr" || user?.role === "admin" || user?.role === "manager") && (
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Open Positions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.openJobs || stats.openPositions || jobs.filter(job => job.status === 'Open').length || 0}
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

          {/* Status Filter - NEW */}
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

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or post a new job.
            </p>
            <div className="text-sm text-gray-500">
              <p>Current filters: {JSON.stringify(filters)}</p>
              <p>Total jobs in system: {jobs.length}</p>
            </div>
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
                  className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ml-2 ${getStatusColor(job.status)}`}
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
                <span>{job.location} • {job.employmentType}</span>
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

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-indigo-600">
                  {formatSalary(job.salary)}
                </span>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    View Details
                  </button>
                  {(user?.role === "hr" || user?.role === "admin") && (
                    <button className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Manage
                    </button>
                  )}
                </div>
              </div>

              {job.deadline && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Apply before: {new Date(job.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>


      {/* Create Job Modal */}
      {showJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                Create New Job
              </h2>
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
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField("skills")}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    + Add Skill
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
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField("responsibilities")}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    + Add Responsibility
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
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField("benefits")}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    + Add Benefit
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create Job
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
