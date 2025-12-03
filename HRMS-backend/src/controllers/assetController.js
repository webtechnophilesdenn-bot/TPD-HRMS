// controllers/assetController.js - Working Version
const Asset = require("../models/Asset");
const AssetAllocation = require("../models/AssetAllocation");
const Employee = require("../models/Employee");
const Department = require("../models/Department");
const { sendResponse } = require("../utils/responseHandler");
const mongoose = require("mongoose");

// RBAC Permissions Configuration
const ASSET_PERMISSIONS = {
  VIEW_ASSETS: "assets.view",
  VIEW_ALL_ASSETS: "assets.view_all",
  CREATE_ASSET: "assets.create",
  EDIT_ASSET: "assets.edit",
  DELETE_ASSET: "assets.delete",
  ALLOCATE_ASSET: "assets.allocate",
  RETURN_ASSET: "assets.return",
  MAINTENANCE_ASSET: "assets.maintenance",
  DISPOSE_ASSET: "assets.dispose",
  AUDIT_ASSET: "assets.audit",
  GENERATE_REPORTS: "assets.reports",
  IMPORT_ASSETS: "assets.import",
  EXPORT_ASSETS: "assets.export",
  VIEW_DEPARTMENT_ASSETS: "assets.view_department",
  APPROVE_ALLOCATION: "assets.approve_allocation",
  VIEW_AUDIT_TRAIL: "assets.view_audit_trail",
};

// 1. Create Asset
exports.createAsset = async (req, res, next) => {
  try {
    const assetData = {
      ...req.body,
      createdBy: req.user._id,
    };

    // Auto-generate asset ID if not provided
    if (!assetData.assetId) {
      const count = await Asset.countDocuments();
      assetData.assetId = `AST${String(count + 1).padStart(6, "0")}`;
    }

    const asset = await Asset.create(assetData);
    sendResponse(res, 201, true, "Asset created successfully", asset);
  } catch (error) {
    next(error);
  }
};

// controllers/assetController.js - Simple version without department
exports.getAllAssets = async (req, res, next) => {
  try {
    const {
      status,
      category,
      type,
      department,
      location,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    // Build filter
    const filter = { isActive: true };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (department) filter.department = department;
    if (location) filter.location = new RegExp(location, "i");
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { assetId: new RegExp(search, "i") },
        { serialNumber: new RegExp(search, "i") },
        { brand: new RegExp(search, "i") },
        { model: new RegExp(search, "i") },
      ];
    }

    const assets = await Asset.find(filter)
      .populate("allocatedTo", "firstName lastName employeeId")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Asset.countDocuments(filter);

    sendResponse(res, 200, true, "Assets fetched successfully", {
      assets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching assets:", error);
    next(error);
  }
};

// 3. Get Asset by ID
exports.getAssetById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendResponse(res, 400, false, "Invalid asset ID");
    }

    const asset = await Asset.findById(req.params.id)
      .populate(
        "allocatedTo",
        "firstName lastName employeeId department designation"
      )
      .populate("department", "name")
      .populate("createdBy", "firstName lastName");

    if (!asset) {
      return sendResponse(res, 404, false, "Asset not found");
    }

    // Get allocation history
    const allocations = await AssetAllocation.find({ asset: asset._id })
      .populate("employee", "firstName lastName employeeId")
      .populate("allocatedBy", "firstName lastName")
      .sort({ allocatedDate: -1 });

    sendResponse(res, 200, true, "Asset fetched successfully", {
      asset,
      allocationHistory: allocations,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Asset
exports.updateAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("allocatedTo", "firstName lastName employeeId");

    if (!asset) {
      return sendResponse(res, 404, false, "Asset not found");
    }

    sendResponse(res, 200, true, "Asset updated successfully", asset);
  } catch (error) {
    next(error);
  }
};

// 5. Delete Asset (Soft Delete)
exports.deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return sendResponse(res, 404, false, "Asset not found");
    }

    if (asset.status === "Assigned" || asset.status === "In Use") {
      return sendResponse(res, 400, false, "Cannot delete allocated asset");
    }

    // Soft delete
    asset.isActive = false;
    asset.deleted = true;
    asset.deletedAt = new Date();
    await asset.save();

    sendResponse(res, 200, true, "Asset deleted successfully");
  } catch (error) {
    next(error);
  }
};


// Controller functions (assetController.js)

// ✅ FIXED: Use AssetAllocation instead of AssetRequest
exports.getAssetRequests = async (req, res, next) => {
  try {
    const { status = 'Requested', page = 1, limit = 10 } = req.query;
    
    const filter = { 
      status, 
      isActive: true 
    };
    
    const requests = await AssetAllocation.find(filter)
      .populate('employee', 'firstName lastName email employeeId')
      .populate('asset', 'name assetId category')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await AssetAllocation.countDocuments(filter);

    sendResponse(res, 200, true, 'Requests fetched successfully', {
      requests,
      pagination: { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total 
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.approveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allocation = await AssetAllocation.findById(id);
    
    if (!allocation) {
      return sendResponse(res, 404, false, 'Request not found');
    }

    // Update asset status and allocation
    await Asset.findByIdAndUpdate(allocation.asset, {
      status: 'Assigned',
      allocatedTo: allocation.employee,
      allocationDate: new Date()
    });
    
    // Approve allocation
    allocation.status = 'Allocated';
    allocation.approvedBy = req.user._id;
    allocation.approvalDate = new Date();
    await allocation.save();

    sendResponse(res, 200, true, 'Request approved successfully', allocation);
  } catch (error) {
    next(error);
  }
};






// 6. Allocate Asset
exports.allocateAsset = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { employeeId, purpose, expectedReturnDate, notes, accessories } =
      req.body;
    const assetId = req.params.id;

    const asset = await Asset.findById(assetId).session(session);
    if (!asset) {
      await session.abortTransaction();
      return sendResponse(res, 404, false, "Asset not found");
    }

    if (asset.status !== "Available") {
      await session.abortTransaction();
      return sendResponse(
        res,
        400,
        false,
        "Asset is not available for allocation"
      );
    }

    const employee = await Employee.findById(employeeId).session(session);
    if (!employee) {
      await session.abortTransaction();
      return sendResponse(res, 404, false, "Employee not found");
    }

    // Create allocation record
    const allocation = await AssetAllocation.create(
      [
        {
          asset: assetId,
          employee: employeeId,
          allocatedBy: req.user._id,
          allocatedDate: new Date(),
          expectedReturnDate,
          purpose: purpose || "Permanent",
          checkoutNotes: notes,
          accessoriesProvided: accessories,
          checkoutCondition: asset.condition,
          status: "Active",
          history: [
            {
              action: "Allocated",
              performedBy: req.user._id,
              notes: "Asset allocated to employee",
              timestamp: new Date(),
            },
          ],
        },
      ],
      { session }
    );

    // Update asset
    asset.allocatedTo = employeeId;
    asset.allocationDate = new Date();
    asset.status = "Assigned";
    await asset.save({ session });

    await session.commitTransaction();

    const populatedAllocation = await AssetAllocation.findById(
      allocation[0]._id
    )
      .populate("asset")
      .populate("employee", "firstName lastName employeeId department")
      .populate("allocatedBy", "firstName lastName");

    sendResponse(
      res,
      200,
      true,
      "Asset allocated successfully",
      populatedAllocation
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// 7. Return Asset
exports.returnAsset = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { condition, notes, damageReport } = req.body;
    const assetId = req.params.id;

    const asset = await Asset.findById(assetId).session(session);
    if (!asset) {
      await session.abortTransaction();
      return sendResponse(res, 404, false, "Asset not found");
    }

    if (asset.status !== "Assigned") {
      await session.abortTransaction();
      return sendResponse(res, 400, false, "Asset is not allocated");
    }

    // Find active allocation
    const allocation = await AssetAllocation.findOne({
      asset: assetId,
      status: "Active",
    }).session(session);

    if (!allocation) {
      await session.abortTransaction();
      return sendResponse(res, 400, false, "No active allocation found");
    }

    // Update allocation
    allocation.returnDate = new Date();
    allocation.returnedTo = req.user._id;
    allocation.conditionAtReturn = condition;
    allocation.returnNotes = notes;
    allocation.damageReport = damageReport;
    allocation.status = "Returned";
    allocation.history.push({
      action: "Returned",
      performedBy: req.user._id,
      notes: `Asset returned in ${condition} condition`,
      timestamp: new Date(),
    });
    await allocation.save({ session });

    // Update asset
    asset.allocatedTo = null;
    asset.allocationDate = null;
    asset.status = condition === "Damaged" ? "Damaged" : "Available";
    asset.condition = condition;
    await asset.save({ session });

    await session.commitTransaction();

    sendResponse(res, 200, true, "Asset returned successfully", {
      asset,
      allocation,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// 8. Get My Assets (Employee View)
exports.getMyAssets = async (req, res, next) => {
  try {
    // Find employee by user ID
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    const assets = await Asset.find({
      allocatedTo: employee._id,
      isActive: true,
    })
      .populate("department", "name")
      .sort({ allocationDate: -1 });

    const allocations = await AssetAllocation.find({
      employee: employee._id,
      status: "Active",
    })
      .populate("asset")
      .sort({ allocatedDate: -1 });

    sendResponse(res, 200, true, "My assets fetched successfully", {
      assets,
      allocations,
      stats: {
        allocated: assets.length,
        totalAllocations: allocations.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// SIMPLE FALLBACK - No employee creation
exports.requestAssetAllocation = async (req, res, next) => {
  try {
    const { purpose, expectedReturnDate, notes, projectCode } = req.body;
    const { id: assetId } = req.params;

    // Only allow if employee exists
    const employee = await Employee.findOne({ user: req.user._id });
    
    if (!employee) {
      return sendResponse(res, 400, false, 
        'Please complete your employee profile first. ' +
        'Visit /api/v1/employees/setup-profile or contact HR.'
      );
    }

    // Rest of the function remains the same...
    const asset = await Asset.findById(assetId);
    if (!asset || !asset.isActive || asset.status !== 'Available') {
      return sendResponse(res, 400, false, 'Asset not available for request');
    }

    const allocation = await AssetAllocation.create({
      asset: assetId,
      employee: employee._id,
      allocatedBy: employee._id,
      allocatedDate: new Date(),
      expectedReturnDate,
      purpose: purpose || 'Work requirement',
      projectCode,
      checkoutNotes: notes || `Request for ${asset.name}`,
      checkoutCondition: asset.condition,
      status: 'Requested',
      history: [{
        action: 'Requested',
        performedBy: employee._id,
        notes: `Requested ${asset.name}`,
        timestamp: new Date()
      }]
    });

    sendResponse(res, 201, true, 'Asset requested successfully!', allocation);
  } catch (error) {
    console.error('Request allocation error:', error.message);
    next(error);
  }
};

// 10. Schedule Maintenance
exports.scheduleMaintenance = async (req, res, next) => {
  try {
    const {
      assetId,
      date,
      type,
      description,
      vendor,
      technician,
      estimatedCost,
      duration,
    } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return sendResponse(res, 404, false, "Asset not found");
    }

    // Add to maintenance history
    asset.maintenanceHistory.push({
      date: new Date(date),
      type,
      description,
      vendor,
      technician,
      cost: estimatedCost,
      status: "Scheduled",
      performedBy: req.user._id,
      downtime: duration,
    });

    // Update maintenance schedule
    asset.maintenanceSchedule = {
      type,
      lastMaintenanceDate: new Date(),
      nextMaintenanceDate: calculateNextMaintenanceDate(date, type),
      maintenanceNotes: description,
    };

    asset.status = "Under Maintenance";
    await asset.save();

    sendResponse(res, 200, true, "Maintenance scheduled successfully", asset);
  } catch (error) {
    next(error);
  }
};

// 11. Get Asset Analytics
exports.getAssetAnalytics = async (req, res, next) => {
  try {
    const [
      totalAssets,
      availableAssets,
      allocatedAssets,
      maintenanceAssets,
      categoryStats,
      statusDistribution,
    ] = await Promise.all([
      Asset.countDocuments({ isActive: true }),
      Asset.countDocuments({ status: "Available", isActive: true }),
      Asset.countDocuments({
        status: { $in: ["Assigned", "In Use"] },
        isActive: true,
      }),
      Asset.countDocuments({ status: "Under Maintenance", isActive: true }),

      // Category statistics
      Asset.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            totalValue: { $sum: "$purchasePrice" },
            avgValue: { $avg: "$purchasePrice" },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // Status distribution
      Asset.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const analytics = {
      overview: {
        totalAssets,
        availableAssets,
        allocatedAssets,
        maintenanceAssets,
        utilizationRate:
          totalAssets > 0
            ? ((allocatedAssets / totalAssets) * 100).toFixed(2)
            : 0,
      },
      categoryBreakdown: categoryStats,
      statusDistribution: statusDistribution.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
    };

    sendResponse(res, 200, true, "Analytics fetched successfully", analytics);
  } catch (error) {
    next(error);
  }
};

// 12. Add Maintenance Record
exports.addMaintenance = async (req, res, next) => {
  try {
    const {
      date,
      type,
      description,
      cost,
      vendor,
      technician,
      nextMaintenance,
    } = req.body;

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return sendResponse(res, 404, false, "Asset not found");
    }

    asset.maintenanceHistory.push({
      date: date || new Date(),
      type,
      description,
      cost,
      vendor,
      technician,
      nextMaintenance,
      status: "Completed",
    });

    asset.lastMaintained = new Date();
    asset.nextMaintenanceDate = nextMaintenance;

    if (type === "Repair") {
      asset.status = "Available";
      asset.condition = "Good";
    }

    await asset.save();

    sendResponse(
      res,
      200,
      true,
      "Maintenance record added successfully",
      asset
    );
  } catch (error) {
    next(error);
  }
};

// Helper functions
function calculateNextMaintenanceDate(startDate, type) {
  const date = new Date(startDate);

  switch (type) {
    case "Preventive":
      date.setMonth(date.getMonth() + 6); // Every 6 months
      break;
    case "Routine":
      date.setMonth(date.getMonth() + 3); // Every 3 months
      break;
    case "Annual":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1); // Default monthly
  }

  return date;
}
