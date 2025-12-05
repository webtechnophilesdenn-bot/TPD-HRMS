const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth.middleware");
const Department = require("../models/Department");
const { sendResponse } = require("../utils/responseHandler");

// Get all departments
router.get("/", protect, async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({
      name: 1,
    });
    sendResponse(
      res,
      200,
      true,
      "Departments fetched successfully",
      departments
    );
  } catch (error) {
    next(error);
  }
});

// Get department by ID
router.get("/:id", protect, async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return sendResponse(res, 404, false, "Department not found");
    }
    sendResponse(res, 200, true, "Department fetched successfully", department);
  } catch (error) {
    next(error);
  }
});

// Create department
router.post("/", protect, authorize("hr", "admin"), async (req, res, next) => {
  try {
    const { name, code, description, head } = req.body;

    // Check for duplicate name or code
    const existingDept = await Department.findOne({
      $or: [{ name }, { code }],
    });

    if (existingDept) {
      return sendResponse(
        res,
        400,
        false,
        "Department with this name or code already exists"
      );
    }

    const department = await Department.create({
      name,
      code: code || name.substring(0, 4).toUpperCase(),
      description,
      head,
      isActive: true,
    });

    sendResponse(res, 201, true, "Department created successfully", department);
  } catch (error) {
    next(error);
  }
});

// Update department
router.patch(
  "/:id",
  protect,
  authorize("hr", "admin"),
  async (req, res, next) => {
    try {
      const { name, code, description, head, isActive } = req.body;

      // Check for duplicate name or code (excluding current)
      if (name || code) {
        const existingDept = await Department.findOne({
          _id: { $ne: req.params.id },
          $or: [...(name ? [{ name }] : []), ...(code ? [{ code }] : [])],
        });

        if (existingDept) {
          return sendResponse(
            res,
            400,
            false,
            "Department with this name or code already exists"
          );
        }
      }

      const department = await Department.findByIdAndUpdate(
        req.params.id,
        { name, code, description, head, isActive },
        { new: true, runValidators: true }
      );

      if (!department) {
        return sendResponse(res, 404, false, "Department not found");
      }

      sendResponse(
        res,
        200,
        true,
        "Department updated successfully",
        department
      );
    } catch (error) {
      next(error);
    }
  }
);

// Delete department (soft delete)
router.delete(
  "/:id",
  protect,
  authorize("hr", "admin"),
  async (req, res, next) => {
    try {
      const department = await Department.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );

      if (!department) {
        return sendResponse(res, 404, false, "Department not found");
      }

      sendResponse(res, 200, true, "Department deleted successfully");
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
