// controllers/onboarding.controller.js
const Onboarding = require('../models/Onboarding');
const Employee = require('../models/Employee');
const { sendResponse } = require('../utils/responseHandler');
const { sendEmail } = require('../utils/emailService');

// Create Onboarding
exports.createOnboarding = async (req, res, next) => {
  try {
    const { employeeId, joiningDate, buddy, manager } = req.body;

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    // Check if onboarding already exists
    const existing = await Onboarding.findOne({ employee: employeeId });
    if (existing) {
      return sendResponse(res, 400, false, 'Onboarding already exists for this employee');
    }

    const defaultTasks = [
      {
        title: "Complete personal information form",
        assignedTo: "Employee",
        dueDate: new Date(joiningDate),
        priority: "High",
      },
      {
        title: "Submit required documents",
        assignedTo: "Employee",
        dueDate: new Date(joiningDate),
        priority: "High",
      },
      {
        title: "Create email account",
        assignedTo: "IT",
        dueDate: new Date(joiningDate),
        priority: "High",
      },
      {
        title: "Assign laptop and accessories",
        assignedTo: "IT",
        dueDate: new Date(joiningDate),
        priority: "High",
      },
      {
        title: "Setup payroll",
        assignedTo: "HR",
        dueDate: new Date(joiningDate),
        priority: "High",
      },
      {
        title: "Conduct orientation session",
        assignedTo: "HR",
        dueDate: new Date(joiningDate),
        priority: "Medium",
      },
      {
        title: "Department introduction",
        assignedTo: "Manager",
        dueDate: new Date(joiningDate),
        priority: "Medium",
      },
    ];

    const onboarding = await Onboarding.create({
      employee: employeeId,
      joiningDate,
      buddy: buddy || null,
      manager: manager || null,
      tasks: defaultTasks,
    });

    // Update employee status
    await Employee.findByIdAndUpdate(employeeId, {
      status: 'Active',
      joiningDate: joiningDate
    });

    // Send welcome email
    const employeeWithUser = await Employee.findById(employeeId).populate('userId');
    if (employeeWithUser && employeeWithUser.userId) {
      await sendEmail({
        to: employeeWithUser.userId.email,
        subject: 'Welcome to the Team!',
        template: 'welcome',
        data: {
          name: employeeWithUser.firstName,
          joiningDate: new Date(joiningDate).toLocaleDateString()
        },
      });
    }

    sendResponse(res, 201, true, 'Onboarding created successfully', onboarding);
  } catch (error) {
    console.error('Create onboarding error:', error);
    next(error);
  }
};

// Get All Onboardings
exports.getAllOnboardings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status && status !== 'all') query.status = status;

    const onboardings = await Onboarding.find(query)
      .populate("employee", "firstName lastName employeeId email department designation")
      .populate("buddy", "firstName lastName email")
      .populate("manager", "firstName lastName email")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Onboarding.countDocuments(query);

    sendResponse(res, 200, true, "Onboardings fetched successfully", {
      onboardings,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count,
    });
  } catch (error) {
    console.error('Get all onboardings error:', error);
    next(error);
  }
};

// Get My Onboarding - FIXED
exports.getMyOnboarding = async (req, res, next) => {
  try {
    console.log('Getting onboarding for user:', req.user.id);
    
    // Find employee by userId
    const employee = await Employee.findOne({ userId: req.user.id });
    
    if (!employee) {
      console.log('Employee not found for user:', req.user.id);
      return sendResponse(res, 404, false, 'Employee not found');
    }
    
    console.log('Employee found:', employee._id);
    
    // FIX: Use employee._id instead of employee.id
    const onboarding = await Onboarding.findOne({ employee: employee._id })
      .populate('buddy', 'firstName lastName email phone')
      .populate('manager', 'firstName lastName email phone')
      .populate('employee', 'firstName lastName employeeId email department designation');
    
    if (!onboarding) {
      console.log('Onboarding not found for employee:', employee._id);
      return sendResponse(res, 404, false, 'Onboarding not found');
    }
    
    console.log('Onboarding found:', onboarding._id);
    sendResponse(res, 200, true, 'Onboarding fetched successfully', onboarding);
  } catch (error) {
    console.error('Get my onboarding error:', error);
    next(error);
  }
};


// Update Onboarding Progress
exports.updateOnboardingProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const onboarding = await Onboarding.findById(id);
    if (!onboarding) {
      return sendResponse(res, 404, false, "Onboarding not found");
    }

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined && key !== 'progress') {
        onboarding[key] = updates[key];
      }
    });

    // Calculate progress based on completed tasks
    const totalTasks = onboarding.tasks.length;
    const completedTasks = onboarding.tasks.filter(task => task.completed).length;
    onboarding.progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Update status based on progress
    if (onboarding.progress === 100) {
      onboarding.status = "Completed";
      onboarding.completedAt = new Date();
    } else if (onboarding.progress > 0) {
      onboarding.status = "In Progress";
    } else {
      onboarding.status = "Pending";
    }

    await onboarding.save();
    sendResponse(res, 200, true, "Onboarding updated successfully", onboarding);
  } catch (error) {
    console.error('Update onboarding error:', error);
    next(error);
  }
};

// Update Task Status
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const { completed } = req.body;

    const onboarding = await Onboarding.findById(id);
    if (!onboarding) {
      return sendResponse(res, 404, false, "Onboarding not found");
    }

    const task = onboarding.tasks.id(taskId);
    if (!task) {
      return sendResponse(res, 404, false, "Task not found");
    }

    task.completed = completed;
    if (completed) {
      task.completedAt = new Date();
    } else {
      task.completedAt = null;
    }

    // Recalculate progress
    const totalTasks = onboarding.tasks.length;
    const completedTasks = onboarding.tasks.filter(t => t.completed).length;
    onboarding.progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Update status
    if (onboarding.progress === 100) {
      onboarding.status = "Completed";
      onboarding.completedAt = new Date();
    } else if (onboarding.progress > 0) {
      onboarding.status = "In Progress";
    }

    await onboarding.save();
    sendResponse(res, 200, true, "Task updated successfully", onboarding);
  } catch (error) {
    console.error('Update task error:', error);
    next(error);
  }
};

// Upload Document
exports.uploadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, url } = req.body;

    const onboarding = await Onboarding.findById(id);
    if (!onboarding) {
      return sendResponse(res, 404, false, "Onboarding not found");
    }

    onboarding.documents.push({
      name,
      type,
      url,
      uploadedAt: new Date()
    });

    await onboarding.save();
    sendResponse(res, 200, true, "Document uploaded successfully", onboarding);
  } catch (error) {
    console.error('Upload document error:', error);
    next(error);
  }
};

// Submit Feedback
exports.submitFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { week, rating, comments } = req.body;

    const onboarding = await Onboarding.findById(id);
    if (!onboarding) {
      return sendResponse(res, 404, false, "Onboarding not found");
    }

    onboarding.feedback[week] = {
      rating,
      comments,
      submittedAt: new Date(),
    };

    await onboarding.save();
    sendResponse(res, 200, true, "Feedback submitted successfully", onboarding);
  } catch (error) {
    console.error('Submit feedback error:', error);
    next(error);
  }
};
