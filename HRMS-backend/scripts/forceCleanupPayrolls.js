// scripts/forceCleanupPayrolls.js
const mongoose = require("mongoose");
const Payroll = require("../src/models/Payroll");

mongoose
  .connect("mongodb://127.0.0.1:27017/hrms", { family: 4 })
  .then(async () => {
    console.log("📌 Connected to MongoDB");

    // Find ALL payrolls with null or missing payrollId
    const nullPayrolls = await Payroll.find({
      $or: [
        { payrollId: null },
        { payrollId: { $exists: false } },
        { payrollId: "" }
      ]
    });
    
    console.log(`Found ${nullPayrolls.length} payrolls with null/missing payrollId`);

    // Update all of them
    for (const payroll of nullPayrolls) {
      const newPayrollId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      payroll.payrollId = newPayrollId;
      await payroll.save();
      console.log(`✅ Updated payroll ${payroll._id} with payrollId: ${payroll.payrollId}`);
    }

    // Also fix any duplicate employee/month/year combinations
    const allPayrolls = await Payroll.find({});
    const seenCombinations = new Set();
    const duplicates = [];

    for (const payroll of allPayrolls) {
      const key = `${payroll.employee}-${payroll.month}-${payroll.year}`;
      if (seenCombinations.has(key)) {
        duplicates.push(payroll);
      } else {
        seenCombinations.add(key);
      }
    }

    if (duplicates.length > 0) {
      console.log(`\nFound ${duplicates.length} duplicate employee/month/year combinations`);
      // For duplicates, we'll delete them since we'll insert fresh data
      for (const payroll of duplicates) {
        await Payroll.findByIdAndDelete(payroll._id);
        console.log(`🗑️ Deleted duplicate payroll for employee ${payroll.employee} (${payroll.month}/${payroll.year})`);
      }
    }

    console.log("\n🎉 Force cleanup completed.");
    
    // Verify
    const remainingNull = await Payroll.countDocuments({
      $or: [
        { payrollId: null },
        { payrollId: { $exists: false } },
        { payrollId: "" }
      ]
    });
    
    console.log(`📊 Remaining null payrollIds: ${remainingNull}`);
    
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });