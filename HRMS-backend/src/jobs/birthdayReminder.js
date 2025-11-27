const Employee = require('../models/Employee');
const { sendEmail } = require('../services/emailService');
const moment = require('moment');

exports.sendBirthdayWishes = async () => {
  try {
    const today = moment().format('MM-DD');
    const employees = await Employee.find({ status: 'Active' }).populate('userId');

    const birthdayEmployees = employees.filter(emp => {
      if (!emp.dateOfBirth) return false;
      return moment(emp.dateOfBirth).format('MM-DD') === today;
    });

    for (const emp of birthdayEmployees) {
      // Send birthday email
      await sendEmail({
        email: emp.userId.email,
        subject: '🎉 Happy Birthday!',
        html: `
          <h2>Happy Birthday, ${emp.firstName}! 🎂</h2>
          <p>Wishing you a wonderful day filled with joy and happiness!</p>
          <p>Best wishes,<br>Team HR</p>
        `
      });
    }

    console.log(`Sent birthday wishes to ${birthdayEmployees.length} employees`);
  } catch (error) {
    throw error;
  }
};