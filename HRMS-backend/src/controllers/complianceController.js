const Policy = require('../models/Policy');
const PolicyAcknowledgment = require('../models/PolicyAcknowledgment');
const ComplianceDocument = require('../models/ComplianceDocument');
const Employee = require('../models/Employee');
const { sendResponse } = require('../utils/responseHandler');
const mongoose = require('mongoose');

// ==================== POLICY MANAGEMENT ====================

// Create Policy
exports.createPolicy = async (req, res, next) => {
  try {
    const {
      title,
      policyId,
      category,
      description,
      documentUrl,
      documentType,
      effectiveDate,
      expiryDate,
      reviewDate,
      requiresAcknowledgment,
      requiresSignature,
      acknowledgmentDeadline,
      applicableTo,
      mandatoryReading
    } = req.body;

    const policy = await Policy.create({
      title,
      policyId,
      category,
      description,
      documentUrl,
      documentType: documentType || 'PDF',
      effectiveDate,
      expiryDate,
      reviewDate,
      requiresAcknowledgment: requiresAcknowledgment !== false,
      requiresSignature: requiresSignature || false,
      acknowledgmentDeadline,
      applicableTo: applicableTo || 'All Employees',
      mandatoryReading: mandatoryReading !== false,
      status: 'Draft',
      createdBy: req.user.id
    });

    sendResponse(res, 201, true, 'Policy created successfully', policy);
  } catch (error) {
    console.error('Create Policy Error:', error);
    next(error);
  }
};

// Get All Policies
exports.getAllPolicies = async (req, res, next) => {
  try {
    const {
      status,
      category,
      search,
      page = 1,
      limit = 20,
      sortBy = 'effectiveDate',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { policyId: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const policies = await Policy.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Policy.countDocuments(query);

    sendResponse(res, 200, true, 'Policies fetched successfully', {
      policies,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Policies Error:', error);
    next(error);
  }
};

// Get Policy by ID
exports.getPolicyById = async (req, res, next) => {
  try {
    const policy = await Policy.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');

    if (!policy) {
      return sendResponse(res, 404, false, 'Policy not found');
    }

    sendResponse(res, 200, true, 'Policy fetched successfully', policy);
  } catch (error) {
    console.error('Get Policy Error:', error);
    next(error);
  }
};

// Update Policy
exports.updatePolicy = async (req, res, next) => {
  try {
    const policy = await Policy.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    if (!policy) {
      return sendResponse(res, 404, false, 'Policy not found');
    }

    sendResponse(res, 200, true, 'Policy updated successfully', policy);
  } catch (error) {
    console.error('Update Policy Error:', error);
    next(error);
  }
};

// Delete Policy (Archive)
exports.deletePolicy = async (req, res, next) => {
  try {
    const policy = await Policy.findByIdAndUpdate(
      req.params.id,
      { status: 'Archived' },
      { new: true }
    );

    if (!policy) {
      return sendResponse(res, 404, false, 'Policy not found');
    }

    sendResponse(res, 200, true, 'Policy archived successfully');
  } catch (error) {
    console.error('Delete Policy Error:', error);
    next(error);
  }
};

// Publish Policy
exports.publishPolicy = async (req, res, next) => {
  try {
    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      return sendResponse(res, 404, false, 'Policy not found');
    }

    if (policy.status !== 'Draft') {
      return sendResponse(res, 400, false, 'Only draft policies can be published');
    }

    // Update policy status
    policy.status = 'Active';
    policy.publishedAt = new Date();
    await policy.save();

    // Create acknowledgment records for all applicable employees
    if (policy.requiresAcknowledgment) {
      const employees = await Employee.find({ status: 'Active' });

      const acknowledgments = employees.map(employee => ({
        policy: policy._id,
        employee: employee._id,
        status: 'Pending',
        assignedDate: new Date(),
        deadline: policy.acknowledgmentDeadline
      }));

      await PolicyAcknowledgment.insertMany(acknowledgments);
    }

    sendResponse(res, 200, true, 'Policy published successfully', policy);
  } catch (error) {
    console.error('Publish Policy Error:', error);
    next(error);
  }
};

// ==================== ACKNOWLEDGMENT MANAGEMENT ====================

// Get My Pending Acknowledgments
exports.getMyPendingAcknowledgments = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });

    if (!employee) {
      return sendResponse(res, 404, false, 'Employee profile not found');
    }

    const acknowledgments = await PolicyAcknowledgment.find({
      employee: employee._id,
      status: 'Pending'
    })
      .populate('policy')
      .sort({ deadline: 1 });

    sendResponse(res, 200, true, 'Pending acknowledgments fetched', acknowledgments);
  } catch (error) {
    console.error('Get Pending Acknowledgments Error:', error);
    next(error);
  }
};

// Acknowledge Policy
exports.acknowledgePolicy = async (req, res, next) => {
  try {
    const { employeeComments, readingTime, scrollProgress, ipAddress, userAgent } = req.body;
    const employee = await Employee.findOne({ userId: req.user.id });

    if (!employee) {
      return sendResponse(res, 404, false, 'Employee profile not found');
    }

    const acknowledgment = await PolicyAcknowledgment.findOne({
      policy: req.params.policyId,
      employee: employee._id
    });

    if (!acknowledgment) {
      return sendResponse(res, 404, false, 'Acknowledgment record not found');
    }

    if (acknowledgment.status === 'Acknowledged') {
      return sendResponse(res, 400, false, 'Policy already acknowledged');
    }

    acknowledgment.status = 'Acknowledged';
    acknowledgment.acknowledgedDate = new Date();
    acknowledgment.employeeComments = employeeComments;
    acknowledgment.readingTime = readingTime;
    acknowledgment.scrollProgress = scrollProgress;
    acknowledgment.ipAddress = ipAddress;
    acknowledgment.userAgent = userAgent;

    await acknowledgment.save();

    sendResponse(res, 200, true, 'Policy acknowledged successfully', acknowledgment);
  } catch (error) {
    console.error('Acknowledge Policy Error:', error);
    next(error);
  }
};

// Sign Policy
exports.signPolicy = async (req, res, next) => {
  try {
    const { signatureUrl, ipAddress, userAgent, location } = req.body;
    const employee = await Employee.findOne({ userId: req.user.id });

    if (!employee) {
      return sendResponse(res, 404, false, 'Employee profile not found');
    }

    const acknowledgment = await PolicyAcknowledgment.findOne({
      policy: req.params.policyId,
      employee: employee._id
    });

    if (!acknowledgment) {
      return sendResponse(res, 404, false, 'Acknowledgment record not found');
    }

    acknowledgment.digitalSignature = {
      signatureUrl,
      signedDate: new Date(),
      ipAddress,
      userAgent,
      location
    };

    acknowledgment.status = 'Acknowledged';
    await acknowledgment.save();

    sendResponse(res, 200, true, 'Policy signed successfully', acknowledgment);
  } catch (error) {
    console.error('Sign Policy Error:', error);
    next(error);
  }
};

// Track Policy View
exports.trackPolicyView = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });

    if (!employee) {
      return sendResponse(res, 404, false, 'Employee profile not found');
    }

    const acknowledgment = await PolicyAcknowledgment.findOne({
      policy: req.params.policyId,
      employee: employee._id
    });

    if (acknowledgment) {
      acknowledgment.viewedCount = (acknowledgment.viewedCount || 0) + 1;
      acknowledgment.lastViewedDate = new Date();
      await acknowledgment.save();
    }

    sendResponse(res, 200, true, 'Policy view tracked');
  } catch (error) {
    console.error('Track Policy View Error:', error);
    next(error);
  }
};

// Get Policy Acknowledgments
exports.getPolicyAcknowledgments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    const query = { policy: req.params.policyId };
    if (status) query.status = status;

    const acknowledgments = await PolicyAcknowledgment.find(query)
      .populate('employee', 'firstName lastName employeeId email department')
      .sort({ acknowledgedDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await PolicyAcknowledgment.countDocuments(query);

    sendResponse(res, 200, true, 'Acknowledgments fetched successfully', {
      acknowledgments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Acknowledgments Error:', error);
    next(error);
  }
};

// Send Acknowledgment Reminders
exports.sendAcknowledgmentReminders = async (req, res, next) => {
  try {
    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      return sendResponse(res, 404, false, 'Policy not found');
    }

    const pendingAcknowledgments = await PolicyAcknowledgment.find({
      policy: policy._id,
      status: 'Pending'
    }).populate('employee', 'firstName lastName email');

    sendResponse(res, 200, true, `Reminders sent to ${pendingAcknowledgments.length} employees`);
  } catch (error) {
    console.error('Send Reminders Error:', error);
    next(error);
  }
};

// ==================== COMPLIANCE DOCUMENTS ====================

// Create Compliance Document
exports.createComplianceDocument = async (req, res, next) => {
  try {
    const document = await ComplianceDocument.create(req.body);
    sendResponse(res, 201, true, 'Compliance document created successfully', document);
  } catch (error) {
    console.error('Create Document Error:', error);
    next(error);
  }
};

// Get All Compliance Documents
exports.getAllComplianceDocuments = async (req, res, next) => {
  try {
    const {
      documentType,
      employee,
      status,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};
    if (documentType) query.documentType = documentType;
    if (employee) query.employee = employee;
    if (status) query.status = status;

    const documents = await ComplianceDocument.find(query)
      .populate('employee', 'firstName lastName employeeId email')
      .sort({ issueDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await ComplianceDocument.countDocuments(query);

    sendResponse(res, 200, true, 'Documents fetched successfully', {
      documents,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Documents Error:', error);
    next(error);
  }
};

// Get Expiring Documents
exports.getExpiringDocuments = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const documents = await ComplianceDocument.find({
      expiryDate: {
        $gte: new Date(),
        $lte: futureDate
      },
      status: 'Active'
    })
      .populate('employee', 'firstName lastName employeeId email')
      .sort({ expiryDate: 1 });

    sendResponse(res, 200, true, 'Expiring documents fetched successfully', documents);
  } catch (error) {
    console.error('Get Expiring Documents Error:', error);
    next(error);
  }
};

// Get Expired Documents
exports.getExpiredDocuments = async (req, res, next) => {
  try {
    const documents = await ComplianceDocument.find({
      expiryDate: { $lt: new Date() },
      status: { $ne: 'Expired' }
    })
      .populate('employee', 'firstName lastName employeeId email')
      .sort({ expiryDate: -1 });

    sendResponse(res, 200, true, 'Expired documents fetched successfully', documents);
  } catch (error) {
    console.error('Get Expired Documents Error:', error);
    next(error);
  }
};

// Update Compliance Document
exports.updateComplianceDocument = async (req, res, next) => {
  try {
    const document = await ComplianceDocument.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('employee', 'firstName lastName employeeId email');

    if (!document) {
      return sendResponse(res, 404, false, 'Document not found');
    }

    sendResponse(res, 200, true, 'Document updated successfully', document);
  } catch (error) {
    console.error('Update Document Error:', error);
    next(error);
  }
};

// Delete Compliance Document
exports.deleteComplianceDocument = async (req, res, next) => {
  try {
    const document = await ComplianceDocument.findByIdAndDelete(req.params.id);

    if (!document) {
      return sendResponse(res, 404, false, 'Document not found');
    }

    sendResponse(res, 200, true, 'Document deleted successfully');
  } catch (error) {
    console.error('Delete Document Error:', error);
    next(error);
  }
};

// Send Expiry Alerts
exports.sendExpiryAlerts = async (req, res, next) => {
  try {
    const document = await ComplianceDocument.findById(req.params.documentId)
      .populate('employee', 'firstName lastName email');

    if (!document) {
      return sendResponse(res, 404, false, 'Document not found');
    }

    sendResponse(res, 200, true, 'Expiry alert sent successfully');
  } catch (error) {
    console.error('Send Alert Error:', error);
    next(error);
  }
};

// ==================== DASHBOARD ====================

// Get Compliance Dashboard
exports.getComplianceDashboard = async (req, res, next) => {
  try {
    const totalPolicies = await Policy.countDocuments({ status: { $ne: 'Archived' } });
    const totalAcknowledgments = await PolicyAcknowledgment.countDocuments();
    const pendingAcknowledgments = await PolicyAcknowledgment.countDocuments({ status: 'Pending' });
    const completedAcknowledgments = await PolicyAcknowledgment.countDocuments({ status: 'Acknowledged' });

    const completionRate = totalAcknowledgments > 0
      ? ((completedAcknowledgments / totalAcknowledgments) * 100).toFixed(2)
      : 0;

    const totalDocuments = await ComplianceDocument.countDocuments();
    const expiredDocuments = await ComplianceDocument.countDocuments({
      expiryDate: { $lt: new Date() },
      status: { $ne: 'Expired' }
    });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const expiringSoon = await ComplianceDocument.countDocuments({
      expiryDate: {
        $gte: new Date(),
        $lte: futureDate
      },
      status: 'Active'
    });

    const activeDocuments = await ComplianceDocument.countDocuments({ status: 'Active' });

    const upcomingExpirations = await ComplianceDocument.find({
      expiryDate: {
        $gte: new Date(),
        $lte: futureDate
      },
      status: 'Active'
    })
      .populate('employee', 'firstName lastName employeeId')
      .sort({ expiryDate: 1 })
      .limit(10);

    const recentAcknowledgments = await PolicyAcknowledgment.find({ status: 'Acknowledged' })
      .populate('policy', 'title')
      .populate('employee', 'firstName lastName employeeId')
      .sort({ acknowledgedDate: -1 })
      .limit(10);

    const dashboardData = {
      policies: {
        total: totalPolicies,
        totalAcknowledgments,
        pending: pendingAcknowledgments,
        completed: completedAcknowledgments,
        completionRate
      },
      documents: {
        total: totalDocuments,
        expired: expiredDocuments,
        expiringSoon,
        active: activeDocuments
      },
      upcomingExpirations,
      recentAcknowledgments
    };

    sendResponse(res, 200, true, 'Dashboard data fetched successfully', dashboardData);
  } catch (error) {
    console.error('Get Dashboard Error:', error);
    next(error);
  }
};
