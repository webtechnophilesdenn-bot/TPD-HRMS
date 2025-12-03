// routes/employee.routes.js - FIXED VERSION

const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth.middleware");

// Import only the functions that exist in the controller
const {
  getAllEmployees,
  getEmployeeById,
  getMyProfile,
  getEmployeeProfile,
  createEmployee,
  updateEmployee,
  updateMyProfile,
  deleteEmployee,
  uploadDocument,
  getOrgChart,
  getMyTeam,
  getReportingManagers,
  // uploadProfilePicture, // Comment out if not implemented
  // bulkUpdateEmployees, // Comment out if not implemented
} = require("../controllers/employeeController");

// ==================== EMPLOYEE SELF-SERVICE ====================
// All employees can access ONLY their own profile
router.get("/my-profile", protect, getMyProfile);
router.get("/my-full-profile", protect, getEmployeeProfile);
router.patch("/my-profile", protect, updateMyProfile);
// router.post("/my-profile/picture", protect, uploadProfilePicture); // Uncomment when implemented

// ==================== MANAGER/HR/ADMIN ROUTES ====================
// Only Manager/HR/Admin can view these
router.get("/my-team", protect, authorize("manager", "hr", "admin"), getMyTeam);
router.get("/org-chart", protect, authorize("hr", "admin", "manager"), getOrgChart);
router.get(
  "/reporting-managers",
  protect,
  authorize("hr", "admin", "manager"),
  getReportingManagers
);

// ✅ FIXED: Allow HR, Admin, and Manager to get all employees
router.get(
  "/",
  protect,
  authorize("hr", "admin", "manager"),
  getAllEmployees
);

// ==================== INDIVIDUAL EMPLOYEE ACCESS ====================
// Modified: Employees can view their own details, managers/hr/admin can view any
router.get("/:id", protect, getEmployeeById);

// ==================== HR/ADMIN ONLY ROUTES ====================
router.post("/", protect, authorize("hr", "admin"), createEmployee);
router.patch("/:id", protect, authorize("hr", "admin"), updateEmployee);
router.delete("/:id", protect, authorize("admin"), deleteEmployee);
router.post("/:id/documents", protect, authorize("hr", "admin"), uploadDocument);
// router.patch("/bulk-update", protect, authorize("hr", "admin"), bulkUpdateEmployees); // Uncomment when implemented

module.exports = router;
