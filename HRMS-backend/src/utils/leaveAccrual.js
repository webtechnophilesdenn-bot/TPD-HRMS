// utils/leaveAccrual.js - Add this for monthly accrual
const cron = require('node-cron');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveType = require('../models/LeaveType');
const Employee = require('../models/Employee');
const moment = require('moment');

const accrueMonthlyLeaves = async () => {
  try {
    console.log('Starting monthly leave accrual...');
    
    const currentYear = moment().year();
    const currentMonth = moment().month() + 1;
    
    // Get all active employees
    const employees = await Employee.find({ status: 'Active' });
    const leaveTypes = await LeaveType.find({ isActive: true });
    
    for (const employee of employees) {
      let balance = await LeaveBalance.findOne({
        employee: employee._id,
        year: currentYear,
      });
      
      if (!balance) {
        balance = await initializeLeaveBalance(employee._id, currentYear);
      }
      
      // Accrue leaves for each type
      for (const leaveType of leaveTypes) {
        if (leaveType.accrualRate && leaveType.accrualRate > 0) {
          const currentAccrued = balance.balances[leaveType.code].accrued || 0;
          const maxAccrual = leaveType.maxAccrual || Infinity;
          
          // Only accrue if under max limit
          if (currentAccrued < maxAccrual) {
            balance.balances[leaveType.code].accrued = Math.min(
              currentAccrued + leaveType.accrualRate,
              maxAccrual
            );
          }
        }
      }
      
      balance.calculateCurrentBalance();
      balance.lastCalculated = new Date();
      await balance.save();
    }
    
    console.log('Monthly leave accrual completed successfully');
  } catch (error) {
    console.error('Error in monthly leave accrual:', error);
  }
};

// Schedule to run on 1st of every month
cron.schedule('0 0 1 * *', accrueMonthlyLeaves);

module.exports = { accrueMonthlyLeaves };