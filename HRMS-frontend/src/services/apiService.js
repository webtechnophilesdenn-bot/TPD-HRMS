const API_BASE_URL = "http://localhost:5000/api/v1";

export const apiService = {
  request: async (endpoint, options = {}) => {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  upload: async (endpoint, formData) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed");
      return data;
    } catch (error) {
      console.error("Upload Error:", error);
      throw error;
    }
  },

  // ==================== ONBOARDING APIs ====================
  createOnboarding: async (data) => {
    return await apiService.request("/onboarding", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // In your apiService.js - fix the getAllOnboardings method
  getAllOnboardings: async (status = "", page = 1, limit = 10) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);

    return await apiService.request(`/onboarding?${params.toString()}`);
  },

  getMyOnboarding: async () => {
    try {
      return await apiService.request("/onboarding/my-onboarding");
    } catch (error) {
      if (error.message.includes("404")) {
        return { data: null };
      }
      throw error;
    }
  },

  updateOnboardingProgress: async (id, updates) => {
    return await apiService.request(`/onboarding/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  updateOnboardingTask: async (id, taskId, completed) => {
    return await apiService.request(`/onboarding/${id}/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    });
  },

  uploadOnboardingDocument: async (id, document) => {
    return await apiService.request(`/onboarding/${id}/documents`, {
      method: "POST",
      body: JSON.stringify(document),
    });
  },

  submitOnboardingFeedback: async (id, week, rating, comments) => {
    return await apiService.request(`/onboarding/${id}/feedback`, {
      method: "POST",
      body: JSON.stringify({ week, rating, comments }),
    });
  },

  // ==================== OFFBOARDING APIs ====================
 // OFFBOARDING APIs
initiateOffboarding: async (data) => {
  return await apiService.request("/offboarding", {
    method: "POST",
    body: JSON.stringify(data),
  });
},

// FIX: getAllOffboardings with proper query params
getAllOffboardings: async (status = "", page = 1, limit = 10) => {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.append("status", status);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);
  
  return await apiService.request(`/offboarding?${params.toString()}`);
},

getMyOffboarding: async () => {
  try {
    return await apiService.request("/offboarding/my-offboarding");
  } catch (error) {
    if (error.message.includes("404")) {
      return { data: null };
    }
    throw error;
  }
},


  updateOffboardingProgress: async (id, updates) => {
    return await apiService.request(`/offboarding/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  markAssetReturned: async (id, assetIndex, condition, notes) => {
    return await apiService.request(`/offboarding/${id}/assets/${assetIndex}`, {
      method: "PATCH",
      body: JSON.stringify({ condition, notes }),
    });
  },

  updateClearance: async (id, clearanceIndex, cleared, remarks) => {
    return await apiService.request(
      `/offboarding/${id}/clearances/${clearanceIndex}`,
      {
        method: "PATCH",
        body: JSON.stringify({ cleared, remarks }),
      }
    );
  },

  conductExitInterview: async (id, interviewData) => {
    return await apiService.request(`/offboarding/${id}/exit-interview`, {
      method: "POST",
      body: JSON.stringify(interviewData),
    });
  },

  generateExitDocument: async (id, type, url) => {
    return await apiService.request(`/offboarding/${id}/documents`, {
      method: "POST",
      body: JSON.stringify({ type, url }),
    });
  },

  // ==================== AUTHENTICATION ====================
  login: async (email, password) => {
    const data = await apiService.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("token", data.data.token);
    localStorage.setItem("user", JSON.stringify(data.data.user));
    return data;
  },

  register: async (userData) => {
    return await apiService.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getProfile: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  getCurrentUser: async () => {
    return await apiService.request("/auth/me");
  },

  // ==================== EMPLOYEE MANAGEMENT ====================
  getAllEmployees: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    return await apiService.request(`/employees?${params.toString()}`);
  },

  getEmployee: async (id) => {
    return await apiService.request(`/employees/${id}`);
  },

  createEmployee: async (employeeData) => {
    return await apiService.request("/employees", {
      method: "POST",
      body: JSON.stringify(employeeData),
    });
  },

  updateEmployee: async (id, updates) => {
    return await apiService.request(`/employees/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  deleteEmployee: async (id) => {
    return await apiService.request(`/employees/${id}`, {
      method: "DELETE",
    });
  },

  bulkUpdateEmployees: async (updates) => {
    return await apiService.request("/employees/bulk-update", {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  getMyProfile: async () => {
    return await apiService.request("/employees/my-profile");
  },

  updateMyProfile: async (updates) => {
    return await apiService.request("/employees/my-profile", {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  uploadProfilePicture: async (formData) => {
    return await apiService.upload("/employees/my-profile/picture", formData);
  },

  getMyTeam: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    return await apiService.request(`/employees/my-team?${params.toString()}`);
  },

  getTeamHierarchy: async (department) => {
    const params = department ? `?department=${department}` : "";
    return await apiService.request(`/employees/team-hierarchy${params}`);
  },

  getDepartments: async () => {
    return await apiService.request("/departments");
  },

  createDepartment: async (departmentData) => {
    return await apiService.request("/departments", {
      method: "POST",
      body: JSON.stringify(departmentData),
    });
  },

  getDesignations: async () => {
    return await apiService.request("/designations");
  },

  createDesignation: async (designationData) => {
    return await apiService.request("/designations", {
      method: "POST",
      body: JSON.stringify(designationData),
    });
  },

  // ==================== ATTENDANCE ====================
  checkIn: async (location, ipAddress = "", deviceInfo = "") => {
    return await apiService.request("/attendance/check-in", {
      method: "POST",
      body: JSON.stringify({ location, ipAddress, deviceInfo }),
    });
  },

  checkOut: async (location, ipAddress = "", deviceInfo = "") => {
    return await apiService.request("/attendance/check-out", {
      method: "POST",
      body: JSON.stringify({ location, ipAddress, deviceInfo }),
    });
  },

  getMyAttendance: async (month, year, startDate, endDate, status) => {
    const params = new URLSearchParams();
    if (month) params.append("month", month);
    if (year) params.append("year", year);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (status) params.append("status", status);

    return await apiService.request(
      `/attendance/my-attendance?${params.toString()}`
    );
  },

  getTeamAttendance: async (
    month,
    year,
    department,
    employeeId,
    status,
    page,
    limit
  ) => {
    const params = new URLSearchParams();
    if (month) params.append("month", month);
    if (year) params.append("year", year);
    if (department) params.append("department", department);
    if (employeeId) params.append("employeeId", employeeId);
    if (status) params.append("status", status);
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);

    return await apiService.request(`/attendance/team?${params.toString()}`);
  },

  regularizeAttendance: async (data) => {
    return await apiService.request("/attendance/regularize", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  handleRegularization: async (id, status, remarks) => {
    return await apiService.request(`/attendance/regularize/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, remarks }),
    });
  },

  getAttendanceStats: async () => {
    return await apiService.request("/attendance/my-stats");
  },

  bulkUpdateAttendance: async (updates) => {
    return await apiService.request("/attendance/bulk-update", {
      method: "POST",
      body: JSON.stringify({ updates }),
    });
  },

  // ==================== LEAVE MANAGEMENT ====================
  applyLeave: async (leaveData) => {
    return await apiService.request("/leaves/apply", {
      method: "POST",
      body: JSON.stringify(leaveData),
    });
  },

  getMyLeaves: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });

    return await apiService.request(`/leaves/my-leaves?${params.toString()}`);
  },

  getLeaveBalance: async () => {
    return await apiService.request("/leaves/balance");
  },

  getPendingLeaves: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });

    return await apiService.request(`/leaves/pending?${params.toString()}`);
  },

  updateLeaveStatus: async (leaveId, status, comments) => {
    return await apiService.request(`/leaves/${leaveId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, comments }),
    });
  },

  cancelLeave: async (leaveId) => {
    return await apiService.request(`/leaves/${leaveId}/cancel`, {
      method: "PATCH",
    });
  },

  getLeaveAnalytics: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });

    return await apiService.request(`/leaves/analytics?${params.toString()}`);
  },

  // ==================== PAYROLL ====================
  getEligibleEmployees: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== "") {
        params.append(key, filters[key]);
      }
    });
    return await apiService.request(
      `/payroll/eligible-employees?${params.toString()}`
    );
  },

  getPayrollGenerationSummary: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== "") {
        params.append(key, filters[key]);
      }
    });
    return await apiService.request(
      `/payroll/generation-summary?${params.toString()}`
    );
  },

  generatePayroll: async (payrollData) => {
    return await apiService.request("/payroll/generate", {
      method: "POST",
      body: JSON.stringify(payrollData),
    });
  },

  getMyPayslips: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    return await apiService.request(
      `/payroll/my-payslips?${params.toString()}`
    );
  },

  getSalaryStructure: async () => {
    return await apiService.request("/payroll/salary-structure");
  },

  downloadPayslip: async (payslipId) => {
    const token = localStorage.getItem("token");
    window.open(
      `${API_BASE_URL}/payroll/${payslipId}/download?token=${token}`,
      "_blank"
    );
  },

  downloadPayrollReport: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const token = localStorage.getItem("token");
    window.open(
      `${API_BASE_URL}/payroll/report/download?${params.toString()}&token=${token}`,
      "_blank"
    );
  },

  getAllPayrolls: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    return await apiService.request(`/payroll?${params.toString()}`);
  },

  updatePayrollStatus: async (payrollId, statusData) => {
    return await apiService.request(`/payroll/${payrollId}/status`, {
      method: "PATCH",
      body: JSON.stringify(statusData),
    });
  },

  bulkUpdatePayrollStatus: async (updates) => {
    return await apiService.request("/payroll/bulk/status", {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  getPayrollAnalytics: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    return await apiService.request(`/payroll/analytics?${params.toString()}`);
  },

  // ==================== RECRUITMENT ====================
  createJob: async (jobData) => {
    return await apiService.request("/recruitment/jobs", {
      method: "POST",
      body: JSON.stringify(jobData),
    });
  },

  getAllJobs: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    return await apiService.request(`/recruitment/jobs?${params.toString()}`);
  },

  getJobById: async (jobId) => {
    return await apiService.request(`/recruitment/jobs/${jobId}`);
  },

  updateJob: async (jobId, updates) => {
    return await apiService.request(`/recruitment/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  deleteJob: async (jobId) => {
    return await apiService.request(`/recruitment/jobs/${jobId}`, {
      method: "DELETE",
    });
  },

  applyForJob: async (jobId, applicationData) => {
    return await apiService.request(`/recruitment/jobs/${jobId}/apply`, {
      method: "POST",
      body: JSON.stringify(applicationData),
    });
  },

  getCandidates: async (jobId, filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    return await apiService.request(
      `/recruitment/jobs/${jobId}/candidates?${params.toString()}`
    );
  },

  getCandidateById: async (candidateId) => {
    return await apiService.request(`/recruitment/candidates/${candidateId}`);
  },

  rankCandidates: async (jobId) => {
    return await apiService.request(`/recruitment/jobs/${jobId}/rank`, {
      method: "POST",
    });
  },

  updateCandidateStage: async (candidateId, stageData) => {
    return await apiService.request(
      `/recruitment/candidates/${candidateId}/stage`,
      {
        method: "PATCH",
        body: JSON.stringify(stageData),
      }
    );
  },

  bulkUpdateCandidates: async (updates) => {
    return await apiService.request("/recruitment/candidates/bulk-update", {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  scheduleInterview: async (candidateId, interviewData) => {
    return await apiService.request(
      `/recruitment/candidates/${candidateId}/interviews`,
      {
        method: "POST",
        body: JSON.stringify(interviewData),
      }
    );
  },

  submitInterviewFeedback: async (candidateId, interviewId, feedbackData) => {
    return await apiService.request(
      `/recruitment/candidates/${candidateId}/interviews/${interviewId}/feedback`,
      {
        method: "PATCH",
        body: JSON.stringify(feedbackData),
      }
    );
  },

  getInterviewDetails: async (candidateId, interviewId) => {
    return await apiService.request(
      `/recruitment/candidates/${candidateId}/interviews/${interviewId}`
    );
  },

  getRecruitmentAnalytics: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    return await apiService.request(
      `/recruitment/analytics?${params.toString()}`
    );
  },

  getHiringMetrics: async (timeframe = "30d") => {
    return await apiService.request(
      `/recruitment/metrics?timeframe=${timeframe}`
    );
  },

  // ==================== ASSET MANAGEMENT ====================
  createAsset: async (assetData) => {
    return await apiService.request("/assets", {
      method: "POST",
      body: JSON.stringify(assetData),
    });
  },

  getAllAssets: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    return await apiService.request(`/assets?${params.toString()}`);
  },

  getAssetById: async (assetId) => {
    return await apiService.request(`/assets/${assetId}`);
  },

  updateAsset: async (assetId, updates) => {
    return await apiService.request(`/assets/${assetId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  deleteAsset: async (assetId) => {
    return await apiService.request(`/assets/${assetId}`, {
      method: "DELETE",
    });
  },

  allocateAsset: async (assetId, allocationData) => {
    return await apiService.request(`/assets/${assetId}/allocate`, {
      method: "POST",
      body: JSON.stringify(allocationData),
    });
  },

  returnAsset: async (assetId, returnData) => {
    return await apiService.request(`/assets/${assetId}/return`, {
      method: "POST",
      body: JSON.stringify(returnData),
    });
  },

  addMaintenance: async (assetId, maintenanceData) => {
    return await apiService.request(`/assets/${assetId}/maintenance`, {
      method: "POST",
      body: JSON.stringify(maintenanceData),
    });
  },

  getMyAssets: async () => {
    return await apiService.request("/assets/my-assets");
  },

  requestAsset: async (requestData) => {
    return await apiService.request("/assets/request", {
      method: "POST",
      body: JSON.stringify(requestData),
    });
  },

  getAssetAnalytics: async () => {
    return await apiService.request("/assets/analytics");
  },

  // ==================== TRAINING ====================
  createTraining: async (trainingData) => {
    return await apiService.request("/training/programs", {
      method: "POST",
      body: JSON.stringify(trainingData),
    });
  },

  getAllTrainings: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    return await apiService.request(`/training/programs?${params.toString()}`);
  },

  getTrainingById: async (id) => {
    return await apiService.request(`/training/programs/${id}`);
  },

  enrollInTraining: async (programId) => {
    return await apiService.request(`/training/programs/${programId}/enroll`, {
      method: "POST",
    });
  },

  getMyTrainings: async () => {
    return await apiService.request("/training/my-trainings");
  },

  updateProgress: async (programId, progressData) => {
    return await apiService.request(
      `/training/programs/${programId}/progress`,
      {
        method: "PATCH",
        body: JSON.stringify(progressData),
      }
    );
  },

  submitFeedback: async (programId, feedback) => {
    return await apiService.request(
      `/training/programs/${programId}/feedback`,
      {
        method: "POST",
        body: JSON.stringify(feedback),
      }
    );
  },

  getTrainingAnalytics: async () => {
    return await apiService.request("/training/analytics");
  },

  updateTraining: async (programId, updates) => {
    return await apiService.request(`/training/programs/${programId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  deleteTraining: async (programId) => {
    return await apiService.request(`/training/programs/${programId}`, {
      method: "DELETE",
    });
  },

  approveEnrollment: async (programId, employeeId) => {
    return await apiService.request(`/training/programs/${programId}/approve`, {
      method: "POST",
      body: JSON.stringify({ employeeId }),
    });
  },

  createCourse: async (formData) => {
    return await apiService.upload("/training/courses", formData);
  },

  completeCourse: async (courseId, completionData) => {
    return await apiService.request(`/training/courses/${courseId}/complete`, {
      method: "POST",
      body: JSON.stringify(completionData),
    });
  },

  // ==================== ANNOUNCEMENTS ====================
  createAnnouncement: async (announcementData) => {
    return await apiService.request("/announcements", {
      method: "POST",
      body: JSON.stringify(announcementData),
    });
  },

  getAllAnnouncements: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    return await apiService.request(`/announcements?${params.toString()}`);
  },

  getAnnouncementById: async (id) => {
    return await apiService.request(`/announcements/${id}`);
  },

  updateAnnouncement: async (id, updates) => {
    return await apiService.request(`/announcements/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  deleteAnnouncement: async (id) => {
    return await apiService.request(`/announcements/${id}`, {
      method: "DELETE",
    });
  },

  addReaction: async (id, type) => {
    return await apiService.request(`/announcements/${id}/react`, {
      method: "POST",
      body: JSON.stringify({ type }),
    });
  },

  addComment: async (id, content) => {
    return await apiService.request(`/announcements/${id}/comment`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  acknowledgeAnnouncement: async (id) => {
    return await apiService.request(`/announcements/${id}/acknowledge`, {
      method: "POST",
    });
  },

  togglePinAnnouncement: async (id) => {
    return await apiService.request(`/announcements/${id}/pin`, {
      method: "PATCH",
    });
  },

  getAnnouncementAnalytics: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    return await apiService.request(
      `/announcements/analytics?${params.toString()}`
    );
  },

  // ==================== RECOGNITION ====================
  // ==================== RECOGNITION APIs ====================
  giveRecognition: async (recognitionData) => {
    return await apiService.request("/recognition", {
      method: "POST",
      body: JSON.stringify(recognitionData),
    });
  },

  getMyRecognitions: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== "") {
        params.append(key, filters[key]);
      }
    });
    return await apiService.request(
      `/recognition/my-awards?${params.toString()}`
    );
  },

  getAllRecognitions: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== "") {
        params.append(key, filters[key]);
      }
    });
    return await apiService.request(`/recognition?${params.toString()}`);
  },

  getRecognitionById: async (id) => {
    return await apiService.request(`/recognition/${id}`);
  },

  updateRecognitionStatus: async (id, statusData) => {
    return await apiService.request(`/recognition/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(statusData),
    });
  },

  addReaction: async (id, reactionType) => {
    return await apiService.request(`/recognition/${id}/react`, {
      method: "POST",
      body: JSON.stringify({ type: reactionType }),
    });
  },

  addComment: async (id, comment) => {
    return await apiService.request(`/recognition/${id}/comment`, {
      method: "POST",
      body: JSON.stringify({ content: comment }),
    });
  },

  getRecognitionAnalytics: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== "") {
        params.append(key, filters[key]);
      }
    });
    return await apiService.request(
      `/recognition/analytics?${params.toString()}`
    );
  },

  getEmployeeRecognitionSummary: async (employeeId, filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== "") {
        params.append(key, filters[key]);
      }
    });
    return await apiService.request(
      `/recognition/employee/${employeeId}/summary?${params.toString()}`
    );
  },
  // ==================== ANALYTICS ====================
  getDashboardStats: async () => {
    return await apiService.request("/analytics/dashboard");
  },

  getAttendanceReport: async (month, year, department) => {
    const params = new URLSearchParams({ month, year });
    if (department) params.append("department", department);
    return await apiService.request(
      `/analytics/attendance?${params.toString()}`
    );
  },

  getLeaveReport: async (year) => {
    return await apiService.request(`/analytics/leaves?year=${year}`);
  },

  getAttritionReport: async (year) => {
    return await apiService.request(`/analytics/attrition?year=${year}`);
  },

  // ==================== CHATBOT ====================
  chatWithBot: async (message) => {
    return await apiService.request("/chatbot", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },






// ==================== REPORTS ====================
getAttendanceReport: async (filters = {}) => {
  const params = new URLSearchParams();
  Object.keys(filters).forEach((key) => {
    if (filters[key]) params.append(key, filters[key]);
  });
  return await apiService.request(`/reports/attendance?${params.toString()}`);
},

getLeaveReport: async (filters = {}) => {
  const params = new URLSearchParams();
  Object.keys(filters).forEach((key) => {
    if (filters[key]) params.append(key, filters[key]);
  });
  return await apiService.request(`/reports/leave?${params.toString()}`);
},

getPayrollReport: async (filters = {}) => {
  const params = new URLSearchParams();
  Object.keys(filters).forEach((key) => {
    if (filters[key]) params.append(key, filters[key]);
  });
  return await apiService.request(`/reports/payroll?${params.toString()}`);
},

getEmployeeReport: async (filters = {}) => {
  const params = new URLSearchParams();
  Object.keys(filters).forEach((key) => {
    if (filters[key]) params.append(key, filters[key]);
  });
  return await apiService.request(`/reports/employee?${params.toString()}`);
},

getDepartmentReport: async () => {
  return await apiService.request('/reports/department');
},

getDashboardReport: async () => {
  return await apiService.request('/reports/dashboard');
},

  

  // ==================== COMPLIANCE & POLICY ====================
  createPolicy: async (policyData) => {
    return await apiService.request("/compliance/policies", {
      method: "POST",
      body: JSON.stringify(policyData),
    });
  },

  getAllPolicies: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== "") {
        params.append(key, filters[key]);
      }
    });
    return await apiService.request(
      `/compliance/policies?${params.toString()}`
    );
  },

  getPolicyById: async (policyId) => {
    return await apiService.request(`/compliance/policies/${policyId}`);
  },

  updatePolicy: async (policyId, updates) => {
    return await apiService.request(`/compliance/policies/${policyId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  deletePolicy: async (policyId) => {
    return await apiService.request(`/compliance/policies/${policyId}`, {
      method: "DELETE",
    });
  },

  publishPolicy: async (policyId) => {
    return await apiService.request(
      `/compliance/policies/${policyId}/publish`,
      {
        method: "POST",
      }
    );
  },

  sendPolicyReminders: async (policyId) => {
    return await apiService.request(
      `/compliance/policies/${policyId}/reminders`,
      {
        method: "POST",
      }
    );
  },

  getMyPendingAcknowledgments: async () => {
    return await apiService.request("/compliance/my-acknowledgments/pending");
  },

  acknowledgePolicy: async (policyId, acknowledgmentData) => {
    return await apiService.request(
      `/compliance/policies/${policyId}/acknowledge`,
      {
        method: "POST",
        body: JSON.stringify(acknowledgmentData),
      }
    );
  },

  signPolicy: async (policyId, signatureData) => {
    return await apiService.request(`/compliance/policies/${policyId}/sign`, {
      method: "POST",
      body: JSON.stringify(signatureData),
    });
  },

  trackPolicyView: async (policyId) => {
    return await apiService.request(
      `/compliance/policies/${policyId}/track-view`,
      {
        method: "POST",
      }
    );
  },

  getPolicyAcknowledgments: async (policyId, filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    return await apiService.request(
      `/compliance/policies/${policyId}/acknowledgments?${params.toString()}`
    );
  },

  createComplianceDocument: async (documentData) => {
    return await apiService.request("/compliance/documents", {
      method: "POST",
      body: JSON.stringify(documentData),
    });
  },

  getAllComplianceDocuments: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== "") {
        params.append(key, filters[key]);
      }
    });
    return await apiService.request(
      `/compliance/documents?${params.toString()}`
    );
  },

  getExpiringDocuments: async (days = 30) => {
    return await apiService.request(
      `/compliance/documents/expiring?days=${days}`
    );
  },

  getExpiredDocuments: async () => {
    return await apiService.request("/compliance/documents/expired");
  },

  updateComplianceDocument: async (documentId, updates) => {
    return await apiService.request(`/compliance/documents/${documentId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  deleteComplianceDocument: async (documentId) => {
    return await apiService.request(`/compliance/documents/${documentId}`, {
      method: "DELETE",
    });
  },

  sendDocumentExpiryAlert: async (documentId) => {
    return await apiService.request(
      `/compliance/documents/${documentId}/send-alert`,
      {
        method: "POST",
      }
    );
  },

  getComplianceDashboard: async () => {
    return await apiService.request("/compliance/dashboard");
  },

  uploadPolicyDocument: async (formData) => {
    return await apiService.upload("/compliance/policies/upload", formData);
  },

  uploadComplianceDoc: async (formData) => {
    return await apiService.upload("/compliance/documents/upload", formData);
  },

  uploadSignature: async (formData) => {
    return await apiService.upload("/compliance/signature/upload", formData);
  },
};





