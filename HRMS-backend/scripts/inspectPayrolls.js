// scripts/inspectPayrolls.js
const mongoose = require("mongoose");
const Payroll = require("../src/models/Payroll");

mongoose
  .connect("mongodb://127.0.0.1:27017/hrms", { family: 4 })
  .then(async () => {
    console.log("📌 Connected to MongoDB");

    // Get all payrolls
    const allPayrolls = await Payroll.find({});
    console.log(`📊 Total payrolls in database: ${allPayrolls.length}`);

    // Group by payrollId status
    const withPayrollId = allPayrolls.filter(p => p.payrollId && p.payrollId !== null);
    const withoutPayrollId = allPayrolls.filter(p => !p.payrollId || p.payrollId === null);
    
    console.log(`✅ Payrolls with valid payrollId: ${withPayrollId.length}`);
    console.log(`❌ Payrolls without payrollId: ${withoutPayrollId.length}`);

    // Show some examples
    console.log("\n📝 Sample payrolls with payrollId:");
    withPayrollId.slice(0, 3).forEach(p => {
      console.log(`  - ${p._id}: ${p.payrollId} | Employee: ${p.employee} | Month: ${p.month}/${p.year}`);
    });

    if (withoutPayrollId.length > 0) {
      console.log("\n🚨 Payrolls without payrollId:");
      withoutPayrollId.forEach(p => {
        console.log(`  - ${p._id} | Employee: ${p.employee} | Month: ${p.month}/${p.year} | Status: ${p.status}`);
      });
    }

    // Check for duplicates
    const payrollIdMap = new Map();
    const duplicates = [];
    
    withPayrollId.forEach(p => {
      if (payrollIdMap.has(p.payrollId)) {
        duplicates.push(p);
      } else {
        payrollIdMap.set(p.payrollId, p);
      }
    });

    if (duplicates.length > 0) {
      console.log(`\n⚠️ Found ${duplicates.length} duplicate payrollIds`);
      duplicates.forEach(p => {
        console.log(`  - Duplicate: ${p.payrollId} for employee ${p.employee}`);
      });
    }

    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });