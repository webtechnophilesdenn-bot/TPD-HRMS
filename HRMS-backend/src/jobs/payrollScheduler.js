const moment = require('moment');

exports.processMonthlyPayroll = async () => {
  try {
    const lastMonth = moment().subtract(1, 'month');
    const month = lastMonth.month() + 1;
    const year = lastMonth.year();

    // Import payroll controller
    const { generatePayrollInternal } = require('../controllers/payrollController');
    
    await generatePayrollInternal(month, year);
    
    console.log(`Processed payroll for ${month}/${year}`);
  } catch (error) {
    throw error;
  }
};