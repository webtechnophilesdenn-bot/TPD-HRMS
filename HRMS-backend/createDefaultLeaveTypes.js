// createDefaultLeaveTypes.js
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

const createDefaultLeaveTypes = async () => {
  try {
    // Use your actual MongoDB connection string
    const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hrms';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Import your LeaveType model (adjust path as needed)
    const LeaveType = require('./src/models/LeaveType');

    const defaultLeaveTypes = [
      {
        name: "Casual Leave",
        code: "CASUAL",
        description: "For casual or personal work",
        defaultBalance: 12,
        accrualRate: 1,
        maxAccrual: 24,
        isPaid: true,
        requiresApproval: true,
        approvalWorkflow: "Manager",
        minDuration: 0.5,
        maxDuration: 5,
        minNoticePeriod: 1,
        carryForward: {
          allowed: false,
          maxDays: 0,
          expiryMonths: 12,
          percentage: 100
        },
        applicableFor: "All",
        minServiceMonths: 0,
        probationEligible: true,
        requiresDocumentation: false,
        isActive: true
      },
      {
        name: "Sick Leave",
        code: "SICK",
        description: "For medical reasons and health issues",
        defaultBalance: 12,
        accrualRate: 1,
        maxAccrual: 18,
        isPaid: true,
        requiresApproval: true,
        approvalWorkflow: "Manager",
        minDuration: 0.5,
        maxDuration: 15,
        minNoticePeriod: 0,
        carryForward: {
          allowed: true,
          maxDays: 15,
          expiryMonths: 12,
          percentage: 100
        },
        applicableFor: "All",
        minServiceMonths: 0,
        probationEligible: true,
        requiresDocumentation: true,
        documentationTypes: ["Medical"],
        isActive: true
      },
      {
        name: "Earned Leave",
        code: "EARNED",
        description: "Privilege or earned leave",
        defaultBalance: 15,
        accrualRate: 1.25,
        maxAccrual: 45,
        isPaid: true,
        requiresApproval: true,
        approvalWorkflow: "Manager",
        minDuration: 0.5,
        maxDuration: 30,
        minNoticePeriod: 15,
        carryForward: {
          allowed: true,
          maxDays: 30,
          expiryMonths: 12,
          percentage: 100
        },
        applicableFor: "All",
        minServiceMonths: 3,
        probationEligible: false,
        requiresDocumentation: false,
        isActive: true
      },
      {
        name: "Maternity Leave",
        code: "MATERNITY",
        description: "For pregnancy and childbirth",
        defaultBalance: 180,
        isPaid: true,
        requiresApproval: true,
        approvalWorkflow: "HR",
        minDuration: 30,
        maxDuration: 180,
        minNoticePeriod: 30,
        carryForward: {
          allowed: false,
          maxDays: 0,
          expiryMonths: 12,
          percentage: 100
        },
        applicableFor: "Female",
        minServiceMonths: 12,
        probationEligible: false,
        requiresDocumentation: true,
        documentationTypes: ["Medical"],
        isActive: true
      },
      {
        name: "Paternity Leave",
        code: "PATERNITY",
        description: "For new fathers",
        defaultBalance: 15,
        isPaid: true,
        requiresApproval: true,
        approvalWorkflow: "Manager",
        minDuration: 1,
        maxDuration: 15,
        minNoticePeriod: 15,
        carryForward: {
          allowed: false,
          maxDays: 0,
          expiryMonths: 12,
          percentage: 100
        },
        applicableFor: "Male",
        minServiceMonths: 12,
        probationEligible: false,
        requiresDocumentation: true,
        documentationTypes: ["Medical"],
        isActive: true
      },
      {
        name: "Unpaid Leave",
        code: "UNPAID",
        description: "Leave without pay",
        defaultBalance: 0,
        isPaid: false,
        requiresApproval: true,
        approvalWorkflow: "HR",
        minDuration: 1,
        maxDuration: 90,
        minNoticePeriod: 7,
        carryForward: {
          allowed: false,
          maxDays: 0,
          expiryMonths: 12,
          percentage: 100
        },
        applicableFor: "All",
        minServiceMonths: 0,
        probationEligible: false,
        requiresDocumentation: true,
        isActive: true
      }
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const leaveTypeData of defaultLeaveTypes) {
      const exists = await LeaveType.findOne({ code: leaveTypeData.code });
      if (!exists) {
        await LeaveType.create(leaveTypeData);
        console.log(`✅ Created leave type: ${leaveTypeData.name} (Balance: ${leaveTypeData.defaultBalance} days)`);
        createdCount++;
      } else {
        // Update existing record with default balance if it's 0 or undefined
        if (!exists.defaultBalance || exists.defaultBalance === 0) {
          await LeaveType.findByIdAndUpdate(exists._id, { 
            defaultBalance: leaveTypeData.defaultBalance,
            isActive: true // Ensure it's active
          });
          console.log(`🔄 Updated leave type: ${leaveTypeData.name} (Set balance: ${leaveTypeData.defaultBalance} days)`);
          updatedCount++;
        } else {
          console.log(`✅ Leave type already exists: ${leaveTypeData.name} (Balance: ${exists.defaultBalance} days)`);
        }
      }
    }

    console.log('\n🎉 Default leave types setup completed!');
    console.log(`📊 Created: ${createdCount}, Updated: ${updatedCount}, Total: ${defaultLeaveTypes.length}`);
    
  } catch (error) {
    console.error('❌ Error creating leave types:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
};

// Run the script
createDefaultLeaveTypes();