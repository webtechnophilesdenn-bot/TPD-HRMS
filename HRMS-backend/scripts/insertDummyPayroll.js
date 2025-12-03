// scripts/insertDummyPayroll.js
const mongoose = require("mongoose");
const Payroll = require("../src/models/Payroll");

// Generate a unique payrollId
const generatePayrollId = () => "PAY-" + Date.now() + "-" + Math.floor(Math.random() * 10000);

// === DUMMY PAYROLL DATA ===
const dummyPayrolls = [
  {
    employee: "674f2a1c9a22b601d4f13a11",
    payrollId: generatePayrollId(),
    month: 1,
    year: 2025,
    period: {
      month: 1,
      year: 2025,
      startDate: new Date(2025, 0, 1),
      endDate: new Date(2025, 0, 31),
      paymentDate: new Date(2025, 1, 7),
    },
    earnings: {
      basic: 20000,
      hra: 8000,
      specialAllowance: 3000,
      conveyance: 1600,
      medicalAllowance: 1250,
      educationAllowance: 500,
      lta: 1000,
      overtime: 0,
      bonus: 2000,
      incentives: 1500,
      arrears: 0,
      otherAllowances: 0,
    },
    deductions: {
      pfEmployee: 1800,
      pfEmployer: 1800,
      esiEmployee: 0,
      esiEmployer: 0,
      professionalTax: 200,
      tds: 500,
      loanRecovery: 0,
      advanceRecovery: 0,
      lossOfPay: 0,
      otherDeductions: 0,
    },
    attendance: {
      presentDays: 22,
      absentDays: 2,
      halfDays: 0,
      holidays: 2,
      weekends: 8,
      totalWorkingDays: 22,
      paidDays: 22,
      lossOfPayDays: 0,
      overtimeHours: 0,
      paidLeaves: 1,
      unpaidLeaves: 1,
      sickLeaves: 0,
      casualLeaves: 1,
      attendancePercentage: 91,
    },
    status: "Generated",
  },

  {
    employee: "674f2a1c9a22b601d4f13a12",
    payrollId: generatePayrollId(),
    month: 1,
    year: 2025,
    period: {
      month: 1,
      year: 2025,
      startDate: new Date(2025, 0, 1),
      endDate: new Date(2025, 0, 31),
      paymentDate: new Date(2025, 1, 7),
    },
    earnings: {
      basic: 25000,
      hra: 10000,
      specialAllowance: 4000,
      conveyance: 1600,
      medicalAllowance: 1250,
      educationAllowance: 700,
      lta: 1500,
      overtime: 1000,
      bonus: 3000,
      incentives: 2000,
      arrears: 0,
      otherAllowances: 0,
    },
    deductions: {
      pfEmployee: 2000,
      pfEmployer: 2000,
      esiEmployee: 0,
      esiEmployer: 0,
      professionalTax: 200,
      tds: 800,
      loanRecovery: 0,
      advanceRecovery: 0,
      lossOfPay: 0,
      otherDeductions: 0,
    },
    attendance: {
      presentDays: 21,
      absentDays: 1,
      halfDays: 0,
      holidays: 2,
      weekends: 8,
      totalWorkingDays: 22,
      paidDays: 21,
      lossOfPayDays: 0,
      overtimeHours: 5,
      paidLeaves: 1,
      unpaidLeaves: 0,
      sickLeaves: 1,
      casualLeaves: 0,
      attendancePercentage: 95,
    },
    status: "Generated",
  },

  {
    employee: "674f2a1c9a22b601d4f13a13",
    payrollId: generatePayrollId(),
    month: 1,
    year: 2025,
    period: {
      month: 1,
      year: 2025,
      startDate: new Date(2025, 0, 1),
      endDate: new Date(2025, 0, 31),
      paymentDate: new Date(2025, 1, 7),
    },
    earnings: {
      basic: 18000,
      hra: 6000,
      specialAllowance: 2500,
      conveyance: 1600,
      medicalAllowance: 1250,
      educationAllowance: 500,
      lta: 800,
      overtime: 0,
      bonus: 1500,
      incentives: 1200,
      arrears: 0,
      otherAllowances: 0,
    },
    deductions: {
      pfEmployee: 1600,
      pfEmployer: 1600,
      esiEmployee: 0,
      esiEmployer: 0,
      professionalTax: 200,
      tds: 300,
      loanRecovery: 0,
      advanceRecovery: 0,
      lossOfPay: 0,
      otherDeductions: 0,
    },
    attendance: {
      presentDays: 20,
      absentDays: 2,
      halfDays: 0,
      holidays: 2,
      weekends: 8,
      totalWorkingDays: 22,
      paidDays: 20,
      lossOfPayDays: 0,
      overtimeHours: 0,
      paidLeaves: 0,
      unpaidLeaves: 2,
      sickLeaves: 0,
      casualLeaves: 0,
      attendancePercentage: 86,
    },
    status: "Generated",
  },
];

// === DB INSERT SCRIPT ===
mongoose
  .connect("mongodb://127.0.0.1:27017/hrms", { family: 4 })
  .then(async () => {
    console.log("📌 Connected to MongoDB");

    for (const payroll of dummyPayrolls) {
      // Prevent duplicate month/year for same employee
      const exists = await Payroll.findOne({
        employee: payroll.employee,
        "period.month": payroll.period.month,
        "period.year": payroll.period.year,
      });

      if (exists) {
        console.log(`⚠️ Payroll already exists for employee ${payroll.employee}. Skipping.`);
        continue;
      }

      await Payroll.create(payroll);
      console.log(`✅ Inserted payroll for employee ${payroll.employee}`);
    }

    console.log("🎉 All dummy payrolls inserted.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error inserting dummy payrolls:", err);
    process.exit(1);
  });
