// routes/employee.routes.js
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
  getOrgChart,
  getMyTeam,
  getEmployeeProfile, // ADD THIS
} = require("../controllers/employeeController");

// ==================== EMPLOYEE SELF-SERVICE ====================
// All employees can access ONLY their own profile
router.get("/my-profile", protect, getMyProfile);
router.get("/my-full-profile", protect, getEmployeeProfile); // ADD THIS ROUTE
router.patch("/my-profile", protect, updateMyProfile);

// ==================== RESTRICTED ACCESS ====================
// Only HR/Admin/Manager can view all employees
router.get("/", protect, authorize("hr", "admin", "manager"), getAllEmployees);
router.get("/org-chart", protect, authorize("hr", "admin", "manager"), getOrgChart);
router.get("/my-team", protect, authorize("manager", "hr", "admin"), getMyTeam);

// Modified: Employees can view their own details, admins can view any
router.get("/:id", protect, getEmployeeById);

// ==================== HR/ADMIN ONLY ====================
router.post("/", protect, authorize("hr", "admin"), createEmployee);
router.patch("/:id", protect, updateEmployee); // Modified authorization
router.delete("/:id", protect, authorize("admin"), deleteEmployee);
router.post("/:id/documents", protect, authorize("hr", "admin"), uploadDocument);

module.exports = router;