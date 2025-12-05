const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth.middleware");
const Designation = require("../models/Designation");
const { sendResponse } = require("../utils/responseHandler");

// Get all designations
router.get("/", protect, async (req, res, next) => {
  try {
    const { department } = req.query;
    const query = { isActive: true };

    if (department) {
      query.department = department;
    }

    const designations = await Designation.find(query)
      .populate("department", "name code")
      .sort({ level: 1, title: 1 });

    sendResponse(
      res,
      200,
      true,
      "Designations fetched successfully",
      designations
    );
  } catch (error) {
    next(error);
  }
});

// Get designation by ID
router.get("/:id", protect, async (req, res, next) => {
  try {
    const designation = await Designation.findById(req.params.id).populate(
      "department",
      "name code"
    );

    if (!designation) {
      return sendResponse(res, 404, false, "Designation not found");
    }
    sendResponse(
      res,
      200,
      true,
      "Designation fetched successfully",
      designation
    );
  } catch (error) {
    next(error);
  }
});

// Create designation
router.post("/", protect, authorize("hr", "admin"), async (req, res, next) => {
  try {
    const {
      title,
      level,
      department,
      description,
      grade,
      responsibilities,
      requiredSkills,
      minExperience,
      maxExperience,
    } = req.body;

    // Check for duplicate title
    const existingDesig = await Designation.findOne({ title });
    if (existingDesig) {
      return sendResponse(
        res,
        400,
        false,
        "Designation with this title already exists"
      );
    }

    const designation = await Designation.create({
      title,
      level: level || "Junior",
      department,
      description,
      grade,
      responsibilities,
      requiredSkills,
      minExperience,
      maxExperience,
      isActive: true,
    });

    sendResponse(
      res,
      201,
      true,
      "Designation created successfully",
      designation
    );
  } catch (error) {
    next(error);
  }
});

// Update designation
router.patch(
  "/:id",
  protect,
  authorize("hr", "admin"),
  async (req, res, next) => {
    try {
      const {
        title,
        level,
        department,
        description,
        grade,
        responsibilities,
        requiredSkills,
        minExperience,
        maxExperience,
        isActive,
      } = req.body;

      // Check for duplicate title (excluding current)
      if (title) {
        const existingDesig = await Designation.findOne({
          _id: { $ne: req.params.id },
          title,
        });
        if (existingDesig) {
          return sendResponse(
            res,
            400,
            false,
            "Designation with this title already exists"
          );
        }
      }

      const designation = await Designation.findByIdAndUpdate(
        req.params.id,
        {
          title,
          level,
          department,
          description,
          grade,
          responsibilities,
          requiredSkills,
          minExperience,
          maxExperience,
          isActive,
        },
        { new: true, runValidators: true }
      ).populate("department", "name code");

      if (!designation) {
        return sendResponse(res, 404, false, "Designation not found");
      }

      sendResponse(
        res,
        200,
        true,
        "Designation updated successfully",
        designation
      );
    } catch (error) {
      next(error);
    }
  }
);

// Delete designation (soft delete)
router.delete(
  "/:id",
  protect,
  authorize("hr", "admin"),
  async (req, res, next) => {
    try {
      const designation = await Designation.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );

      if (!designation) {
        return sendResponse(res, 404, false, "Designation not found");
      }

      sendResponse(res, 200, true, "Designation deleted successfully");
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
