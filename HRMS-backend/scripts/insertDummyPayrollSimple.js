// scripts/insertDummyPayrollSimple.js
const mongoose = require("mongoose");
const Payroll = require("../src/models/Payroll");

// Generate truly unique payrollId
const generatePayrollId = () => {
  return `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// === DUMMY PAYROLL DATA ===
const dummyPayrolls = [
  // Employee 1 - January 2025
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
    netSalary: 20000 + 8000 + 3000 + 1600 + 1250 + 500 + 1000 + 0 + 2000 + 1500 - (1800 + 0 + 200 + 500),
  },

  // Employee 2 - January 2025
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
    netSalary: 25000 + 10000 + 4000 + 1600 + 1250 + 700 + 1500 + 1000 + 3000 + 2000 - (2000 + 0 + 200 + 800),
  },

  // Employee 3 - January 2025
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
    netSalary: 18000 + 6000 + 2500 + 1600 + 1250 + 500 + 800 + 0 + 1500 + 1200 - (1600 + 0 + 200 + 300),
  },

  // February 2025 data for all employees
  {
    employee: "674f2a1c9a22b601d4f13a11",
    payrollId: generatePayrollId(),
    month: 2,
    year: 2025,
    period: {
      month: 2,
      year: 2025,
      startDate: new Date(2025, 1, 1),
      endDate: new Date(2025, 1, 28),
      paymentDate: new Date(2025, 2, 7),
    },
    earnings: {
      basic: 20000,
      hra: 8000,
      specialAllowance: 3000,
      conveyance: 1600,
      medicalAllowance: 1250,
      educationAllowance: 500,
      lta: 1000,
      overtime: 500,
      bonus: 1000,
      incentives: 1800,
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
      presentDays: 20,
      absentDays: 0,
      halfDays: 0,
      holidays: 1,
      weekends: 8,
      totalWorkingDays: 20,
      paidDays: 20,
      lossOfPayDays: 0,
      overtimeHours: 2,
      paidLeaves: 0,
      unpaidLeaves: 0,
      sickLeaves: 0,
      casualLeaves: 0,
      attendancePercentage: 100,
    },
    status: "Generated",
    netSalary: 20000 + 8000 + 3000 + 1600 + 1250 + 500 + 1000 + 500 + 1000 + 1800 - (1800 + 0 + 200 + 500),
  },

  {
    employee: "674f2a1c9a22b601d4f13a12",
    payrollId: generatePayrollId(),
    month: 2,
    year: 2025,
    period: {
      month: 2,
      year: 2025,
      startDate: new Date(2025, 1, 1),
      endDate: new Date(2025, 1, 28),
      paymentDate: new Date(2025, 2, 7),
    },
    earnings: {
      basic: 25000,
      hra: 10000,
      specialAllowance: 4000,
      conveyance: 1600,
      medicalAllowance: 1250,
      educationAllowance: 700,
      lta: 1500,
      overtime: 0,
      bonus: 2000,
      incentives: 2500,
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
      loanRecovery: 500,
      advanceRecovery: 0,
      lossOfPay: 0,
      otherDeductions: 0,
    },
    attendance: {
      presentDays: 18,
      absentDays: 2,
      halfDays: 0,
      holidays: 1,
      weekends: 8,
      totalWorkingDays: 20,
      paidDays: 18,
      lossOfPayDays: 0,
      overtimeHours: 0,
      paidLeaves: 2,
      unpaidLeaves: 0,
      sickLeaves: 0,
      casualLeaves: 0,
      attendancePercentage: 90,
    },
    status: "Generated",
    netSalary: 25000 + 10000 + 4000 + 1600 + 1250 + 700 + 1500 + 0 + 2000 + 2500 - (2000 + 0 + 200 + 800 + 500),
  },
];

// === DB INSERT SCRIPT ===
mongoose
  .connect("mongodb://127.0.0.1:27017/hrms", { family: 4 })
  .then(async () => {
    console.log("📌 Connected to MongoDB");

    let insertedCount = 0;
    let skippedCount = 0;

    for (const payroll of dummyPayrolls) {
      try {
        // Check if this employee/month/year already exists
        const exists = await Payroll.findOne({
          employee: payroll.employee,
          month: payroll.month,
          year: payroll.year,
        });

        if (exists) {
          console.log(`⚠️ Skipping: Employee ${payroll.employee} already has payroll for ${payroll.month}/${payroll.year}`);
          skippedCount++;
          continue;
        }

        // Double-check payrollId is unique
        let isUnique = false;
        let attempts = 0;
        let finalPayrollId = payroll.payrollId;

        while (!isUnique && attempts < 5) {
          const existing = await Payroll.findOne({ payrollId: finalPayrollId });
          if (!existing) {
            isUnique = true;
          } else {
            console.log(`🔄 PayrollId ${finalPayrollId} exists, generating new one...`);
            finalPayrollId = generatePayrollId();
            attempts++;
          }
        }

        if (!isUnique) {
          console.error(`❌ Could not generate unique payrollId after 5 attempts for employee ${payroll.employee}`);
          continue;
        }

        // Create the payroll
        const newPayroll = new Payroll({
          ...payroll,
          payrollId: finalPayrollId
        });

        await newPayroll.save();
        console.log(`✅ Inserted payroll for employee ${payroll.employee} (${payroll.month}/${payroll.year}) - ID: ${finalPayrollId}`);
        insertedCount++;

      } catch (error) {
        console.error(`❌ Error for employee ${payroll.employee}:`, error.message);
        // If it's a duplicate key error on payrollId, try one more time
        if (error.code === 11000 && error.keyPattern && error.keyPattern.payrollId) {
          console.log(`🔄 Retrying with new payrollId...`);
          try {
            payroll.payrollId = generatePayrollId();
            await Payroll.create(payroll);
            console.log(`✅ Successfully inserted after retry`);
            insertedCount++;
          } catch (retryError) {
            console.error(`❌ Failed on retry too:`, retryError.message);
          }
        }
      }
    }

    console.log("\n🎉 Insertion Complete:");
    console.log(`✅ Successfully inserted: ${insertedCount}`);
    console.log(`⚠️ Skipped (already exists): ${skippedCount}`);

    // Final verification
    const totalCount = await Payroll.countDocuments();
    console.log(`📊 Total payrolls in database now: ${totalCount}`);

    // Show a sample
    const sample = await Payroll.findOne({}).sort({ createdAt: -1 });
    if (sample) {
      console.log(`\n📝 Latest payroll sample:`);
      console.log(`   Employee: ${sample.employee}`);
      console.log(`   Payroll ID: ${sample.payrollId}`);
      console.log(`   Period: ${sample.month}/${sample.year}`);
      console.log(`   Status: ${sample.status}`);
    }

    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Connection error:", err);
    process.exit(1);
  });