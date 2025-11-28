require('dotenv').config();
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hrms";

async function createEmployeesForAllUsers() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const User = require("./src/models/User");
    const Employee = require("./src/models/Employee");
    const Department = require("./src/models/Department");
    const Designation = require("./src/models/Designation");

    // Create department
    const dept = await Department.findOneAndUpdate(
      { code: "ENG" },
      { name: "Engineering", code: "ENG", isActive: true },
      { upsert: true, new: true }
    );

    // Create designation
    const desig = await Designation.findOneAndUpdate(
      { title: "Software Engineer" },
      { title: "Software Engineer", department: dept._id, isActive: true },
      { upsert: true, new: true }
    );

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users\n`);

    let created = 0;
    let skipped = 0;

    for (const user of users) {
      const existingEmp = await Employee.findOne({ userId: user._id });
      
      if (existingEmp) {
        console.log(`⚠️  ${user.email} - Already has employee profile (${existingEmp.employeeId})`);
        skipped++;
        continue;
      }

      const emp = await Employee.create({
        userId: user._id,
        employeeId: `EMP${String(created + 1).padStart(3, '0')}`,
        firstName: user.name?.split(' ')[0] || "Employee",
        lastName: user.name?.split(' ')[1] || "User",
        gender: "Male",
        phone: "+919876543210",
        personalEmail: user.email,
        department: dept._id,
        designation: desig._id,
        joiningDate: new Date(),
        employmentType: "Full-Time",
        status: "Active",
        leaveBalance: {
          casual: 12,
          sick: 12,
          earned: 5,
        },
      });

      console.log(`✅ ${user.email} - Created employee profile (${emp.employeeId})`);
      created++;
    }

    console.log("\n═══════════════════════════════════════════");
    console.log("📊 Summary:");
    console.log("═══════════════════════════════════════════");
    console.log(`Total Users: ${users.length}`);
    console.log(`Created: ${created}`);
    console.log(`Skipped: ${skipped}`);
    console.log("═══════════════════════════════════════════\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createEmployeesForAllUsers();
