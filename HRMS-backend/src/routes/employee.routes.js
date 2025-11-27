const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth.middleware");

const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadDocument,
  getMyProfile,
  updateMyProfile,
} = require("../controllers/employeeController");

// Public routes (authenticated users only)
router.get("/my-profile", protect, getMyProfile);
router.patch("/my-profile", protect, updateMyProfile);

// Employee data access (all authenticated users can view)
router.get("/", protect, getAllEmployees);
router.get("/:id", protect, getEmployeeById);

// HR/Admin only routes
router.post("/", protect, authorize("hr", "admin"), createEmployee);
router.patch("/:id", protect, authorize("hr", "admin"), updateEmployee);
router.delete("/:id", protect, authorize("admin"), deleteEmployee);
router.post(
  "/:id/documents",
  protect,
  authorize("hr", "admin"),
  uploadDocument
);

module.exports = router;
