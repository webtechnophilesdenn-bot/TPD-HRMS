const Employee = require('../models/Employee');

exports.resetLeaveBalance = async () => {
  try {
    const employees = await Employee.find({ status: 'Active' });

    for (const emp of employees) {
      // Reset leave balance
      emp.leaveBalance = {
        casual: 12,
        sick: 12,
        earned: emp.leaveBalance.earned || 0, // Carry forward earned leaves
        maternity: emp.gender === 'Female' ? 180 : 0,
        paternity: emp.gender === 'Male' ? 15 : 0
      };
      await emp.save();
    }

    console.log(`Reset leave balance for ${employees.length} employees`);
  } catch (error) {
    throw error;
  }
};