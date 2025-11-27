const Asset = require("../models/Asset");
const AssetAllocation = require("../models/AssetAllocation");
const Employee = require("../models/Employee");
const { sendResponse } = require("../utils/responseHandler");
const mongoose = require("mongoose");

// Create Asset
exports.createAsset = async (req, res, next) => {
  try {
    const assetData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const asset = await Asset.create(assetData);
    sendResponse(res, 201, true, "Asset created successfully", asset);
  } catch (error) {
    next(error);
  }
};

// Get All Assets with advanced filtering
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
      limit = 20,
    } = req.query;

    // Build filter
    const filter = {};
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
      .populate("allocatedTo", "firstName lastName employeeId department")
      .populate("department", "name")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Asset.countDocuments(filter);

    // Get asset statistics
    const stats = await Asset.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$purchasePrice" },
        },
      },
    ]);

    sendResponse(res, 200, true, "Assets fetched successfully", {
      assets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      stats: stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    next(error);
  }
};

// Get Asset by ID
exports.getAssetById = async (req, res, next) => {
  try {
    // Check if it's a valid ObjectId
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

// Update Asset
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

// Delete Asset
exports.deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return sendResponse(res, 404, false, "Asset not found");
    }

    if (asset.status === "Allocated") {
      return sendResponse(res, 400, false, "Cannot delete allocated asset");
    }

    await Asset.findByIdAndDelete(req.params.id);
    sendResponse(res, 200, true, "Asset deleted successfully");
  } catch (error) {
    next(error);
  }
};

// Allocate Asset
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
          history: [
            {
              action: "Allocated",
              performedBy: req.user._id,
              notes: "Asset allocated to employee",
            },
          ],
        },
      ],
      { session }
    );

    // Update asset
    asset.allocatedTo = employeeId;
    asset.allocationDate = new Date();
    asset.status = "Allocated";
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

// Return Asset
exports.returnAsset = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { condition, notes } = req.body;
    const assetId = req.params.id;

    const asset = await Asset.findById(assetId).session(session);
    if (!asset) {
      await session.abortTransaction();
      return sendResponse(res, 404, false, "Asset not found");
    }

    if (asset.status !== "Allocated") {
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
      return sendResponse(
        res,
        400,
        false,
        "No active allocation found for this asset"
      );
    }

    // Update allocation
    allocation.returnDate = new Date();
    allocation.returnedTo = req.user._id;
    allocation.conditionAtReturn = condition;
    allocation.returnNotes = notes;
    allocation.status = "Returned";
    allocation.history.push({
      action: "Returned",
      performedBy: req.user._id,
      notes: `Asset returned in ${condition} condition`,
    });
    await allocation.save({ session });

    // Update asset
    asset.allocatedTo = null;
    asset.allocationDate = null;
    asset.status = "Available";
    asset.condition = condition; // Update asset condition based on return
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

// Get My Assets - FIXED: This should be a separate function, not part of getAssetById
exports.getMyAssets = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    const assets = await Asset.find({ allocatedTo: employee._id })
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
    });
  } catch (error) {
    next(error);
  }
};

// Asset Request
exports.requestAsset = async (req, res, next) => {
  try {
    const { assetType, category, reason, urgency, requiredBy } = req.body;

    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    // Create asset request logic here
    // This would typically create a record in an AssetRequest model
    // and notify the admin/HR team

    sendResponse(res, 201, true, "Asset request submitted successfully");
  } catch (error) {
    next(error);
  }
};

// Maintenance History
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

// Get Asset Analytics
exports.getAssetAnalytics = async (req, res, next) => {
  try {
    const statusStats = await Asset.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$purchasePrice" },
        },
      },
    ]);

    const categoryStats = await Asset.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          types: { $addToSet: "$type" },
        },
      },
    ]);

    const allocationStats = await AssetAllocation.aggregate([
      {
        $match: { status: "Active" },
      },
      {
        $group: {
          _id: "$purpose",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalAssets = await Asset.countDocuments();
    const availableAssets = await Asset.countDocuments({ status: "Available" });
    const allocatedAssets = await Asset.countDocuments({ status: "Allocated" });
    const maintenanceAssets = await Asset.countDocuments({
      status: "Under Maintenance",
    });

    sendResponse(res, 200, true, "Analytics fetched successfully", {
      totalAssets,
      availableAssets,
      allocatedAssets,
      maintenanceAssets,
      statusDistribution: statusStats,
      categoryBreakdown: categoryStats,
      allocationStats: allocationStats,
    });
  } catch (error) {
    next(error);
  }
};
