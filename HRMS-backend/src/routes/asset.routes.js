const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth.middleware");
const assetController = require("../controllers/assetController");
const Employee = require("../models/Employee"); // Import at top

// Protect all asset routes
router.use(protect);

// ==================== DEBUG & SETUP ====================
router.get('/debug/employee', async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    res.json({
      userId: req.user._id,
      userEmail: req.user.email,
      employeeFound: !!employee,
      employee: employee
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// In routes/assetRoutes.js - Updated ensure-employee route
router.post('/ensure-employee', async (req, res) => {
  try {
    let employee = await Employee.findOne({ user: req.user._id });
    
    if (!employee) {
      const now = new Date();
      
      // Get or create default Designation
      let defaultDesignation = await mongoose.model('Designation').findOne({ title: 'Software Developer' });
      if (!defaultDesignation) {
        defaultDesignation = await mongoose.model('Designation').create({
          title: 'Software Developer',
          level: 'Mid',
          description: 'Default software development role',
          isActive: true
        });
      }
      
      // Get or create default Department
      let defaultDepartment = await mongoose.model('Department').findOne({ name: 'IT Department' });
      if (!defaultDepartment) {
        defaultDepartment = await mongoose.model('Department').create({
          name: 'IT Department',
          code: 'IT',
          description: 'Default IT department',
          isActive: true
        });
      }
      
      // Create employee with all required fields
      employee = await Employee.create({
        user: req.user._id,
        userId: req.user._id.toString(),
        firstName: req.user.firstName || req.user.name?.split(' ')[0] || 'Employee',
        lastName: req.user.lastName || 'User',
        personalEmail: req.user.email || `${req.user._id}@example.com`,
        officialEmail: req.user.email || `${req.user._id}@company.com`,
        joiningDate: now,
        designation: defaultDesignation._id,
        department: defaultDepartment._id,
        status: 'Active',
        employmentType: 'Full-Time',
        workShift: 'Day',
        employeeId: `EMP${Date.now().toString().slice(-6)}`,
        isActive: true,
        
        // Add required fields with defaults
        bankDetails: {
          accountType: 'Savings'
        },
        statutoryDetails: {},
        emergencyContact: {},
        
        // Optional fields
        phone: req.user.phone || '',
        gender: req.user.gender || 'Other',
        workLocation: 'Office'
      });
      
      console.log('✅ Employee profile created for user:', req.user._id);
    }
    
    res.json({ 
      success: true, 
      employeeId: employee._id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      designation: employee.designation,
      department: employee.department,
      message: 'Employee profile is ready'
    });
  } catch (error) {
    console.error('Ensure employee error:', error.message);
    console.error('Validation errors:', error.errors);
    res.status(500).json({ 
      error: error.message,
      details: error.errors 
    });
  }
});
// ==================== ASSET REQUESTS ====================
router.get('/requests', assetController.getAssetRequests);
router.patch('/requests/:id/approve', authorize('admin', 'hr'), assetController.approveRequest);
router.post('/:id/request-allocation', assetController.requestAssetAllocation);

// ==================== CORE ASSETS ====================
router.get('/', assetController.getAllAssets);
router.get('/:id', assetController.getAssetById);
router.post('/', authorize('admin', 'hr'), assetController.createAsset);
router.put('/:id', authorize('admin', 'hr'), assetController.updateAsset);
router.delete('/:id', authorize('admin'), assetController.deleteAsset);
router.post('/:id/allocate', authorize('admin', 'hr'), assetController.allocateAsset);
router.post('/:id/return', assetController.returnAsset);
router.post('/:id/maintenance', authorize('admin', 'hr'), assetController.addMaintenance);
router.get('/analytics', authorize('admin', 'hr'), assetController.getAssetAnalytics);
router.get('/my-assets', assetController.getMyAssets);

module.exports = router;
