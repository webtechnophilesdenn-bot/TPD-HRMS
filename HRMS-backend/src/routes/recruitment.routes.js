// routes/recruitment.routes.js

const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth.middleware");
const {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  applyForJob,
  getCandidates,
  rankCandidates,
  updateCandidateStatus,
  updateCandidateStage,
  scheduleInterview,
  submitInterviewFeedback,
  bulkUpdateCandidates,
  getRecruitmentAnalytics,
} = require("../controllers/recruitmentController");

// ==================== PUBLIC ROUTES ====================
router.get("/jobs", getAllJobs); // Anyone can view jobs

// ==================== AUTHENTICATED ROUTES ====================
router.get("/jobs/:id", protect, getJobById);
router.post("/jobs/:jobId/apply", protect, applyForJob); // ✅ Any logged-in user can apply

// ==================== ANALYTICS ====================
// ✅ Only HR, Admin, Manager can view analytics
router.get(
  "/analytics",
  protect,
  authorize("hr", "admin", "manager"),
  getRecruitmentAnalytics
);

// ==================== JOB MANAGEMENT (HR/ADMIN/MANAGER) ====================
router.post("/jobs", protect, authorize("hr", "admin", "manager"), createJob);
router.patch(
  "/jobs/:id",
  protect,
  authorize("hr", "admin", "manager"),
  updateJob
);
router.delete("/jobs/:id", protect, authorize("hr", "admin"), deleteJob);

// ==================== CANDIDATE MANAGEMENT (HR/ADMIN/MANAGER) ====================
router.get(
  "/jobs/:jobId/candidates",
  protect,
  authorize("hr", "admin", "manager"),
  getCandidates
);

router.post(
  "/jobs/:jobId/rank",
  protect,
  authorize("hr", "admin"),
  rankCandidates
);

router.patch(
  "/candidates/:id/status",
  protect,
  authorize("hr", "admin", "manager"),
  updateCandidateStatus
);

router.patch(
  "/candidates/:id/stage",
  protect,
  authorize("hr", "admin", "manager"),
  updateCandidateStage
);

router.post(
  "/candidates/bulk-update",
  protect,
  authorize("hr", "admin"),
  bulkUpdateCandidates
);

// ==================== INTERVIEW MANAGEMENT (HR/ADMIN/MANAGER) ====================
router.post(
  "/candidates/:id/interviews",
  protect,
  authorize("hr", "admin", "manager"),
  scheduleInterview
);

router.patch(
  "/candidates/:id/interviews/:interviewId/feedback",
  protect,
  authorize("hr", "admin", "manager"),
  submitInterviewFeedback
);

module.exports = router;
