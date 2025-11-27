const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const moment = require('moment');

exports.autoMarkAbsent = async () => {
  try {
    const today = moment().startOf('day').toDate();
    const employees = await Employee.find({ status: 'Active' });

    for (const emp of employees) {
      // Check if attendance record exists
      const attendance = await Attendance.findOne({
        employee: emp._id,
        date: today
      });

      // If no record, mark as absent
      if (!attendance) {
        await Attendance.create({
          employee: emp._id,
          date: today,
          status: 'Absent'
        });
      }
    }

    console.log(`Auto-marked absent for ${employees.length} employees`);
  } catch (error) {
    throw error;
  }
};