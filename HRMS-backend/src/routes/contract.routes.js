// routes/contract.routes.js
const express = require("express");
const router = express.Router();
const {
  createContract,
  getContracts,
  getContractById,
  updateContract,
  archiveContract,
  sendForSignature,
  handleSignatureWebhook,
  getMyContracts,
} = require("../controllers/contractController");
const { protect, authorize } = require("../middlewares/auth.middleware");

// Employee: view own contracts
router.get("/my", protect, getMyContracts);

// Admin / HR: manage all contracts
router.post("/", protect, authorize("hr", "admin"), createContract);
router.get("/", protect, authorize("hr", "admin"), getContracts);
router.get("/:id", protect, authorize("hr", "admin"), getContractById);
router.patch("/:id", protect, authorize("hr", "admin"), updateContract);
router.patch("/:id/archive", protect, authorize("hr", "admin"), archiveContract);

// Send for e-sign
router.post("/:id/send-for-signature", protect, authorize("hr", "admin"), sendForSignature);

// Webhook (no auth; secure via secret/IP in production)
router.post("/webhooks/esign", handleSignatureWebhook);

module.exports = router;
