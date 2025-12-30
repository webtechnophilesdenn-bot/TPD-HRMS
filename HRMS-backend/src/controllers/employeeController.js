const Employee = require("../models/Employee");
const User = require("../models/User");
const { sendResponse } = require("../utils/responseHandler");
const mongoose = require("mongoose");

// ==================== GET ALL EMPLOYEES ====================
const getAllEmployees = async (req, res, next) => {
  try {
    if (!["hr", "admin", "manager"].includes(req.user.role)) {
      return sendResponse(res, 403, false, "Access denied");
    }

    const {
      page = 1,
      limit = 100,
      search,
      department,
      status,
      employmentType,
      designation,
      workLocation,
    } = req.query;

    const query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { personalEmail: { $regex: search, $options: "i" } },
      ];
    }

    // Filter functionality
    if (department && mongoose.Types.ObjectId.isValid(department)) {
      query.department = department;
    }
    if (status) query.status = status;
    if (employmentType) query.employmentType = employmentType;
    if (designation && mongoose.Types.ObjectId.isValid(designation)) {
      query.designation = designation;
    }
    if (workLocation) query.workLocation = workLocation;

    const employees = await Employee.find(query)
      .populate("department designation reportingManager")
      .populate("userId", "email role")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Employee.countDocuments(query);

    sendResponse(res, 200, true, "Employees fetched successfully", employees, {
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET EMPLOYEE BY ID ====================
const getEmployeeById = async (req, res, next) => {
  try {
    const employeeId = req.params.id;

    const currentEmployee = await Employee.findOne({ userId: req.user._id });

    if (!currentEmployee) {
      return sendResponse(res, 404, false, "Employee profile not found");
    }

    let employee;

    if (
      employeeId === "me" ||
      employeeId === currentEmployee._id.toString() ||
      employeeId === currentEmployee.employeeId
    ) {
      employee = await Employee.findById(currentEmployee._id).populate(
        "department designation reportingManager userId"
      );
    } else if (["hr", "admin", "manager"].includes(req.user.role)) {
      employee = await Employee.findById(employeeId).populate(
        "department designation reportingManager userId"
      );
    } else {
      return sendResponse(res, 403, false, "Access denied");
    }

    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    sendResponse(res, 200, true, "Employee fetched successfully", employee);
  } catch (error) {
    next(error);
  }
};

// ==================== GET MY PROFILE ====================
const getMyProfile = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id })
      .populate("department designation reportingManager")
      .populate("userId", "email role");

    if (!employee) {
      return sendResponse(res, 404, false, "Employee profile not found");
    }

    sendResponse(res, 200, true, "Profile fetched successfully", employee);
  } catch (error) {
    next(error);
  }
};

// ==================== GET EMPLOYEE PROFILE (FULL) ====================
const getEmployeeProfile = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id })
      .populate("department designation reportingManager userId")
      .populate("documents.verifiedBy", "firstName lastName");

    if (!employee) {
      return sendResponse(res, 404, false, "Employee profile not found");
    }

    sendResponse(res, 200, true, "Profile fetched successfully", employee);
  } catch (error) {
    next(error);
  }
};

// ==================== CREATE EMPLOYEE ====================
const createEmployee = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      employeeId,
      personalEmail,
      phone,
      alternatePhone,
      department,
      designation,
      reportingManager,
      joiningDate,
      confirmationDate,
      employmentType,
      ctc,
      basicSalary,
      workLocation,
      workShift,
      probationPeriod,
      gender,
      dateOfBirth,
      address,
      bankDetails,
      statutoryDetails,
      emergencyContact,
      password,
      role = "employee",
      status = "Active",
    } = req.body;

    // Check if employee ID already exists
    const existingEmployee = await Employee.findOne({ employeeId });
    if (existingEmployee) {
      return sendResponse(res, 400, false, "Employee ID already exists");
    }

    // Check if email already exists
    const existingEmail = await Employee.findOne({ personalEmail });
    if (existingEmail) {
      return sendResponse(res, 400, false, "Email already exists");
    }

    // Check if user email already exists
    const existingUser = await User.findOne({ email: personalEmail });
    if (existingUser) {
      return sendResponse(
        res,
        400,
        false,
        "User with this email already exists"
      );
    }

    // Create user account
    const user = new User({
      email: personalEmail,
      password: password || "Welcome@123",
      role: role,
    });
    await user.save();

    // Prepare employee data
    const employeeData = {
      userId: user._id,
      employeeId,
      firstName,
      lastName,
      personalEmail,
      phone,
      alternatePhone,
      joiningDate,
      confirmationDate,
      employmentType: employmentType || "Full-Time",
      status: status,
      gender,
      dateOfBirth,
      workLocation,
      workShift: workShift || "Day",
      probationPeriod: probationPeriod || 3,
    };

    // Add references if valid
    if (department && mongoose.Types.ObjectId.isValid(department)) {
      employeeData.department = department;
    }

    if (designation && mongoose.Types.ObjectId.isValid(designation)) {
      employeeData.designation = designation;
    }

    if (reportingManager && mongoose.Types.ObjectId.isValid(reportingManager)) {
      employeeData.reportingManager = reportingManager;
    }

    // Add compensation
    if (ctc) employeeData.ctc = ctc;
    if (basicSalary) employeeData.basicSalary = basicSalary;

    // Add nested objects
    if (address) employeeData.address = address;
    if (bankDetails) employeeData.bankDetails = bankDetails;
    if (statutoryDetails) employeeData.statutoryDetails = statutoryDetails;
    if (emergencyContact) employeeData.emergencyContact = emergencyContact;

    // Create employee
    const employee = new Employee(employeeData);
    await employee.save();

    // Populate before sending response
    await employee.populate("department designation reportingManager");

    sendResponse(res, 201, true, "Employee created successfully", {
      employee,
      user: { email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== UPDATE EMPLOYEE ====================
const updateEmployee = async (req, res, next) => {
  try {
    const employeeId = req.params.id;
    const updates = { ...req.body };

    const currentEmployee = await Employee.findOne({ userId: req.user._id });

    if (!currentEmployee) {
      return sendResponse(res, 404, false, "Employee profile not found");
    }

    let employee;

    // Check permissions
    if (
      employeeId === currentEmployee._id.toString() ||
      employeeId === currentEmployee.employeeId
    ) {
      // Employee updating their own profile - restrict fields
      const allowedUpdates = [
        "phone",
        "alternatePhone",
        "personalEmail",
        "address",
        "dateOfBirth",
        "gender",
        "profilePicture",
        "bio",
        "emergencyContact",
        "bankDetails",
      ];

      Object.keys(updates).forEach((key) => {
        if (!allowedUpdates.includes(key)) {
          delete updates[key];
        }
      });

      employee = await Employee.findByIdAndUpdate(
        currentEmployee._id,
        updates,
        { new: true, runValidators: true }
      ).populate("department designation reportingManager");
    } else if (["hr", "admin"].includes(req.user.role)) {
      // Admin/HR can update any employee with all fields

      // Remove empty fields to avoid cast errors
      Object.keys(updates).forEach((key) => {
        if (updates[key] === "" || updates[key] === null) {
          delete updates[key];
        }
      });

      // Validate ObjectIds if provided
      if (
        updates.department &&
        !mongoose.Types.ObjectId.isValid(updates.department)
      ) {
        return sendResponse(res, 400, false, "Invalid department ID");
      }
      if (
        updates.designation &&
        !mongoose.Types.ObjectId.isValid(updates.designation)
      ) {
        return sendResponse(res, 400, false, "Invalid designation ID");
      }
      if (
        updates.reportingManager &&
        !mongoose.Types.ObjectId.isValid(updates.reportingManager)
      ) {
        return sendResponse(res, 400, false, "Invalid reporting manager ID");
      }

      employee = await Employee.findByIdAndUpdate(employeeId, updates, {
        new: true,
        runValidators: true,
      }).populate("department designation reportingManager");
    } else {
      return sendResponse(res, 403, false, "Access denied");
    }

    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    sendResponse(res, 200, true, "Employee updated successfully", employee);
  } catch (error) {
    next(error);
  }
};

// ==================== UPDATE MY PROFILE ====================
const updateMyProfile = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });

    if (!employee) {
      return sendResponse(res, 404, false, "Employee profile not found");
    }

    // Allow employees to update only certain fields
    const allowedUpdates = [
      "phone",
      "alternatePhone",
      "personalEmail",
      "address",
      "dateOfBirth",
      "gender",
      "bio",
      "profilePicture",
      "emergencyContact",
      "bankDetails",
    ];

    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employee._id,
      updates,
      { new: true, runValidators: true }
    ).populate("department designation reportingManager");

    sendResponse(
      res,
      200,
      true,
      "Profile updated successfully",
      updatedEmployee
    );
  } catch (error) {
    next(error);
  }
};

// ==================== DELETE EMPLOYEE ====================
const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    // Soft delete - update status
    employee.status = "Terminated";
    employee.exitDate = Date.now();
    await employee.save();

    sendResponse(res, 200, true, "Employee terminated successfully");
  } catch (error) {
    next(error);
  }
};

// ==================== UPLOAD DOCUMENT ====================
const uploadDocument = async (req, res, next) => {
  try {
    const { type, fileName, fileUrl } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    employee.documents.push({
      type,
      fileName,
      fileUrl,
      uploadedAt: Date.now(),
      isVerified: false,
    });
    await employee.save();

    sendResponse(res, 200, true, "Document uploaded successfully", employee);
  } catch (error) {
    next(error);
  }
};

// ==================== GET ORG CHART ====================
const getOrgChart = async (req, res, next) => {
  try {
    const { department } = req.query;

    const query = { status: "Active" };
    if (department) query.department = department;

    const employees = await Employee.find(query)
      .select(
        "firstName lastName employeeId designation department reportingManager profilePicture"
      )
      .populate("designation", "title")
      .populate("department", "name")
      .populate(
        "reportingManager",
        "firstName lastName employeeId profilePicture"
      );

    // Build hierarchical tree structure
    const buildTree = (employees, parentId = null) => {
      return employees
        .filter((emp) => {
          if (parentId === null) {
            return !emp.reportingManager;
          }
          return (
            emp.reportingManager &&
            emp.reportingManager._id.toString() === parentId.toString()
          );
        })
        .map((emp) => ({
          _id: emp._id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          fullName: `${emp.firstName} ${emp.lastName}`,
          employeeId: emp.employeeId,
          designation: emp.designation?.title || "N/A",
          department: emp.department?.name || "N/A",
          profilePicture: emp.profilePicture,
          reportingManager: emp.reportingManager
            ? {
                _id: emp.reportingManager._id,
                firstName: emp.reportingManager.firstName,
                lastName: emp.reportingManager.lastName,
                employeeId: emp.reportingManager.employeeId,
              }
            : null,
          children: buildTree(employees, emp._id),
        }));
    };

    const orgChart = buildTree(employees);

    sendResponse(res, 200, true, "Org chart fetched successfully", {
      orgChart,
      totalEmployees: employees.length,
      generatedAt: new Date(),
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET MY TEAM ====================
const getMyTeam = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = "Active" } = req.query;

    // Find current employee
    const currentEmployee = await Employee.findOne({ userId: req.user._id });

    if (!currentEmployee) {
      return sendResponse(res, 404, false, "Employee profile not found");
    }

    const query = {
      reportingManager: currentEmployee._id,
      status,
    };

    const teamMembers = await Employee.find(query)
      .select(
        "firstName lastName employeeId designation department personalEmail phone status joiningDate"
      )
      .populate("designation", "title")
      .populate("department", "name")
      .sort({ firstName: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Employee.countDocuments(query);

    sendResponse(res, 200, true, "Team members fetched successfully", {
      team: teamMembers,
      manager: {
        _id: currentEmployee._id,
        firstName: currentEmployee.firstName,
        lastName: currentEmployee.lastName,
        employeeId: currentEmployee.employeeId,
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET REPORTING MANAGERS ====================
const getReportingManagers = async (req, res, next) => {
  try {
    // First, get all active employees
    const allEmployees = await Employee.find({ status: "Active" })
      .populate("userId", "role")
      .populate("designation", "title")
      .populate("department", "name")
      .select("firstName lastName employeeId designation department userId")
      .sort({ firstName: 1 });

    // Filter employees who can be reporting managers (managers, hr, admin, or experienced employees)
    const managers = allEmployees.filter((emp) => {
      const userRole = emp.userId?.role;
      return (
        ["manager", "hr", "admin"].includes(userRole) ||
        (userRole === "employee" &&
          emp.designation?.title?.toLowerCase().includes("lead"))
      );
    });

    sendResponse(
      res,
      200,
      true,
      "Reporting managers fetched successfully",
      managers
    );
  } catch (error) {
    next(error);
  }
};
const sendBirthdayWish = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, wisherId, wisherName } = req.body;

    // Validate message
    if (!message || !message.trim()) {
      return sendResponse(res, 400, false, "Birthday message is required");
    }

    if (message.trim().length > 500) {
      return sendResponse(
        res,
        400,
        false,
        "Message cannot exceed 500 characters"
      );
    }

    // Find the employee to wish
    const employee = await Employee.findById(id);
    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    // Prevent self-wishing
    const currentEmployee = await Employee.findOne({ userId: req.user._id });
    if (employee._id.toString() === currentEmployee._id.toString()) {
      return sendResponse(
        res,
        400,
        false,
        "You cannot send a birthday wish to yourself"
      );
    }

    // Check if already wished today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alreadyWished = employee.birthdayWishes?.some((wish) => {
      const wishDate = new Date(wish.wishedAt);
      wishDate.setHours(0, 0, 0, 0);
      return (
        wish.wisherId?.toString() === currentEmployee._id.toString() &&
        wishDate.getTime() === today.getTime()
      );
    });

    if (alreadyWished) {
      return sendResponse(
        res,
        400,
        false,
        "You have already sent a birthday wish to this employee today"
      );
    }

    // Initialize birthdayWishes array if it doesn't exist
    if (!employee.birthdayWishes) {
      employee.birthdayWishes = [];
    }

    // Add new wish
    employee.birthdayWishes.push({
      wisherId: currentEmployee._id,
      wisherName:
        wisherName ||
        `${currentEmployee.firstName} ${currentEmployee.lastName}`,
      message: message.trim(),
      wishedAt: new Date(),
    });

    await employee.save();

    console.log(
      `✅ Birthday wish sent to ${employee.firstName} ${employee.lastName} by ${currentEmployee.firstName} ${currentEmployee.lastName}`
    );

    sendResponse(res, 200, true, "Birthday wish sent successfully! 🎉", {
      totalWishes: employee.birthdayWishes.length,
      employee: {
        firstName: employee.firstName,
        lastName: employee.lastName,
      },
    });
  } catch (error) {
    console.error("❌ Error sending birthday wish:", error);
    next(error);
  }
};

// ==================== GET BIRTHDAY WISHES ====================
const getBirthdayWishes = async (req, res, next) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id)
      .select("firstName lastName birthdayWishes dateOfBirth")
      .populate({
        path: "birthdayWishes.wisherId",
        select: "firstName lastName employeeId profilePicture",
      });

    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    // Sort wishes by most recent first
    const wishes = (employee.birthdayWishes || [])
      .sort((a, b) => new Date(b.wishedAt) - new Date(a.wishedAt))
      .map((wish) => ({
        _id: wish._id,
        wisherName: wish.wisherName,
        message: wish.message,
        wishedAt: wish.wishedAt,
        wisher: wish.wisherId
          ? {
              _id: wish.wisherId._id,
              firstName: wish.wisherId.firstName,
              lastName: wish.wisherId.lastName,
              employeeId: wish.wisherId.employeeId,
              profilePicture: wish.wisherId.profilePicture,
            }
          : null,
      }));

    sendResponse(res, 200, true, "Birthday wishes fetched successfully", {
      employee: {
        _id: employee._id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        dateOfBirth: employee.dateOfBirth,
      },
      wishes,
      totalWishes: wishes.length,
    });
  } catch (error) {
    console.error("❌ Error fetching birthday wishes:", error);
    next(error);
  }
};

// ==================== EXPORT ALL FUNCTIONS ====================
module.exports = {
  getAllEmployees,
  getEmployeeById,
  getMyProfile,
  getEmployeeProfile, // ADD THIS
  createEmployee,
  updateEmployee,
  updateMyProfile,
  deleteEmployee,
  uploadDocument,
  getOrgChart,
  getMyTeam,
  getReportingManagers,
  sendBirthdayWish,
  getBirthdayWishes,
};
