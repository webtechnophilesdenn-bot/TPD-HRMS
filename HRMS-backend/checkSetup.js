const mongoose = require('mongoose');
const Employee = require('./src/models/Employee');
const SalaryStructure = require('./src/models/SalaryStructure');
const Attendance = require('./src/models/Attendance');
const moment = require('moment');

mongoose.connect('mongodb://127.0.0.1:27017/hrms_db');


const checkSetup = async () => {
  try {
    console.log('\n🔍 CHECKING HRMS SETUP FOR PAYROLL\n');
    console.log('='.repeat(50));

    // Check employees
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ isActive: true });
    console.log(`\n👥 EMPLOYEES:`);
    console.log(`   Total: ${totalEmployees}`);
    console.log(`   Active: ${activeEmployees}`);

    // Check salary structures
    const employees = await Employee.find({ isActive: true })
      .populate('currentSalaryStructure')
      .select('employeeId firstName lastName currentSalaryStructure');

    const withSalary = employees.filter(e => e.currentSalaryStructure);
    const withoutSalary = employees.filter(e => !e.currentSalaryStructure);

    console.log(`\n💰 SALARY STRUCTURES:`);
    console.log(`   ✅ With Structure: ${withSalary.length}`);
    console.log(`   ❌ Without Structure: ${withoutSalary.length}`);

    if (withoutSalary.length > 0) {
      console.log(`\n   ⚠️  Employees without salary structure:`);
      withoutSalary.forEach(e => {
        console.log(`      - ${e.employeeId}: ${e.firstName} ${e.lastName}`);
      });
    }

    // Check attendance for current month
    const currentMonth = moment().month() + 1;
    const currentYear = moment().year();
    const startDate = moment({ year: currentYear, month: currentMonth - 1, day: 1 }).startOf('month');
    const endDate = moment(startDate).endOf('month');

    console.log(`\n📅 ATTENDANCE (${moment().format('MMMM YYYY')}):`);
    
    for (const emp of employees) {
      const attendanceCount = await Attendance.countDocuments({
        employee: emp._id,
        date: {
          $gte: startDate.toDate(),
          $lte: endDate.toDate()
        }
      });

      const hasSalary = emp.currentSalaryStructure ? '✅' : '❌';
      const hasAttendance = attendanceCount > 0 ? '✅' : '❌';
      
      console.log(`   ${emp.employeeId}: ${hasSalary} Salary | ${hasAttendance} Attendance (${attendanceCount} days)`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Setup check complete!\n');

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
};

checkSetup();
