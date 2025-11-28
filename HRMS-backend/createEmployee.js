require('dotenv').config();
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hrms";

async function createEmployee() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Clear mongoose models cache to avoid conflicts
    if (mongoose.models.Employee) {
      delete mongoose.models.Employee;
      delete mongoose.modelSchemas.Employee;
    }

    // Import models
    const User = require("./src/models/User");
    const Employee = require("./src/models/Employee");
    const Department = require("./src/models/Department");
    const Designation = require("./src/models/Designation");

    // Verify we have the right model
    console.log("📦 Employee model name:", Employee.modelName);
    console.log("📦 Employee collection:", Employee.collection.name);

    console.log("\n📁 Creating Department...");
    const dept = await Department.findOneAndUpdate(
      { code: "ENG" },
      { name: "Engineering", code: "ENG", isActive: true },
      { upsert: true, new: true }
    );
    console.log("✅ Department:", dept.name);

    console.log("\n📋 Creating Designation...");
    const desig = await Designation.findOneAndUpdate(
      { title: "Software Engineer" },
      { title: "Software Engineer", department: dept._id, isActive: true },
      { upsert: true, new: true }
    );
    console.log("✅ Designation:", desig.title);

    console.log("\n👤 Finding user...");
    let user = await User.findOne({ email: "employee@company.com" });
    
    if (!user) {
      console.log("❌ User not found");
      process.exit(1);
    }
    console.log("✅ Found user:", user.email);

    console.log("\n👨‍💼 Checking employee profile...");
    let emp = await Employee.findOne({ userId: user._id });
    
    if (emp) {
      console.log("✅ Employee already exists:", emp.employeeId);
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log("📝 Creating employee with basic data...");
    
    // Create with minimal required fields first
    const employeeData = {
      userId: user._id,
      employeeId: "EMP004",
      firstName: "Johnkk",
      lastName: "Doe",
      gender: "Male",
      phone: "+919876543240",
      department: dept._id,
      designation: desig._id,
      joiningDate: new Date(),
      employmentType: "Full-Time",
      status: "Active"
    };

    console.log("📄 Employee data:", JSON.stringify(employeeData, null, 2));

    // Use new + save instead of create for better error tracking
    emp = new Employee(employeeData);
    
    console.log("💾 Saving employee...");
    await emp.save();

    console.log("✅ Created employee:", emp.employeeId);
    
    await mongoose.connection.close();
    console.log("\n✅ Success!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    
    if (error.name === 'ValidationError') {
      console.error("\n🔍 Validation Errors:");
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
    
    console.error("\n📚 Full error:", error);
    
    await mongoose.connection.close();
    process.exit(1);
  }
}

createEmployee();
