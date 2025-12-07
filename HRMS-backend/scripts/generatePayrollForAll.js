// scripts/generatePayrollForAll.js
/**
 * Bulk Payroll Generation Script
 * Generates payroll for all active employees
 *
 * Usage: node scripts/generatePayrollForAll.js [month] [year]
 * Example: node scripts/generatePayrollForAll.js 12 2025
 */

const mongoose = require("mongoose");
require("dotenv").config();

// Models
const Employee = require("../src/models/Employee");
const SalaryStructure = require("../src/models/SalaryStructure");
const Attendance = require("../src/models/Attendance");
const Payroll = require("../src/models/Payroll");
const Designation = require("../src/models/Designation");
const Department = require("../src/models/Department");
const moment = require("moment");

// Database connection
// Replace the connectDB function with this:
const connectDB = async () => {
  try {
    // Use 127.0.0.1 instead of localhost to avoid IPv6 issues
    const uri = "mongodb://127.0.0.1:27017/hrms";

    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const setMissingBasicSalaries = async () => {
  console.log("\n💰 Setting Basic Salaries for Employees...");

  const employeesWithoutSalary = await Employee.find({
    $or: [
      { basicSalary: { $exists: false } },
      { basicSalary: 0 },
      { basicSalary: null },
    ],
    status: { $in: ["Active", "On Leave"] },
    personalEmail: { $exists: true, $ne: null }, // ✅ Only employees with email
  });

  let updated = 0;
  let skipped = 0;

  for (const emp of employeesWithoutSalary) {
    try {
      // Set default basic salary based on role or department
      let defaultSalary = 30000; // Default

      if (emp.employeeId?.includes("MGR")) defaultSalary = 60000;
      if (emp.employeeId?.includes("HR")) defaultSalary = 45000;
      if (emp.employeeId?.includes("ADM")) defaultSalary = 50000;

      emp.basicSalary = defaultSalary;
      await emp.save({ validateBeforeSave: false }); // Skip validation

      console.log(
        `   ✅ ${emp.employeeId} - Set to ₹${defaultSalary.toLocaleString(
          "en-IN"
        )}`
      );
      updated++;
    } catch (error) {
      console.log(`   ⚠️  ${emp.employeeId} - Skipped: ${error.message}`);
      skipped++;
    }
  }

  console.log(`\n   Summary: ✅ ${updated} updated | ⏭️  ${skipped} skipped`);
};

// STEP 1: Create Salary Structures for employees without them
const createMissingSalaryStructures = async () => {
  console.log("\n📋 STEP 1: Creating Missing Salary Structures...");

  try {
    const employees = await Employee.find({
      status: { $in: ["Active", "On Leave"] },
    }).populate("department"); // ← Remove 'designation' from populate

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const employee of employees) {
      try {
        // Check if salary structure exists
        const existingStructure = await SalaryStructure.findOne({
          employee: employee._id,
          isActive: true,
        });

        if (existingStructure) {
          console.log(
            `   ⏭️  ${employee.employeeId} - Already has salary structure`
          );
          skipped++;
          continue;
        }

        // Check if employee has basic salary
        const basicSalary = employee.basicSalary || 0;
        if (basicSalary === 0) {
          console.log(
            `   ⚠️  ${employee.employeeId} - No basic salary defined`
          );
          failed++;
          continue;
        }

        // Create salary structure
        const hraPercentage = 40; // 40% of basic
        const hra = Math.round((basicSalary * hraPercentage) / 100);
        const specialAllowance = Math.round(basicSalary * 0.2); // 20% of basic
        const conveyance = 1600;
        const medicalAllowance = 1250;

        // Calculate PF & ESI
        const pfApplicable = true;
        const pfBasicCapped = Math.min(basicSalary, 15000);
        const pfEmployee = Math.round((pfBasicCapped * 12) / 100);
        const pfEmployer = Math.round((pfBasicCapped * 12) / 100);

        const esiApplicable = basicSalary <= 21000;
        const esiEmployee = esiApplicable
          ? Math.round((basicSalary * 0.75) / 100)
          : 0;
        const esiEmployer = esiApplicable
          ? Math.round((basicSalary * 3.25) / 100)
          : 0;

        const professionalTax = 200;

        // Calculate gross and net
        const grossSalary =
          basicSalary + hra + specialAllowance + conveyance + medicalAllowance;
        const totalDeductions = pfEmployee + esiEmployee + professionalTax;
        const netSalary = grossSalary - totalDeductions;
        const ctc = grossSalary + pfEmployer + esiEmployer;

        const salaryStructure = await SalaryStructure.create({
          employee: employee._id,
          effectiveFrom: new Date(),
          isActive: true,
          earnings: {
            basic: basicSalary,
            hraPercentage: hraPercentage,
            hra: hra,
            specialAllowance: specialAllowance,
            conveyance: conveyance,
            medicalAllowance: medicalAllowance,
            educationAllowance: 0,
            lta: 0,
            otherAllowances: 0,
          },
          deductions: {
            pf: {
              applicable: pfApplicable,
              employeePercentage: 12,
              employerPercentage: 12,
              employeeContribution: pfEmployee,
              employerContribution: pfEmployer,
            },
            esi: {
              applicable: esiApplicable,
              employeePercentage: 0.75,
              employerPercentage: 3.25,
              employeeContribution: esiEmployee,
              employerContribution: esiEmployer,
            },
            professionalTax: {
              applicable: true,
              amount: professionalTax,
            },
            tds: {
              applicable: true,
              regime: "New",
              monthlyTDS: 0,
            },
          },
          summary: {
            grossSalary: Math.round(grossSalary),
            totalDeductions: Math.round(totalDeductions),
            netSalary: Math.round(netSalary),
            costToCompany: Math.round(ctc),
          },
        });

        // Update employee reference
        employee.currentSalaryStructure = salaryStructure._id;
        await employee.save();

        console.log(
          `   ✅ ${
            employee.employeeId
          } - Created (Net: ₹${netSalary.toLocaleString("en-IN")})`
        );
        created++;
      } catch (error) {
        console.log(`   ❌ ${employee.employeeId} - Error: ${error.message}`);
        failed++;
      }
    }

    console.log(
      `\n   Summary: ✅ ${created} created | ⏭️  ${skipped} skipped | ❌ ${failed} failed`
    );
    return { created, skipped, failed };
  } catch (error) {
    console.error("❌ Error creating salary structures:", error);
    throw error;
  }
};

// STEP 2: Create Attendance Records for the month
const createAttendanceRecords = async (month, year) => {
  console.log(
    `\n📅 STEP 2: Creating Attendance Records for ${month}/${year}...`
  );

  try {
    const employees = await Employee.find({
      status: { $in: ["Active", "On Leave"] },
    });

    const startDate = moment(`${year}-${month}-01`, "YYYY-MM-DD").startOf(
      "month"
    );
    const endDate = moment(startDate).endOf("month");

    let created = 0;
    let skipped = 0;

    for (const employee of employees) {
      try {
        // Check if attendance already exists for this month
        const existingCount = await Attendance.countDocuments({
          employee: employee._id,
          date: {
            $gte: startDate.toDate(),
            $lte: endDate.toDate(),
          },
        });

        if (existingCount > 0) {
          console.log(
            `   ⏭️  ${employee.employeeId} - Attendance already exists (${existingCount} days)`
          );
          skipped++;
          continue;
        }

        // Create attendance for each working day
        let createdDays = 0;
        for (
          let d = moment(startDate);
          d.isSameOrBefore(endDate);
          d.add(1, "day")
        ) {
          const dayOfWeek = d.day();

          // Skip Sundays (0) - or customize based on your org
          if (dayOfWeek === 0) {
            continue;
          }

          // Create attendance record (all present for simplicity)
          await Attendance.create({
            employee: employee._id,
            date: d.toDate(),
            status: "Present",
            checkIn: moment(d).set({ hour: 9, minute: 0 }).toDate(), // ← Just date
            checkOut: moment(d).set({ hour: 18, minute: 0 }).toDate(), // ← Just date
            location: {
              checkIn: {
                type: "Point",
                coordinates: [0, 0],
              },
              checkOut: {
                type: "Point",
                coordinates: [0, 0],
              },
            },
            workHours: 9,
            overtimeHours: 0,
            isRegularized: false,
          });

          createdDays++;
        }

        console.log(
          `   ✅ ${employee.employeeId} - Created ${createdDays} attendance records`
        );
        created++;
      } catch (error) {
        console.log(`   ❌ ${employee.employeeId} - Error: ${error.message}`);
      }
    }

    console.log(
      `\n   Summary: ✅ ${created} employees | ⏭️  ${skipped} skipped`
    );
    return { created, skipped };
  } catch (error) {
    console.error("❌ Error creating attendance:", error);
    throw error;
  }
};

// STEP 3: Generate Payroll
const generatePayroll = async (month, year) => {
  console.log(`\n💰 STEP 3: Generating Payroll for ${month}/${year}...`);

  try {
    const employees = await Employee.find({
      status: { $in: ["Active", "On Leave"] },
    })
      .populate("department")
      .populate("designation")
      .populate("currentSalaryStructure");

    const startDate = moment(`${year}-${month}-01`, "YYYY-MM-DD").startOf(
      "month"
    );
    const endDate = moment(startDate).endOf("month");
    const totalDays = endDate.diff(startDate, "days") + 1;

    let generated = 0;
    let skipped = 0;
    let failed = 0;
    let totalPayout = 0;

    for (const employee of employees) {
      try {
        // Check if payroll already exists
        const existingPayroll = await Payroll.findOne({
  employee: employee._id,
  month: month,
  year: year
});

        if (existingPayroll) {
          console.log(
            `   ⏭️  ${employee.employeeId} - Payroll already exists (${existingPayroll.status})`
          );
          skipped++;
          continue;
        }

        // Check salary structure
        const salaryStructure = employee.currentSalaryStructure;
        if (!salaryStructure) {
          console.log(`   ❌ ${employee.employeeId} - No salary structure`);
          failed++;
          continue;
        }

        // Get attendance records
        const attendanceRecords = await Attendance.find({
          employee: employee._id,
          date: {
            $gte: startDate.toDate(),
            $lte: endDate.toDate(),
          },
        });

        // Calculate attendance summary
        let presentDays = 0;
        let absentDays = 0;
        let weekends = 0;

        for (
          let d = moment(startDate);
          d.isSameOrBefore(endDate);
          d.add(1, "day")
        ) {
          if (d.day() === 0) {
            // Sunday
            weekends++;
          }
        }

        presentDays = attendanceRecords.filter(
          (a) => a.status === "Present"
        ).length;
        const totalWorkingDays = totalDays - weekends;
        const paidDays = presentDays;
        const lossOfPayDays = totalWorkingDays - presentDays;

        // Calculate payroll using salary structure method
        const payrollCalc = salaryStructure.calculateMonthlyPayroll(
          paidDays,
          totalWorkingDays,
          0, // overtime
          0, // loan recovery
          0, // advance recovery
          0 // other deductions
        );



        // Create payroll record
const payroll = await Payroll.create({
  employee: employee._id,
  
  // ✅ Required at root level
  month: month,
  year: year,
  
  // ✅ Required inside period (for frontend compatibility)
  period: {
    month: month,
    year: year,
    startDate: startDate.toDate(),
    endDate: endDate.toDate(),
    paymentDate: moment(startDate).add(1, 'month').date(7).toDate()
  },
  
  earnings: {
    basic: payrollCalc.breakdown.earnings.basic,
    hra: payrollCalc.breakdown.earnings.hra,
    specialAllowance: payrollCalc.breakdown.earnings.specialAllowance,
    conveyance: payrollCalc.breakdown.earnings.conveyance,
    medicalAllowance: payrollCalc.breakdown.earnings.medicalAllowance,
    educationAllowance: 0,
    lta: 0,
    overtime: 0,
    bonus: 0,
    incentives: 0,
    arrears: 0,
    otherAllowances: 0
  },
  
  deductions: {
    pfEmployee: payrollCalc.breakdown.deductions.pfEmployee,
    pfEmployer: payrollCalc.breakdown.deductions.pfEmployer,
    esiEmployee: payrollCalc.breakdown.deductions.esiEmployee,
    esiEmployer: payrollCalc.breakdown.deductions.esiEmployer,
    professionalTax: payrollCalc.breakdown.deductions.professionalTax,
    tds: payrollCalc.breakdown.deductions.tds,
    loanRecovery: 0,
    advanceRecovery: 0,
    lossOfPay: payrollCalc.lossOfPay,
    otherDeductions: 0
  },
  
  summary: {
    grossEarnings: payrollCalc.grossEarnings,
    totalDeductions: payrollCalc.totalDeductions,
    netSalary: payrollCalc.netSalary,
    costToCompany: payrollCalc.grossEarnings + 
                   payrollCalc.breakdown.deductions.pfEmployer + 
                   payrollCalc.breakdown.deductions.esiEmployer,
    takeHomeSalary: payrollCalc.netSalary
  },
  
  attendance: {
    totalWorkingDays: totalWorkingDays,
    presentDays: presentDays,
    absentDays: absentDays,
    halfDays: 0,
    paidDays: paidDays,
    lossOfPayDays: lossOfPayDays,
    holidays: 0,
    weekends: weekends,
    overtimeHours: 0,
    paidLeaves: 0,
    unpaidLeaves: 0,
    sickLeaves: 0,
    casualLeaves: 0,
    attendancePercentage: parseFloat((presentDays / totalWorkingDays * 100).toFixed(2))
  },
  
  leaves: {
    paidLeaves: 0,
    unpaidLeaves: 0,
    sickLeaves: 0,
    casualLeaves: 0
  },
  
  status: 'Generated',
  paymentMethod: 'Bank Transfer',
  
  bankDetails: {
    accountNumber: employee.bankDetails?.accountNumber,
    bankName: employee.bankDetails?.bankName,
    ifscCode: employee.bankDetails?.ifscCode,
    branch: employee.bankDetails?.branch,
    accountHolderName: `${employee.firstName} ${employee.lastName}`
  },
  
  salaryStructureSnapshot: salaryStructure._id
});

totalPayout += payroll.summary.netSalary;
console.log(`   ✅ ${employee.employeeId} - Generated (Net: ₹${payroll.summary.netSalary.toLocaleString('en-IN')})`);
generated++;


totalPayout += payroll.summary.netSalary;  // ✅ Access nested netSalary
console.log(`   ✅ ${employee.employeeId} - Generated (Net: ₹${payroll.summary.netSalary.toLocaleString('en-IN')})`);


totalPayout += payroll.netSalary; // ✅ Use netSalary at root level
console.log(`   ✅ ${employee.employeeId} - Generated (Net: ₹${payroll.netSalary.toLocaleString('en-IN')})`);


        totalPayout += payroll.summary.netSalary;
        console.log(
          `   ✅ ${
            employee.employeeId
          } - Generated (Net: ₹${payroll.summary.netSalary.toLocaleString(
            "en-IN"
          )})`
        );
        generated++;
      } catch (error) {
        console.log(`   ❌ ${employee.employeeId} - Error: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n   Summary:`);
    console.log(`   ✅ Generated: ${generated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   💰 Total Payout: ₹${totalPayout.toLocaleString("en-IN")}`);

    return { generated, skipped, failed, totalPayout };
  } catch (error) {
    console.error("❌ Error generating payroll:", error);
    throw error;
  }
};

// Main execution
const main = async () => {
  console.log("🚀 Bulk Payroll Generation Script");
  console.log("================================\n");

  const args = process.argv.slice(2);
  const month = args[0] ? parseInt(args[0]) : moment().month() + 1;
  const year = args[1] ? parseInt(args[1]) : moment().year();

  console.log(
    `📅 Target Period: ${moment(`${year}-${month}-01`).format("MMMM YYYY")}`
  );

  try {
    await connectDB();

    // ✅ ADD THIS LINE
    await setMissingBasicSalaries();

    await createMissingSalaryStructures();
    await createAttendanceRecords(month, year);
    const result = await generatePayroll(month, year);

    console.log("\n✅ Payroll Generation Completed Successfully!");
    console.log(`\n📊 Final Summary:`);
    console.log(`   Employees Processed: ${result.generated}`);
    console.log(
      `   Total Net Payout: ₹${result.totalPayout.toLocaleString("en-IN")}`
    );
  } catch (error) {
    console.error("\n❌ Script execution failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
    process.exit(0);
  }
};

// Run the script
main();
