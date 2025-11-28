require('dotenv').config();
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hrms";

async function createEmployee() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Import models AFTER connection
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

    // Find or create user
    let user = await User.findOne({ email: "employee@company.com" });
    if (!user) {
      user = await User.create({
        email: "employee@company.com",
        password: "Employee@123",
        role: "employee",
        name: "John Doe",
      });
      console.log("✅ Created user:", user.email);
    }

    // Check if employee exists
    let emp = await Employee.findOne({ userId: user._id });
    if (emp) {
      console.log("⚠️  Employee already exists:", emp.employeeId);
      process.exit(0);
    }

    // Create employee
    emp = new Employee({
      userId: user._id,
      employeeId: "EMP001",
      firstName: "John",
      lastName: "Doe",
      gender: "Male",
      phone: "+919876543210",
      department: dept._id,
      designation: desig._id,
      joiningDate: new Date("2024-01-01"),
      employmentType: "Full-Time",
      status: "Active",
    });

    await emp.save();
    console.log("✅ Created employee:", emp.employeeId);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createEmployee();
