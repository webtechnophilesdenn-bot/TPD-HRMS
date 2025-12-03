// scripts/cleanupPayrolls.js
const mongoose = require("mongoose");
const Payroll = require("../src/models/Payroll");

mongoose
  .connect("mongodb://127.0.0.1:27017/hrms", { family: 4 })
  .then(async () => {
    console.log("📌 Connected to MongoDB");

    // Find all payrolls with null payrollId
    const nullPayrolls = await Payroll.find({ payrollId: null });
    console.log(`Found ${nullPayrolls.length} payrolls with null payrollId`);

    // Generate new payrollId for each
    for (const payroll of nullPayrolls) {
      payroll.payrollId = "PAY-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
      await payroll.save();
      console.log(`✅ Updated payroll ${payroll._id} with payrollId: ${payroll.payrollId}`);
    }

    // Also check for duplicate payrollId values
    const allPayrolls = await Payroll.find({});
    const payrollIds = new Set();
    const duplicates = [];

    for (const payroll of allPayrolls) {
      if (payroll.payrollId && payrollIds.has(payroll.payrollId)) {
        duplicates.push(payroll);
      } else if (payroll.payrollId) {
        payrollIds.add(payroll.payrollId);
      }
    }

    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicate payrollIds`);
      for (const payroll of duplicates) {
        payroll.payrollId = "PAY-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
        await payroll.save();
        console.log(`✅ Fixed duplicate payrollId for ${payroll._id}: ${payroll.payrollId}`);
      }
    }

    console.log("🎉 Cleanup completed.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error during cleanup:", err);
    process.exit(1);
  });