const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth.middleware");
const {
  createAsset,
  getAllAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  allocateAsset,
  returnAsset,
  requestAsset,
  getMyAssets,
  addMaintenance,
  getAssetAnalytics,
} = require("../controllers/assetController");

// IMPORTANT: Define specific routes before parameterized routes to avoid conflicts

// Employee Asset Operations
router.get("/my-assets", protect, getMyAssets);
router.post("/request", protect, requestAsset);

// Asset Management (Admin/HR only)
router.post("/", protect, authorize("admin", "hr"), createAsset);
router.get("/", protect, getAllAssets);
router.get("/analytics", protect, authorize("admin", "hr"), getAssetAnalytics);

// Asset operations by ID - these must come after specific routes
router.get("/:id", protect, getAssetById);
router.patch("/:id", protect, authorize("admin", "hr"), updateAsset);
router.delete("/:id", protect, authorize("admin"), deleteAsset);
router.post("/:id/allocate", protect, authorize("admin", "hr"), allocateAsset);
router.post("/:id/return", protect, returnAsset);
router.post(
  "/:id/maintenance",
  protect,
  authorize("admin", "hr"),
  addMaintenance
);

module.exports = router;
