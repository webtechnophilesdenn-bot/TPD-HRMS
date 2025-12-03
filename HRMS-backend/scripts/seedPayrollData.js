// scripts/seedPayrollData.js
const mongoose = require('mongoose');
const moment = require('moment');

(async () => {
  try {
    // 1) CONNECT TO MONGODB
    const connectionStrings = [
      process.env.MONGODB_URI,
      process.env.MONGO_URI,
      'mongodb://127.0.0.1:27017/hrms',
      'mongodb://localhost:27017/hrms'
    ].filter(Boolean);

    let connected = false;
    for (const uri of connectionStrings) {
      try {
        console.log(`🔌 Trying: ${uri}`);
        await mongoose.connect(uri);
        console.log('✅ MongoDB Connected!');
        connected = true;
        break;
      } catch (e) {
        console.log('❌ Failed, trying next...');
      }
    }

    if (!connected) {
      console.error('❌ Cannot connect to MongoDB');
      process.exit(1);
    }

    // 2) IMPORT MODELS AFTER CONNECTION
    const Payroll = require('../src/models/Payroll');
    const Employee = require('../src/models/Employee');

    // 3) CLEAR OLD PAYROLL DATA
    console.log('🧹 Clearing payroll data...');
    await Payroll.deleteMany({});

    // 4) FETCH SOME EMPLOYEES (NO POPULATE -> avoids Department model)
    let employees = await Employee.find({ status: 'Active' }).limit(3);

    if (employees.length === 0) {
      console.log('❌ No active employees found. Create employees first.');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`✅ Using ${employees.length} employees for dummy payroll`);

    // 5) DEFINE PERIOD: current month/year so UI matches
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const startDate = moment(`${year}-${String(month).padStart(2, '0')}-01`).startOf('month').toDate();
    const endDate = moment(startDate).endOf('month').toDate();
    const paymentDate = moment(endDate).add(7, 'days').toDate();

    console.log(`📅 Seeding payroll for period: ${month}/${year}`);

    // Helper to build one payroll document
    const buildPayroll = (employee, status, base) => {
      const basicSalary = employee.basicSalary || base;
      const grossEarnings = Math.round(basicSalary * 1.6);
      const totalDeductions = Math.round(grossEarnings * 0.15);
      const netSalary = grossEarnings - totalDeductions;

      return {
        employee: employee._id,

        // REQUIRED TOP-LEVEL FIELDS
        month,
        year,

        // REQUIRED NESTED PERIOD FIELDS
        period: {
          month,
          year,
          startDate,
          endDate,
          paymentDate
        },

        status,

        earnings: {
          basic: basicSalary,
          hra: Math.round(basicSalary * 0.4),
          specialAllowance: 10000,
          conveyance: 3000,
          medicalAllowance: 0,
          educationAllowance: 0,
          lta: 0,
          overtime: 0,
          bonus: 0,
          incentives: 0,
          arrears: 0,
          otherAllowances: 0
        },

        deductions: {
          pfEmployee: Math.round(basicSalary * 0.12),
          pfEmployer: Math.round(basicSalary * 0.12),
          esiEmployee: 0,
          esiEmployer: 0,
          professionalTax: 200,
          tds: Math.round(grossEarnings * 0.05),
          loanRecovery: 0,
          advanceRecovery: 0,
          lossOfPay: 0,
          otherDeductions: 0
        },

        summary: {
          grossEarnings,
          totalDeductions,
          netSalary,
          costToCompany: grossEarnings + Math.round(basicSalary * 0.24),
          takeHomeSalary: netSalary
        },

        attendance: {
          presentDays: 22,
          absentDays: 0,
          halfDays: 0,
          holidays: 4,
          weekends: 8,
          totalWorkingDays: 22,
          paidDays: 22,
          lossOfPayDays: 0,
          overtimeHours: 0,
          paidLeaves: 0,
          unpaidLeaves: 0,
          sickLeaves: 0,
          casualLeaves: 0,
          attendancePercentage: 100
        },

        leaves: {
          paidLeaves: 0,
          unpaidLeaves: 0,
          sickLeaves: 0,
          casualLeaves: 0
        },

        bankDetails: {
          accountNumber: employee.bankDetails?.accountNumber || '****1234',
          bankName: employee.bankDetails?.bankName || 'HDFC Bank',
          ifscCode: employee.bankDetails?.ifscCode || 'HDFC0001234',
          branch: employee.bankDetails?.branch || 'Main Branch',
          accountHolderName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim()
        },

        workflowStatus: {
          generatedBy: null,
          generatedAt: startDate,
          approvedBy: null,
          approvedAt: null,
          paidBy: null,
          paidAt: null,
          approvalRemarks: ''
        },

        generatedBy: null,
        generatedAt: startDate,
        approvedBy: null,
        approvedAt: null,
        paidBy: null,
        paidAt: null,

        remarks: 'Dummy seeded payroll record',

        auditTrail: [
          {
            action: 'PAYROLL_GENERATED',
            performedBy: null,
            timestamp: startDate,
            remarks: 'Seed script generated payroll',
            ipAddress: '127.0.0.1'
          }
        ]
      };
    };

    // 6) BUILD RECORDS
    const payrollRecords = [
      buildPayroll(employees[0], 'Paid', 50000),
      buildPayroll(employees[1], 'Approved', 45000),
      buildPayroll(employees[2], 'Generated', 60000)
    ];

    // 7) INSERT
    await Payroll.insertMany(payrollRecords);

    console.log('\n🎉 SUCCESS! Dummy payroll seeded.');
    console.log(`📊 Records: ${payrollRecords.length}`);
    console.log(`📅 Period: ${month}/${year}`);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
})();
