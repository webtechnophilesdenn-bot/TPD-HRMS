// controllers/employeeController.js
const Employee = require("../models/Employee");
const User = require("../models/User");
const { sendResponse } = require("../utils/responseHandler");
const mongoose = require("mongoose");

// Get all employees with advanced filtering (Admin/HR/Manager only)
exports.getAllEmployees = async (req, res, next) => {
  try {
    // Check if user has permission to view all employees
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

    const employees = await Employee.find(query)
      .populate("department designation reportingManager")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Employee.countDocuments(query);

    sendResponse(res, 200, true, "Employees fetched successfully", employees);
  } catch (error) {
    next(error);
  }
};

// Get employee by ID (Modified for security)
exports.getEmployeeById = async (req, res, next) => {
  try {
    const employeeId = req.params.id;
    
    // Find current user's employee profile
    const currentEmployee = await Employee.findOne({ userId: req.user._id });
    
    if (!currentEmployee) {
      return sendResponse(res, 404, false, "Employee profile not found");
    }

    let employee;
    
    // Check if user is trying to access their own profile or has admin rights
    if (employeeId === "me" || employeeId === currentEmployee._id.toString() || 
        employeeId === currentEmployee.employeeId) {
      // User is accessing their own profile
      employee = await Employee.findById(currentEmployee._id)
        .populate("department designation reportingManager userId");
    } 
    else if (["hr", "admin", "manager"].includes(req.user.role)) {
      // Admin/HR/Manager can access any employee
      employee = await Employee.findById(employeeId)
        .populate("department designation reportingManager userId");
    } 
    else {
      // Regular employee trying to access another employee's data
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

// NEW: Get full profile for logged-in employee
exports.getEmployeeProfile = async (req, res, next) => {
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

// Create new employee (Admin/HR only) - Enhanced with password
exports.createEmployee = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      employeeId,
      personalEmail,
      phone,
      department,
      designation,
      joiningDate,
      employmentType,
      ctc,
      workLocation,
      gender,
      dateOfBirth,
      address,
      password, // NEW: Password field
      role = "employee", // Default role
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
      return sendResponse(res, 400, false, "User with this email already exists");
    }

    // Create user account with provided password or default
    const user = new User({
      email: personalEmail,
      password: password || "Welcome123", // Use provided password or default
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
      joiningDate,
      employmentType: employmentType || "Full-Time",
      status: "Active",
    };

    // Only add department if it's a valid ObjectId
    if (department && mongoose.Types.ObjectId.isValid(department)) {
      employeeData.department = department;
    }

    // Only add designation if it's a valid ObjectId
    if (designation && mongoose.Types.ObjectId.isValid(designation)) {
      employeeData.designation = designation;
    }

    // Add optional fields if provided
    if (ctc) employeeData.ctc = ctc;
    if (workLocation) employeeData.workLocation = workLocation;
    if (gender) employeeData.gender = gender;
    if (dateOfBirth) employeeData.dateOfBirth = dateOfBirth;
    if (address) employeeData.address = address;

    // Create employee
    const employee = new Employee(employeeData);
    await employee.save();

    // Populate before sending response
    await employee.populate("department designation");

    sendResponse(res, 201, true, "Employee created successfully", {
      employee,
      user: { email: user.email, role: user.role } // Don't send password
    });
  } catch (error) {
    next(error);
  }
};

// Update employee (Modified for security)
exports.updateEmployee = async (req, res, next) => {
  try {
    const employeeId = req.params.id;
    const updates = { ...req.body };
    
    // Find current user's employee profile
    const currentEmployee = await Employee.findOne({ userId: req.user._id });
    
    if (!currentEmployee) {
      return sendResponse(res, 404, false, "Employee profile not found");
    }

    let employee;
    
    // Check permissions
    if (employeeId === currentEmployee._id.toString() || 
        employeeId === currentEmployee.employeeId) {
      // Employee updating their own profile - restrict fields
      const allowedUpdates = [
        "phone", "alternatePhone", "personalEmail", "address", 
        "dateOfBirth", "gender", "profilePicture", "bio"
      ];
      
      Object.keys(updates).forEach(key => {
        if (!allowedUpdates.includes(key)) {
          delete updates[key];
        }
      });
      
      employee = await Employee.findByIdAndUpdate(currentEmployee._id, updates, {
        new: true,
        runValidators: true,
      }).populate("department designation reportingManager");
    } 
    else if (["hr", "admin"].includes(req.user.role)) {
      // Admin/HR can update any employee with all fields
      
      // Remove empty department and designation fields to avoid cast errors
      if (updates.department === "") delete updates.department;
      if (updates.designation === "") delete updates.designation;

      // Validate ObjectIds if provided
      if (updates.department && !mongoose.Types.ObjectId.isValid(updates.department)) {
        return sendResponse(res, 400, false, "Invalid department ID");
      }
      if (updates.designation && !mongoose.Types.ObjectId.isValid(updates.designation)) {
        return sendResponse(res, 400, false, "Invalid designation ID");
      }

      employee = await Employee.findByIdAndUpdate(employeeId, updates, {
        new: true,
        runValidators: true,
      }).populate("department designation reportingManager");
    } 
    else {
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

// ... rest of the controller methods remain the same ...

// Delete employee (soft delete)
exports.deleteEmployee = async (req, res, next) => {
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

// Upload document
exports.uploadDocument = async (req, res, next) => {
  try {
    const { type, url } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    employee.documents.push({ type, url });
    await employee.save();

    sendResponse(res, 200, true, "Document uploaded successfully", employee);
  } catch (error) {
    next(error);
  }
};

// Get employee profile (for the employee themselves)
exports.getMyProfile = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id }).populate(
      "department designation reportingManager"
    );

    if (!employee) {
      return sendResponse(res, 404, false, "Employee profile not found");
    }

    sendResponse(res, 200, true, "Profile fetched successfully", employee);
  } catch (error) {
    next(error);
  }
};

// Update employee profile (for the employee themselves)
exports.updateMyProfile = async (req, res, next) => {
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



// Add these functions to your existing employeeController.js

// ==================== GET ORG CHART ====================
exports.getOrgChart = async (req, res, next) => {
  try {
    const { department } = req.query;
    
    const query = { status: 'Active' };
    if (department) query.department = department;

    const employees = await Employee.find(query)
      .select('firstName lastName employeeId designation department reportingManager profilePicture')
      .populate('designation', 'title')
      .populate('department', 'name')
      .populate('reportingManager', 'firstName lastName employeeId profilePicture');

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
          designation: emp.designation?.title || 'N/A',
          department: emp.department?.name || 'N/A',
          profilePicture: emp.profilePicture,
          reportingManager: emp.reportingManager ? {
            _id: emp.reportingManager._id,
            firstName: emp.reportingManager.firstName,
            lastName: emp.reportingManager.lastName,
            employeeId: emp.reportingManager.employeeId,
          } : null,
          children: buildTree(employees, emp._id),
        }));
    };

    const orgChart = buildTree(employees);

    sendResponse(res, 200, true, 'Org chart fetched successfully', {
      orgChart,
      totalEmployees: employees.length,
      generatedAt: new Date(),
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET MY TEAM (Manager View) ====================
exports.getMyTeam = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'Active' } = req.query;

    // Find current employee
    const currentEmployee = await Employee.findOne({ userId: req.user.id });
    
    if (!currentEmployee) {
      return sendResponse(res, 404, false, 'Employee profile not found');
    }

    const query = {
      reportingManager: currentEmployee._id,
      status,
    };

    const teamMembers = await Employee.find(query)
      .select('firstName lastName employeeId designation department email phone status joiningDate')
      .populate('designation', 'title')
      .populate('department', 'name')
      .sort({ firstName: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Employee.countDocuments(query);

    sendResponse(res, 200, true, 'Team members fetched successfully', {
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





// controllers/employeeController.js
// Add this new method to your existing controller

// NEW: Get full profile for logged-in employee
exports.getEmployeeProfile = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id })
      .populate("department designation reportingManager userId")
      .populate("documents.verifiedBy", "firstName lastName")
      .populate("education")
      .populate("workExperience")
      .populate("skills");

    if (!employee) {
      return sendResponse(res, 404, false, "Employee profile not found");
    }

    sendResponse(res, 200, true, "Profile fetched successfully", employee);
  } catch (error) {
    next(error);
  }
};