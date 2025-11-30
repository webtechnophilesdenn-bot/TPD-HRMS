// services/leaveService.js
const API_BASE_URL = "http://localhost:5000/api/v1";

const leaveService = {
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

  // ==================== LEAVE APPLICATION ====================
  applyLeave: async (leaveData) => {
    console.log("🔄 Sending leave application:", leaveData);
    return await leaveService.request("/leaves/apply", {
      method: "POST",
      body: JSON.stringify(leaveData),
    });
  },

  // ==================== GET LEAVES ====================
  getMyLeaves: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== undefined &&
        filters[key] !== "" &&
        filters[key] !== null
      ) {
        params.append(key, filters[key]);
      }
    });

    const queryString = params.toString();
    const url = queryString
      ? `/leaves/my-leaves?${queryString}`
      : "/leaves/my-leaves";

    console.log("🔄 Fetching my leaves:", url);
    return await leaveService.request(url);
  },

  getPendingLeaves: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== undefined &&
        filters[key] !== "" &&
        filters[key] !== null
      ) {
        params.append(key, filters[key]);
      }
    });

    const queryString = params.toString();
    const url = queryString
      ? `/leaves/pending?${queryString}`
      : "/leaves/pending";

    console.log("🔄 Fetching pending leaves:", url);
    return await leaveService.request(url);
  },

  // ==================== LEAVE BALANCE ====================
  getLeaveBalance: async () => {
    console.log("🔄 Fetching leave balance");
    return await leaveService.request("/leaves/balance");
  },

  getEmployeeLeaveBalance: async (employeeId, year = new Date().getFullYear()) => {
    console.log(`🔄 Fetching leave balance for employee ${employeeId}, year ${year}`);
    return await leaveService.request(`/leaves/balance/${employeeId}?year=${year}`);
  },

  // ==================== LEAVE ACTIONS ====================
  updateLeaveStatus: async (leaveId, statusData) => {
    console.log(`🔄 Updating leave status for ${leaveId}:`, statusData);
    return await leaveService.request(`/leaves/${leaveId}/status`, {
      method: "PATCH",
      body: JSON.stringify(statusData),
    });
  },

  cancelLeave: async (leaveId) => {
    console.log(`🔄 Canceling leave: ${leaveId}`);
    return await leaveService.request(`/leaves/${leaveId}/cancel`, {
      method: "PATCH",
    });
  },

  // ==================== LEAVE BALANCE ADJUSTMENT (ADMIN/HR) ====================
  adjustLeaveBalance: async (employeeId, adjustmentData) => {
    console.log(`🔄 Adjusting leave balance for employee ${employeeId}:`, adjustmentData);
    return await leaveService.request(`/leaves/balance/${employeeId}/adjust`, {
      method: "PATCH",
      body: JSON.stringify(adjustmentData),
    });
  },

  // ==================== LEAVE TYPES ====================
  getLeaveTypes: async () => {
    console.log('🔄 Fetching leave types...');
    
    try {
      const response = await leaveService.request("/leaves/types");
      console.log('✅ Leave types API response:', response);
      return response;
      
    } catch (error) {
      console.log('⚠️ Leave types endpoint failed, trying fallbacks...');
      
      try {
        console.log('🔄 Trying debug endpoint...');
        const debugResponse = await leaveService.request("/leaves/debug/leave-types");
        if (debugResponse.data && debugResponse.data.activeLeaveTypes) {
          console.log('✅ Using debug endpoint data');
          return { 
            success: true, 
            data: debugResponse.data.activeLeaveTypes 
          };
        }
      } catch (debugError) {
        console.log('⚠️ Debug endpoint also failed');
      }
      
      try {
        console.log('🔄 Trying to get leave types from balance data...');
        const balanceResponse = await leaveService.request("/leaves/balance");
        
        if (balanceResponse.data && balanceResponse.data.balance) {
          const leaveTypes = balanceResponse.data.balance.map(balance => ({
            id: balance.code,
            code: balance.code,
            name: balance.name,
            description: balance.description || `${balance.name} - Available: ${balance.currentBalance} days`,
            isPaid: balance.isPaid !== undefined ? balance.isPaid : true,
            requiresApproval: balance.requiresApproval !== undefined ? balance.requiresApproval : true,
            currentBalance: balance.currentBalance || 0,
            maxBalance: balance.maxBalance || balance.currentBalance || 30,
            defaultBalance: balance.maxBalance || balance.currentBalance || 30,
            maxAccrual: balance.maxBalance || 30,
            minDuration: 0.5,
            maxDuration: balance.maxBalance || 30,
            minNoticePeriod: 1
          }));
          
          console.log(`✅ Created ${leaveTypes.length} leave types from balance data`);
          return { success: true, data: leaveTypes };
        }
      } catch (balanceError) {
        console.log('⚠️ Balance endpoint also failed');
      }
      
      console.log('🔄 Using hardcoded default leave types');
      const defaultLeaveTypes = [
        {
          id: 'casual',
          code: 'CASUAL',
          name: 'Casual Leave',
          description: 'For personal work, family functions, and casual purposes',
          isPaid: true,
          requiresApproval: true,
          currentBalance: 12,
          maxBalance: 15,
          defaultBalance: 12,
          maxAccrual: 15,
          minDuration: 0.5,
          maxDuration: 5,
          minNoticePeriod: 1
        },
        {
          id: 'sick',
          code: 'SICK',
          name: 'Sick Leave',
          description: 'For medical reasons and health-related issues',
          isPaid: true,
          requiresApproval: false,
          currentBalance: 12,
          maxBalance: 15,
          defaultBalance: 12,
          maxAccrual: 15,
          minDuration: 1,
          maxDuration: 15,
          minNoticePeriod: 0
        },
        {
          id: 'earned',
          code: 'EARNED',
          name: 'Earned Leave',
          description: 'Privilege or earned leave based on months worked',
          isPaid: true,
          requiresApproval: true,
          currentBalance: 0,
          maxBalance: 30,
          defaultBalance: 0,
          maxAccrual: 45,
          minDuration: 1,
          maxDuration: 30,
          minNoticePeriod: 7
        },
        {
          id: 'maternity',
          code: 'MATERNITY',
          name: 'Maternity Leave',
          description: 'For pregnancy and childbirth',
          isPaid: true,
          requiresApproval: true,
          currentBalance: 180,
          maxBalance: 180,
          defaultBalance: 180,
          maxAccrual: 180,
          minDuration: 84,
          maxDuration: 180,
          minNoticePeriod: 30
        },
        {
          id: 'paternity',
          code: 'PATERNITY',
          name: 'Paternity Leave',
          description: 'For new fathers',
          isPaid: true,
          requiresApproval: true,
          currentBalance: 15,
          maxBalance: 15,
          defaultBalance: 15,
          maxAccrual: 15,
          minDuration: 5,
          maxDuration: 15,
          minNoticePeriod: 15
        }
      ];
      
      return { success: true, data: defaultLeaveTypes };
    }
  },

  getLeaveTypesDebug: async () => {
    console.log("🔄 Fetching leave types debug info");
    return await leaveService.request("/leaves/debug/leave-types");
  },

  seedLeaveTypes: async () => {
    console.log("🔄 Seeding leave types");
    return await leaveService.request("/leaves/seed-leave-types", {
      method: "POST",
    });
  }
};

export default leaveService;