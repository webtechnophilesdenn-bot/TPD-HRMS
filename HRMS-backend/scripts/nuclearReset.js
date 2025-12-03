// scripts/nuclearReset.js
const mongoose = require("mongoose");
const Payroll = require("../src/models/Payroll");

mongoose
  .connect("mongodb://127.0.0.1:27017/hrms", { family: 4 })
  .then(async () => {
    console.log("📌 Connected to MongoDB");

    // Delete all payrolls
    const result = await Payroll.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} payroll records`);

    // Drop the collection to reset indexes
    try {
      await Payroll.collection.drop();
      console.log("📦 Payroll collection dropped");
    } catch (err) {
      if (err.code === 26) {
        console.log("📦 Collection doesn't exist, creating fresh...");
      } else {
        console.error("⚠️ Error dropping collection:", err.message);
      }
    }

    // Wait a moment for MongoDB to process
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Recreate the model to ensure indexes
    await Payroll.init();
    console.log("🔧 Payroll model reinitialized");

    // Verify
    const count = await Payroll.countDocuments();
    console.log(`📊 Payrolls after reset: ${count}`);

    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });