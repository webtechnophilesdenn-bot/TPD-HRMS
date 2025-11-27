const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/complianceController');
const { protect, authorize } = require('../middlewares/auth.middleware');

// ==================== POLICY ROUTES ====================

// Policy CRUD
router.post('/policies', protect, authorize('admin', 'hr'), complianceController.createPolicy);
router.get('/policies', protect, complianceController.getAllPolicies);
router.get('/policies/:id', protect, complianceController.getPolicyById);
router.put('/policies/:id', protect, authorize('admin', 'hr'), complianceController.updatePolicy);
router.delete('/policies/:id', protect, authorize('admin', 'hr'), complianceController.deletePolicy);

// Policy Actions
router.post('/policies/:id/publish', protect, authorize('admin', 'hr'), complianceController.publishPolicy);
router.post('/policies/:id/reminders', protect, authorize('admin', 'hr'), complianceController.sendAcknowledgmentReminders);

// ==================== ACKNOWLEDGMENT ROUTES ====================

// Employee acknowledgments
router.get('/my-acknowledgments/pending', protect, complianceController.getMyPendingAcknowledgments);
router.post('/policies/:policyId/acknowledge', protect, complianceController.acknowledgePolicy);
router.post('/policies/:policyId/sign', protect, complianceController.signPolicy);
router.post('/policies/:policyId/track-view', protect, complianceController.trackPolicyView);

// Admin acknowledgment management
router.get('/policies/:policyId/acknowledgments', protect, authorize('admin', 'hr'), complianceController.getPolicyAcknowledgments);

// ==================== COMPLIANCE DOCUMENT ROUTES ====================

// Document CRUD
router.post('/documents', protect, authorize('admin', 'hr'), complianceController.createComplianceDocument);
router.get('/documents', protect, authorize('admin', 'hr'), complianceController.getAllComplianceDocuments);
router.get('/documents/expiring', protect, authorize('admin', 'hr'), complianceController.getExpiringDocuments);
router.get('/documents/expired', protect, authorize('admin', 'hr'), complianceController.getExpiredDocuments);
router.put('/documents/:id', protect, authorize('admin', 'hr'), complianceController.updateComplianceDocument);
router.delete('/documents/:id', protect, authorize('admin', 'hr'), complianceController.deleteComplianceDocument);

// Document actions
router.post('/documents/:documentId/send-alert', protect, authorize('admin', 'hr'), complianceController.sendExpiryAlerts);

// ==================== ANALYTICS ROUTES ====================

router.get('/dashboard', protect, authorize('admin', 'hr'), complianceController.getComplianceDashboard);

module.exports = router;
