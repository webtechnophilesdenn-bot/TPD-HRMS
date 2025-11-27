require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function quickSeed() {
  try {
    console.log("🚀 Starting Quick Seed...\n");

    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hrms?replicaSet=rs0";
    console.log("📡 Connecting to:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    // Define Models
    const userSchema = new mongoose.Schema({
      email: String,
      password: String,
      role: String,
      isActive: Boolean
    }, { timestamps: true });

    const employeeSchema = new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      employeeId: String,
      firstName: String,
      lastName: String,
      dateOfBirth: Date,
      gender: String,
      phone: String,
      personalEmail: String,
      joiningDate: Date,
      department: mongoose.Schema.Types.ObjectId,
      designation: mongoose.Schema.Types.ObjectId,
      employmentType: String,
      workLocation: String,
      ctc: Number,
      status: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
      },
      leaveBalance: {
        casual: Number,
        sick: Number,
        earned: Number,
        maternity: Number,
        paternity: Number
      }
    }, { timestamps: true });

    const departmentSchema = new mongoose.Schema({
      name: String,
      code: String,
      description: String,
      isActive: Boolean
    }, { timestamps: true });

    const designationSchema = new mongoose.Schema({
      title: String,
      level: String,
      department: mongoose.Schema.Types.ObjectId,
      description: String
    }, { timestamps: true });

    const User = mongoose.model('User', userSchema);
    const Employee = mongoose.model('Employee', employeeSchema);
    const Department = mongoose.model('Department', departmentSchema);
    const Designation = mongoose.model('Designation', designationSchema);

    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    console.log("✅ Cleared existing data\n");

    // Create Departments
    console.log("Creating departments...");
    const hrDept = await Department.create({
      name: "Human Resources",
      code: "HR",
      description: "HR Department",
      isActive: true
    });

    const engDept = await Department.create({
      name: "Engineering",
      code: "ENG",
      description: "Engineering Department",
      isActive: true
    });
    console.log("✅ Created Departments\n");

    // Create Designations
    console.log("Creating designations...");
    const hrManagerDesig = await Designation.create({
      title: "HR Manager",
      level: "Manager",
      department: hrDept._id,
      description: "HR Manager"
    });

    const softwareEngineerDesig = await Designation.create({
      title: "Software Engineer",
      level: "Mid",
      department: engDept._id,
      description: "Software Engineer"
    });

    const teamLeadDesig = await Designation.create({
      title: "Team Lead",
      level: "Lead",
      department: engDept._id,
      description: "Team Lead"
    });
    console.log("✅ Created Designations\n");

    // Create Users and Employees
    console.log("Creating users...\n");

    // 1. ADMIN
    console.log("Creating Admin...");
    const adminPassword = await bcrypt.hash("Admin@123", 12);
    const adminUser = await User.create({
      email: "admin@company.com",
      password: adminPassword,
      role: "admin",
      isActive: true
    });

    await Employee.create({
      userId: adminUser._id,
      employeeId: "ADMIN001",
      firstName: "Super",
      lastName: "Admin",
      dateOfBirth: new Date("1985-01-01"),
      gender: "Male",
      phone: "+919876543210",
      personalEmail: "admin@gmail.com",
      joiningDate: new Date("2020-01-01"),
      department: hrDept._id,
      designation: hrManagerDesig._id,
      employmentType: "Full-Time",
      workLocation: "Head Office",
      ctc: 2000000,
      status: "Active",
      address: {
        street: "Admin Street",
        city: "Mumbai",
        state: "Maharashtra",
        zipCode: "400001",
        country: "India"
      },
      leaveBalance: {
        casual: 12,
        sick: 12,
        earned: 15,
        maternity: 0,
        paternity: 0
      }
    });
    console.log("✅ Admin created\n");

    // 2. HR
    console.log("Creating HR...");
    const hrPassword = await bcrypt.hash("Hr@123456", 12);
    const hrUser = await User.create({
      email: "hr@company.com",
      password: hrPassword,
      role: "hr",
      isActive: true
    });

    await Employee.create({
      userId: hrUser._id,
      employeeId: "HR001",
      firstName: "Sarah",
      lastName: "Johnson",
      dateOfBirth: new Date("1990-05-15"),
      gender: "Female",
      phone: "+919876543211",
      personalEmail: "sarah.johnson@gmail.com",
      joiningDate: new Date("2023-01-15"),
      department: hrDept._id,
      designation: hrManagerDesig._id,
      employmentType: "Full-Time",
      workLocation: "Head Office",
      ctc: 1200000,
      status: "Active",
      address: {
        street: "HR Street",
        city: "Mumbai",
        state: "Maharashtra",
        zipCode: "400002",
        country: "India"
      },
      leaveBalance: {
        casual: 12,
        sick: 12,
        earned: 8,
        maternity: 180,
        paternity: 0
      }
    });
    console.log("✅ HR created\n");

    // 3. MANAGER
    console.log("Creating Manager...");
    const managerPassword = await bcrypt.hash("Manager@123", 12);
    const managerUser = await User.create({
      email: "manager@company.com",
      password: managerPassword,
      role: "manager",
      isActive: true
    });

    await Employee.create({
      userId: managerUser._id,
      employeeId: "MGR001",
      firstName: "Michael",
      lastName: "Smith",
      dateOfBirth: new Date("1985-03-10"),
      gender: "Male",
      phone: "+919876543212",
      personalEmail: "michael.smith@gmail.com",
      joiningDate: new Date("2022-06-01"),
      department: engDept._id,
      designation: teamLeadDesig._id,
      employmentType: "Full-Time",
      workLocation: "Tech Park",
      ctc: 1500000,
      status: "Active",
      address: {
        street: "Manager Avenue",
        city: "Bangalore",
        state: "Karnataka",
        zipCode: "560001",
        country: "India"
      },
      leaveBalance: {
        casual: 12,
        sick: 12,
        earned: 10,
        maternity: 0,
        paternity: 15
      }
    });
    console.log("✅ Manager created\n");

    // 4. EMPLOYEE
    console.log("Creating Employee...");
    const empPassword = await bcrypt.hash("Employee@123", 12);
    const empUser = await User.create({
      email: "employee@company.com",
      password: empPassword,
      role: "employee",
      isActive: true
    });

    await Employee.create({
      userId: empUser._id,
      employeeId: "EMP001",
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: new Date("1995-08-20"),
      gender: "Male",
      phone: "+919876543213",
      personalEmail: "john.doe@gmail.com",
      joiningDate: new Date("2024-01-15"),
      department: engDept._id,
      designation: softwareEngineerDesig._id,
      employmentType: "Full-Time",
      workLocation: "Tech Park",
      ctc: 800000,
      status: "Active",
      address: {
        street: "Main Street",
        city: "Bangalore",
        state: "Karnataka",
        zipCode: "560002",
        country: "India"
      },
      leaveBalance: {
        casual: 12,
        sick: 12,
        earned: 5,
        maternity: 0,
        paternity: 15
      }
    });
    console.log("✅ Employee created\n");

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 SEED COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log("\n📋 LOGIN CREDENTIALS:\n");
    
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║                  ADMIN CREDENTIALS                     ║");
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log("║  Email:    admin@company.com                           ║");
    console.log("║  Password: Admin@123                                   ║");
    console.log("║  Role:     Admin                                       ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║                   HR CREDENTIALS                       ║");
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log("║  Email:    hr@company.com                              ║");
    console.log("║  Password: Hr@123456                                   ║");
    console.log("║  Role:     HR                                          ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║                MANAGER CREDENTIALS                     ║");
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log("║  Email:    manager@company.com                         ║");
    console.log("║  Password: Manager@123                                 ║");
    console.log("║  Role:     Manager                                     ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║               EMPLOYEE CREDENTIALS                     ║");
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log("║  Email:    employee@company.com                        ║");
    console.log("║  Password: Employee@123                                ║");
    console.log("║  Role:     Employee                                    ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    console.log("🌐 Login URL: http://localhost:3000\n");
    console.log("=".repeat(60));

    const userCount = await User.countDocuments();
    const empCount = await Employee.countDocuments();
    console.log(`\n📊 Summary: ${userCount} users and ${empCount} employees created\n`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error("\nStack trace:", error.stack);
    process.exit(1);
  }
}

quickSeed();