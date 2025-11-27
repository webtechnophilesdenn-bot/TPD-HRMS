const { getChatbotResponse } = require('../services/aiService');
const Employee = require('../models/Employee');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');

exports.chatbot = async (req, res, next) => {
  try {
    const { message } = req.body;
    const employee = await Employee.findOne({ userId: req.user.id });

    // Simple intent detection
    const lowerMessage = message.toLowerCase();

    let response = '';

    // Leave balance query
    if (lowerMessage.includes('leave balance')) {
      const balance = employee.leaveBalance;
      response = `Your leave balance:
• Casual Leave: ${balance.casual} days
• Sick Leave: ${balance.sick} days
• Earned Leave: ${balance.earned} days`;
    }
    
    // Attendance query
    else if (lowerMessage.includes('attendance') && lowerMessage.includes('last month')) {
      const lastMonth = moment().subtract(1, 'month');
      const attendance = await Attendance.find({
        employee: employee._id,
        date: {
          $gte: lastMonth.startOf('month').toDate(),
          $lte: lastMonth.endOf('month').toDate()
        }
      });

      const present = attendance.filter(a => a.status === 'Present').length;
      response = `Last month attendance: ${present} days present out of ${attendance.length} working days.`;
    }
    
    // Payslip download
    else if (lowerMessage.includes('payslip') || lowerMessage.includes('salary slip')) {
      const latestPayslip = await Payroll.findOne({ employee: employee._id })
        .sort({ year: -1, month: -1 });
      
      if (latestPayslip) {
        response = `Your latest payslip for ${latestPayslip.month}/${latestPayslip.year} is ready. Net Salary: ₹${latestPayslip.netSalary}. You can download it from the payroll section.`;
      } else {
        response = 'No payslips available yet.';
      }
    }
    
    // Use AI for complex queries
    else {
      response = await getChatbotResponse(message, employee);
    }

    sendResponse(res, 200, true, 'Response generated', { response });
  } catch (error) {
    next(error);
  }
};
