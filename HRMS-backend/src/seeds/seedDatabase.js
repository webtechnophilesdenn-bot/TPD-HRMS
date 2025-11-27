const LeaveType = require("../models/LeaveType");

const defaultLeaveTypes = [
  {
    code: 'CASUAL',
    name: 'Casual Leave',
    description: 'For personal matters and short breaks',
    isPaid: true,
    defaultBalance: 12,
    maxAccrual: 12,
    isActive: true,
    requiresApproval: true,
    approvalWorkflow: 'Manager',
    maxDuration: 5,
    minNoticePeriod: 1,
    minServiceMonths: 0,
    probationEligible: true,
    carryForward: { allowed: false, maxDays: 0 },
    blackoutPeriods: [],
    color: '#3B82F6',
    icon: 'calendar'
  },
  {
    code: 'SICK',
    name: 'Sick Leave',
    description: 'For medical emergencies and health issues',
    isPaid: true,
    defaultBalance: 12,
    maxAccrual: 12,
    isActive: true,
    requiresApproval: false,
    approvalWorkflow: 'Auto',
    maxDuration: 10,
    minNoticePeriod: 0,
    minServiceMonths: 0,
    probationEligible: true,
    carryForward: { allowed: false, maxDays: 0 },
    blackoutPeriods: [],
    color: '#10B981',
    icon: 'activity'
  },
  {
    code: 'EARNED',
    name: 'Earned Leave',
    description: 'Accrued leave for long service',
    isPaid: true,
    defaultBalance: 0,
    maxAccrual: 30,
    isActive: true,
    requiresApproval: true,
    approvalWorkflow: 'Both',
    maxDuration: 15,
    minNoticePeriod: 7,
    minServiceMonths: 6,
    probationEligible: false,
    carryForward: { allowed: true, maxDays: 15 },
    blackoutPeriods: [],
    color: '#8B5CF6',
    icon: 'award'
  },
  {
    code: 'MATERNITY',
    name: 'Maternity Leave',
    description: 'For expecting mothers',
    isPaid: true,
    defaultBalance: 180,
    maxAccrual: 180,
    isActive: true,
    requiresApproval: true,
    approvalWorkflow: 'HR',
    maxDuration: 180,
    minNoticePeriod: 30,
    minServiceMonths: 3,
    probationEligible: false,
    gender: 'Female',
    carryForward: { allowed: false, maxDays: 0 },
    blackoutPeriods: [],
    color: '#EC4899',
    icon: 'heart'
  },
  {
    code: 'PATERNITY',
    name: 'Paternity Leave',
    description: 'For new fathers',
    isPaid: true,
    defaultBalance: 15,
    maxAccrual: 15,
    isActive: true,
    requiresApproval: true,
    approvalWorkflow: 'Manager',
    maxDuration: 15,
    minNoticePeriod: 7,
    minServiceMonths: 3,
    probationEligible: false,
    gender: 'Male',
    carryForward: { allowed: false, maxDays: 0 },
    blackoutPeriods: [],
    color: '#F59E0B',
    icon: 'users'
  }
];

const seedLeaveTypes = async () => {
  try {
    // Check if leave types already exist
    const count = await LeaveType.countDocuments();
    
    if (count > 0) {
      console.log(`✓ Leave types already exist (${count} types found)`);
      return;
    }

    // Insert default leave types
    await LeaveType.insertMany(defaultLeaveTypes);
    console.log('✓ Default leave types seeded successfully');
  } catch (error) {
    console.error('✗ Error seeding leave types:', error.message);
  }
};

module.exports = seedLeaveTypes;
