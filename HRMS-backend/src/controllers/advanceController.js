// controllers/advanceController.js
const Advance = require("../models/Advance");
const Employee = require("../models/Employee");
const { sendResponse } = require("../utils/responseHandler");
const moment = require("moment");

// Request an advance
exports.requestAdvance = async (req, res, next) => {
  try {
    const {
      advanceAmount,
      advanceType,
      reason,
      installments,
      documents
    } = req.body;

    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    // Check if employee has any pending/active advances
    const existingAdvance = await Advance.findOne({
      employee: employee._id,
      status: { $in: ["Pending", "Approved", "Active"] }
    });

    if (existingAdvance) {
      return sendResponse(
        res,
        400,
        false,
        "You already have a pending or active advance"
      );
    }

    // Calculate monthly recovery
    const monthlyRecovery = Math.round(advanceAmount / (installments || 1));

    const advance = new Advance({
      employee: employee._id,
      advanceAmount,
      outstandingAmount: advanceAmount,
      advanceType,
      reason,
      recovery: {
        monthlyRecovery,
        installments: installments || 1,
        startDate: moment().add(1, 'month').startOf('month').toDate(),
        endDate: moment().add(installments || 1, 'month').endOf('month').toDate(),
        recoveredInstallments: 0
      },
      documents: documents || [],
      status: "Pending"
    });

    advance.addHistory("Advance requested", advanceAmount, employee._id, reason);
    await advance.save();

    await advance.populate([
      { path: "employee", select: "firstName lastName employeeId department" }
    ]);

    sendResponse(res, 201, true, "Advance request submitted successfully", { advance });
  } catch (error) {
    console.error("Error in requestAdvance:", error);
    next(error);
  }
};

// Get my advances
exports.getMyAdvances = async (req, res, next) => {
  try {
    const { status } = req.query;

    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    const query = { employee: employee._id };
    if (status) query.status = status;

    const advances = await Advance.find(query)
      .populate("employee", "firstName lastName employeeId department")
      .populate("approvedBy", "firstName lastName")
      .populate("rejectedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    const summary = {
      total: advances.length,
      pending: advances.filter(a => a.status === "Pending").length,
      approved: advances.filter(a => a.status === "Approved").length,
      active: advances.filter(a => a.status === "Active").length,
      recovered: advances.filter(a => a.status === "Recovered").length,
      rejected: advances.filter(a => a.status === "Rejected").length,
      totalOutstanding: advances
        .filter(a => ["Approved", "Active"].includes(a.status))
        .reduce((sum, adv) => sum + adv.outstandingAmount, 0)
    };

    sendResponse(res, 200, true, "Advances fetched successfully", { advances, summary });
  } catch (error) {
    console.error("Error in getMyAdvances:", error);
    next(error);
  }
};

// Get all advances (Admin/HR)
exports.getAllAdvances = async (req, res, next) => {
  try {
    const { status, employeeId, advanceType, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (advanceType) query.advanceType = advanceType;
    if (employeeId) {
      const employee = await Employee.findOne({ employeeId });
      if (employee) query.employee = employee._id;
    }

    const advances = await Advance.find(query)
      .populate("employee", "firstName lastName employeeId department designation")
      .populate("approvedBy", "firstName lastName")
      .populate("rejectedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Advance.countDocuments(query);

    const summary = {
      totalAdvances: total,
      pending: await Advance.countDocuments({ ...query, status: "Pending" }),
      approved: await Advance.countDocuments({ ...query, status: "Approved" }),
      active: await Advance.countDocuments({ ...query, status: "Active" }),
      recovered: await Advance.countDocuments({ ...query, status: "Recovered" }),
      rejected: await Advance.countDocuments({ ...query, status: "Rejected" }),
      totalAmount: (await Advance.find(query)).reduce((sum, a) => sum + a.advanceAmount, 0),
      totalOutstanding: (await Advance.find({ ...query, status: { $in: ["Approved", "Active"] } }))
        .reduce((sum, a) => sum + a.outstandingAmount, 0)
    };

    sendResponse(res, 200, true, "Advances fetched successfully", {
      advances,
      summary,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error in getAllAdvances:", error);
    next(error);
  }
};

// Update advance status (Approve/Reject)
exports.updateAdvanceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!["Approved", "Rejected", "Cancelled"].includes(status)) {
      return sendResponse(res, 400, false, "Invalid status");
    }

    const approver = await Employee.findOne({ userId: req.user._id });
    if (!approver) {
      return sendResponse(res, 404, false, "Approver not found");
    }

    const advance = await Advance.findById(id).populate("employee");
    if (!advance) {
      return sendResponse(res, 404, false, "Advance not found");
    }

    if (advance.status !== "Pending") {
      return sendResponse(res, 400, false, "Advance has already been processed");
    }

    advance.status = status === "Approved" ? "Active" : status;
    advance.remarks = remarks;

    if (status === "Approved") {
      advance.approvedBy = approver._id;
      advance.approvedAt = new Date();
      advance.addHistory("Advance approved", advance.advanceAmount, approver._id, remarks);
    } else if (status === "Rejected") {
      advance.rejectedBy = approver._id;
      advance.rejectedAt = new Date();
      advance.addHistory("Advance rejected", 0, approver._id, remarks);
    }

    await advance.save();

    await advance.populate([
      { path: "approvedBy", select: "firstName lastName" },
      { path: "rejectedBy", select: "firstName lastName" }
    ]);

    sendResponse(res, 200, true, `Advance ${status.toLowerCase()} successfully`, { advance });
  } catch (error) {
    console.error("Error in updateAdvanceStatus:", error);
    next(error);
  }
};

// Cancel advance
exports.cancelAdvance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    const advance = await Advance.findById(id);
    if (!advance) {
      return sendResponse(res, 404, false, "Advance not found");
    }

    // Only allow cancellation of pending advances or by admin
    if (advance.status !== "Pending" && req.user.role !== "admin") {
      return sendResponse(res, 400, false, "Cannot cancel this advance");
    }

    advance.status = "Cancelled";
    advance.remarks = reason;
    advance.addHistory("Advance cancelled", 0, employee._id, reason);
    await advance.save();

    sendResponse(res, 200, true, "Advance cancelled successfully", { advance });
  } catch (error) {
    console.error("Error in cancelAdvance:", error);
    next(error);
  }
};

// Get advance analytics
exports.getAdvanceAnalytics = async (req, res, next) => {
  try {
    const { year = moment().year(), department } = req.query;

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    let departmentFilter = {};
    if (department) {
      const employees = await Employee.find({ department }).select("_id");
      departmentFilter = { employee: { $in: employees.map(e => e._id) } };
    }

    const advances = await Advance.find({
      ...departmentFilter,
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate("employee", "department");

    const analytics = {
      summary: {
        totalRequests: advances.length,
        totalAmount: advances.reduce((sum, a) => sum + a.advanceAmount, 0),
        totalOutstanding: advances
          .filter(a => ["Active", "Approved"].includes(a.status))
          .reduce((sum, a) => sum + a.outstandingAmount, 0),
        approved: advances.filter(a => ["Active", "Approved", "Recovered"].includes(a.status)).length,
        pending: advances.filter(a => a.status === "Pending").length,
        rejected: advances.filter(a => a.status === "Rejected").length,
        recovered: advances.filter(a => a.status === "Recovered").length
      },
      byType: advances.reduce((acc, adv) => {
        acc[adv.advanceType] = acc[adv.advanceType] || { count: 0, amount: 0, outstanding: 0 };
        acc[adv.advanceType].count++;
        acc[adv.advanceType].amount += adv.advanceAmount;
        if (["Active", "Approved"].includes(adv.status)) {
          acc[adv.advanceType].outstanding += adv.outstandingAmount;
        }
        return acc;
      }, {}),
      byStatus: advances.reduce((acc, adv) => {
        acc[adv.status] = acc[adv.status] || { count: 0, amount: 0 };
        acc[adv.status].count++;
        acc[adv.status].amount += adv.advanceAmount;
        return acc;
      }, {})
    };

    sendResponse(res, 200, true, "Advance analytics fetched successfully", analytics);
  } catch (error) {
    console.error("Error in getAdvanceAnalytics:", error);
    next(error);
  }
};

module.exports = {
  requestAdvance: exports.requestAdvance,
  getMyAdvances: exports.getMyAdvances,
  getAllAdvances: exports.getAllAdvances,
  updateAdvanceStatus: exports.updateAdvanceStatus,
  cancelAdvance: exports.cancelAdvance,
  getAdvanceAnalytics: exports.getAdvanceAnalytics
};
