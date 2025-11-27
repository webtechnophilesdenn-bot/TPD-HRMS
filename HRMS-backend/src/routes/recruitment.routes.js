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
  updateCandidateStage,
  scheduleInterview,
  submitInterviewFeedback,
  bulkUpdateCandidates,
  getRecruitmentAnalytics,
} = require("../controllers/recruitmentController");

// Public routes
router.get("/jobs", getAllJobs);
router.get("/jobs/:id", getJobById);
router.post("/jobs/:jobId/apply", applyForJob);

// Protected HR/Admin routes
router.post("/jobs", protect, authorize("hr", "admin", "manager"), createJob);
router.patch(
  "/jobs/:id",
  protect,
  authorize("hr", "admin", "manager"),
  updateJob
);
router.delete("/jobs/:id", protect, authorize("admin"), deleteJob);

// Candidate management
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

// Interview management
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

// Analytics
router.get(
  "/analytics/recruitment",
  protect,
  authorize("hr", "admin"),
  getRecruitmentAnalytics
);

module.exports = router;
