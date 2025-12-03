// scripts/insertDummyPayrollFinal.js
const mongoose = require("mongoose");
const Payroll = require("../src/models/Payroll");

// Generate truly unique payrollId
const generatePayrollId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `PAY-${timestamp}-${random}`;
};

// Calculate net salary
const calculateNetSalary = (earnings, deductions) => {
  const totalEarnings = Object.values(earnings).reduce((sum, val) => sum + (val || 0), 0);
  const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0);
  return totalEarnings - totalDeductions;
};

// === DUMMY PAYROLL DATA ===
const createDummyPayrolls = () => {
  const payrolls = [];
  const employees = [
    "674f2a1c9a22b601d4f13a11",
    "674f2a1c9a22b601d4f13a12", 
    "674f2a1c9a22b601d4f13a13"
  ];
  
  const months = [1, 2]; // January and February 2025
  const year = 2025;

  for (const employeeId of employees) {
    for (const month of months) {
      // Base earnings structure
      const baseEarnings = {
        basic: employeeId === "674f2a1c9a22b601d4f13a11" ? 20000 :
               employeeId === "674f2a1c9a22b601d4f13a12" ? 25000 : 18000,
        hra: employeeId === "674f2a1c9a22b601d4f13a11" ? 8000 :
             employeeId === "674f2a1c9a22b601d4f13a12" ? 10000 : 6000,
        specialAllowance: employeeId === "674f2a1c9a22b601d4f13a11" ? 3000 :
                         employeeId === "674f2a1c9a22b601d4f13a12" ? 4000 : 2500,
        conveyance: 1600,
        medicalAllowance: 1250,
        educationAllowance: employeeId === "674f2a1c9a22b601d4f13a11" ? 500 :
                          employeeId === "674f2a1c9a22b601d4f13a12" ? 700 : 500,
        lta: employeeId === "674f2a1c9a22b601d4f13a11" ? 1000 :
             employeeId === "674f2a1c9a22b601d4f13a12" ? 1500 : 800,
        overtime: month === 1 ? 
                 (employeeId === "674f2a1c9a22b601d4f13a12" ? 1000 : 0) :
                 (employeeId === "674f2a1c9a22b601d4f13a11" ? 500 : 0),
        bonus: month === 1 ? 
              (employeeId === "674f2a1c9a22b601d4f13a11" ? 2000 :
               employeeId === "674f2a1c9a22b601d4f13a12" ? 3000 : 1500) :
              (employeeId === "674f2a1c9a22b601d4f13a11" ? 1000 :
               employeeId === "674f2a1c9a22b601d4f13a12" ? 2000 : 1200),
        incentives: month === 1 ? 
                   (employeeId === "674f2a1c9a22b601d4f13a11" ? 1500 :
                    employeeId === "674f2a1c9a22b601d4f13a12" ? 2000 : 1200) :
                   (employeeId === "674f2a1c9a22b601d4f13a11" ? 1800 :
                    employeeId === "674f2a1c9a22b601d4f13a12" ? 2500 : 1400),
        arrears: 0,
        otherAllowances: 0,
      };

      // Base deductions structure
      const baseDeductions = {
        pfEmployee: employeeId === "674f2a1c9a22b601d4f13a11" ? 1800 :
                    employeeId === "674f2a1c9a22b601d4f13a12" ? 2000 : 1600,
        pfEmployer: employeeId === "674f2a1c9a22b601d4f13a11" ? 1800 :
                    employeeId === "674f2a1c9a22b601d4f13a12" ? 2000 : 1600,
        esiEmployee: 0,
        esiEmployer: 0,
        professionalTax: 200,
        tds: employeeId === "674f2a1c9a22b601d4f13a11" ? 500 :
             employeeId === "674f2a1c9a22b601d4f13a12" ? 800 : 300,
        loanRecovery: month === 2 && employeeId === "674f2a1c9a22b601d4f13a12" ? 500 : 0,
        advanceRecovery: month === 2 && employeeId === "674f2a1c9a22b601d4f13a13" ? 300 : 0,
        lossOfPay: 0,
        otherDeductions: 0,
      };

      // Attendance data
      const attendanceData = {
        presentDays: month === 1 ? 
                    (employeeId === "674f2a1c9a22b601d4f13a11" ? 22 :
                     employeeId === "674f2a1c9a22b601d4f13a12" ? 21 : 20) :
                    (employeeId === "674f2a1c9a22b601d4f13a11" ? 20 :
                     employeeId === "674f2a1c9a22b601d4f13a12" ? 18 : 19),
        absentDays: month === 1 ? 
                   (employeeId === "674f2a1c9a22b601d4f13a11" ? 2 :
                    employeeId === "674f2a1c9a22b601d4f13a12" ? 1 : 2) :
                   (employeeId === "674f2a1c9a22b601d4f13a11" ? 0 :
                    employeeId === "674f2a1c9a22b601d4f13a12" ? 2 : 1),
        halfDays: 0,
        holidays: month === 1 ? 2 : 1,
        weekends: 8,
        totalWorkingDays: month === 1 ? 22 : 20,
        paidDays: month === 1 ? 
                 (employeeId === "674f2a1c9a22b601d4f13a11" ? 22 :
                  employeeId === "674f2a1c9a22b601d4f13a12" ? 21 : 20) :
                 (employeeId === "674f2a1c9a22b601d4f13a11" ? 20 :
                  employeeId === "674f2a1c9a22b601d4f13a12" ? 18 : 19),
        lossOfPayDays: 0,
        overtimeHours: month === 1 ? 
                      (employeeId === "674f2a1c9a22b601d4f13a12" ? 5 : 0) :
                      (employeeId === "674f2a1c9a22b601d4f13a11" ? 2 : 3),
        paidLeaves: month === 1 ? 
                   (employeeId === "674f2a1c9a22b601d4f13a11" ? 1 :
                    employeeId === "674f2a1c9a22b601d4f13a12" ? 1 : 0) :
                   (employeeId === "674f2a1c9a22b601d4f13a11" ? 0 :
                    employeeId === "674f2a1c9a22b601d4f13a12" ? 2 : 1),
        unpaidLeaves: month === 1 ? 
                     (employeeId === "674f2a1c9a22b601d4f13a11" ? 1 :
                      employeeId === "674f2a1c9a22b601d4f13a12" ? 0 : 2) :
                     (employeeId === "674f2a1c9a22b601d4f13a11" ? 0 :
                      employeeId === "674f2a1c9a22b601d4f13a12" ? 0 : 0),
        sickLeaves: month === 1 ? 
                   (employeeId === "674f2a1c9a22b601d4f13a12" ? 1 : 0) : 0,
        casualLeaves: month === 1 ? 
                     (employeeId === "674f2a1c9a22b601d4f13a11" ? 1 : 0) : 0,
        attendancePercentage: month === 1 ? 
                            (employeeId === "674f2a1c9a22b601d4f13a11" ? 91 :
                             employeeId === "674f2a1c9a22b601d4f13a12" ? 95 : 86) :
                            (employeeId === "674f2a1c9a22b601d4f13a11" ? 100 :
                             employeeId === "674f2a1c9a22b601d4f13a12" ? 90 : 95),
      };

      // Calculate dates
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const paymentDate = new Date(year, month, 7);

      const netSalary = calculateNetSalary(baseEarnings, baseDeductions);

      payrolls.push({
        employee: employeeId,
        payrollId: generatePayrollId(),
        month: month,
        year: year,
        period: {
          month: month,
          year: year,
          startDate: startDate,
          endDate: endDate,
          paymentDate: paymentDate,
        },
        earnings: baseEarnings,
        deductions: baseDeductions,
        attendance: attendanceData,
        netSalary: netSalary,
        status: "Generated",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  return payrolls;
};

// === DB INSERT SCRIPT ===
mongoose
  .connect("mongodb://127.0.0.1:27017/hrms", { family: 4 })
  .then(async () => {
    console.log("📌 Connected to MongoDB");

    // First, check if there are any payrolls
    const existingCount = await Payroll.countDocuments();
    console.log(`📊 Existing payrolls in database: ${existingCount}`);

    if (existingCount > 0) {
      console.log("⚠️ Database already has payrolls. Cleaning up first...");
      await Payroll.deleteMany({});
      console.log("🗑️ Cleared existing payrolls");
    }

    const dummyPayrolls = createDummyPayrolls();
    console.log(`📝 Generated ${dummyPayrolls.length} dummy payrolls`);

    let insertedCount = 0;
    let errorCount = 0;

    // Insert in batches to avoid overwhelming MongoDB
    const batchSize = 3;
    for (let i = 0; i < dummyPayrolls.length; i += batchSize) {
      const batch = dummyPayrolls.slice(i, i + batchSize);
      
      try {
        // Insert the batch
        const result = await Payroll.insertMany(batch, { ordered: false });
        insertedCount += result.length;
        console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}: ${result.length} payrolls`);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (batchError) {
        console.error(`❌ Error in batch ${Math.floor(i/batchSize) + 1}:`, batchError.message);
        
        // Try inserting individually
        for (const payroll of batch) {
          try {
            // Ensure payrollId is unique
            let uniquePayrollId = payroll.payrollId;
            let attempts = 0;
            let isUnique = false;
            
            while (!isUnique && attempts < 3) {
              const exists = await Payroll.findOne({ payrollId: uniquePayrollId });
              if (!exists) {
                isUnique = true;
              } else {
                uniquePayrollId = generatePayrollId();
                attempts++;
              }
            }
            
            if (!isUnique) {
              throw new Error(`Could not generate unique payrollId after 3 attempts`);
            }
            
            const newPayroll = new Payroll({
              ...payroll,
              payrollId: uniquePayrollId
            });
            
            await newPayroll.save();
            insertedCount++;
            console.log(`   ✅ Inserted individual payroll for employee ${payroll.employee} (${payroll.month}/${payroll.year})`);
          } catch (individualError) {
            console.error(`   ❌ Failed to insert payroll for employee ${payroll.employee}:`, individualError.message);
            errorCount++;
          }
        }
      }
    }

    console.log("\n🎉 Insertion Complete:");
    console.log(`✅ Successfully inserted: ${insertedCount}`);
    console.log(`❌ Failed: ${errorCount}`);

    // Final verification
    const finalCount = await Payroll.countDocuments();
    console.log(`📊 Total payrolls in database now: ${finalCount}`);

    // Show samples
    const samples = await Payroll.find({}).limit(3).sort({ createdAt: 1 });
    console.log("\n📝 Sample payrolls:");
    samples.forEach((sample, index) => {
      console.log(`   ${index + 1}. Employee: ${sample.employee}`);
      console.log(`      Payroll ID: ${sample.payrollId}`);
      console.log(`      Period: ${sample.month}/${sample.year}`);
      console.log(`      Net Salary: ₹${sample.netSalary}`);
      console.log(`      Status: ${sample.status}`);
    });

    // Check for any null payrollIds
    const nullPayrollIds = await Payroll.countDocuments({ 
      $or: [
        { payrollId: null },
        { payrollId: { $exists: false } },
        { payrollId: "" }
      ]
    });
    
    console.log(`\n🔍 Payrolls with null/missing payrollId: ${nullPayrollIds}`);

    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Connection error:", err);
    process.exit(1);
  });