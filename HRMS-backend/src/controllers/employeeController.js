const Employee = require("../models/Employee");
const User = require("../models/User");
const { sendResponse } = require("../utils/responseHandler");
const mongoose = require("mongoose");

// Get all employees with advanced filtering
exports.getAllEmployees = async (req, res, next) => {
  try {
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

    // Filter functionality - only add to query if value is provided and valid
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

// Get employee by ID
exports.getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id).populate(
      "department designation reportingManager userId"
    );

    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    sendResponse(res, 200, true, "Employee fetched successfully", employee);
  } catch (error) {
    next(error);
  }
};

// Create new employee
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

    // Create user account first
    const user = new User({
      email: personalEmail,
      password: "Welcome123", // Default password
      role: "employee",
    });
    await user.save();

    // Prepare employee data - only include valid ObjectIds
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

    sendResponse(res, 201, true, "Employee created successfully", employee);
  } catch (error) {
    next(error);
  }
};

// Update employee
exports.updateEmployee = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    // Remove empty department and designation fields to avoid cast errors
    if (updates.department === "") {
      delete updates.department;
    }
    if (updates.designation === "") {
      delete updates.designation;
    }

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

    const employee = await Employee.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("department designation reportingManager");

    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    sendResponse(res, 200, true, "Employee updated successfully", employee);
  } catch (error) {
    next(error);
  }
};

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
