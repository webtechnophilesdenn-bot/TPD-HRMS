// ============================================
// CREATE TEST USERS FOR ALL ROLES
// Save as: createTestUsers.js
// Run: node createTestUsers.js
// ============================================
require('dotenv').config();

const mongoose = require("mongoose");
const User = require("./src/models/User");
const Employee = require("./src/models/Employee");
const Department = require("./src/models/Department");
const Designation = require("./src/models/Designation");

const MONGODB_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hrms?replicaSet=rs0";

async function createTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Create Departments if not exists
    const engDept = await Department.findOneAndUpdate(
      { code: "ENG" },
      {
        name: "Engineering",
        code: "ENG",
        description: "Engineering Department",
      },
      { upsert: true, new: true }
    );

    const hrDept = await Department.findOneAndUpdate(
      { code: "HR" },
      {
        name: "Human Resources",
        code: "HR",
        description: "Human Resources Department",
      },
      { upsert: true, new: true }
    );

    const adminDept = await Department.findOneAndUpdate(
      { code: "ADMIN" },
      {
        name: "Administration",
        code: "ADMIN",
        description: "Administration Department",
      },
      { upsert: true, new: true }
    );

    console.log("✅ Created/Found Departments");

    // 2. Create Designations if not exists
    const softwareEngineer = await Designation.findOneAndUpdate(
      { title: "Software Engineer" },
      {
        title: "Software Engineer",
        level: "Mid",
        department: engDept._id,
        description: "Software Development",
      },
      { upsert: true, new: true }
    );

    const hrManager = await Designation.findOneAndUpdate(
      { title: "HR Manager" },
      {
        title: "HR Manager",
        level: "Senior",
        department: hrDept._id,
        description: "Human Resources Management",
      },
      { upsert: true, new: true }
    );

    const systemAdmin = await Designation.findOneAndUpdate(
      { title: "System Administrator" },
      {
        title: "System Administrator",
        level: "Senior",
        department: adminDept._id,
        description: "System Administration",
      },
      { upsert: true, new: true }
    );

    const projectManager = await Designation.findOneAndUpdate(
      { title: "Project Manager" },
      {
        title: "Project Manager",
        level: "Senior",
        department: engDept._id,
        description: "Project Management",
      },
      { upsert: true, new: true }
    );

    console.log("✅ Created/Found Designations");

    // 3. Define all test users with their respective roles and data
    const testUsers = [
      // EMPLOYEE
      {
        userData: {
          email: "employee@company.com",
          password: "Employee@123",
          role: "employee",
        },
        employeeData: {
          employeeId: "EMP001",
          firstName: "John",
          lastName: "Doe",
          dateOfBirth: new Date("1995-05-15"),
          gender: "Male",
          phone: "+919876543210",
          personalEmail: "john.doe@gmail.com",
          address: {
            street: "123 Main Street",
            city: "Mumbai",
            state: "Maharashtra",
            zipCode: "400001",
            country: "India",
          },
          department: engDept._id,
          designation: softwareEngineer._id,
          joiningDate: new Date("2024-01-15"),
          employmentType: "Full-Time",
          workLocation: "Mumbai Office",
          ctc: 800000,
          bankDetails: {
            accountNumber: "1234567890",
            ifscCode: "HDFC0001234",
            bankName: "HDFC Bank",
            branch: "Mumbai Branch",
          },
          leaveBalance: {
            casual: 12,
            sick: 12,
            earned: 5,
            maternity: 0,
            paternity: 5,
          },
          status: "Active",
        },
      },

      // MANAGER
      {
        userData: {
          email: "manager@company.com",
          password: "Manager@123",
          role: "manager",
        },
        employeeData: {
          employeeId: "MGR001",
          firstName: "Sarah",
          lastName: "Wilson",
          dateOfBirth: new Date("1985-08-20"),
          gender: "Female",
          phone: "+919876543211",
          personalEmail: "sarah.wilson@gmail.com",
          address: {
            street: "456 Park Avenue",
            city: "Bangalore",
            state: "Karnataka",
            zipCode: "560001",
            country: "India",
          },
          department: engDept._id,
          designation: projectManager._id,
          joiningDate: new Date("2020-06-10"),
          employmentType: "Full-Time",
          workLocation: "Bangalore Office",
          ctc: 1500000,
          bankDetails: {
            accountNumber: "2345678901",
            ifscCode: "ICIC0001234",
            bankName: "ICICI Bank",
            branch: "Bangalore Branch",
          },
          leaveBalance: {
            casual: 12,
            sick: 12,
            earned: 15,
            maternity: 0,
            paternity: 5,
          },
          status: "Active",
        },
      },

      // HR
      {
        userData: {
          email: "hr@company.com",
          password: "HR@123",
          role: "hr",
        },
        employeeData: {
          employeeId: "HR001",
          firstName: "Emily",
          lastName: "Davis",
          dateOfBirth: new Date("1988-03-10"),
          gender: "Female",
          phone: "+919876543212",
          personalEmail: "emily.davis@gmail.com",
          address: {
            street: "789 Corporate Road",
            city: "Delhi",
            state: "Delhi",
            zipCode: "110001",
            country: "India",
          },
          department: hrDept._id,
          designation: hrManager._id,
          joiningDate: new Date("2019-08-15"),
          employmentType: "Full-Time",
          workLocation: "Delhi Office",
          ctc: 1200000,
          bankDetails: {
            accountNumber: "3456789012",
            ifscCode: "SBI0001234",
            bankName: "State Bank of India",
            branch: "Delhi Branch",
          },
          leaveBalance: {
            casual: 12,
            sick: 12,
            earned: 18,
            maternity: 0,
            paternity: 5,
          },
          status: "Active",
        },
      },

      // ADMIN
      {
        userData: {
          email: "admin@company.com",
          password: "Admin@123",
          role: "admin",
        },
        employeeData: {
          employeeId: "ADM001",
          firstName: "Michael",
          lastName: "Brown",
          dateOfBirth: new Date("1980-12-25"),
          gender: "Male",
          phone: "+919876543213",
          personalEmail: "michael.brown@gmail.com",
          address: {
            street: "321 Admin Street",
            city: "Hyderabad",
            state: "Telangana",
            zipCode: "500001",
            country: "India",
          },
          department: adminDept._id,
          designation: systemAdmin._id,
          joiningDate: new Date("2018-03-01"),
          employmentType: "Full-Time",
          workLocation: "Hyderabad Office",
          ctc: 1800000,
          bankDetails: {
            accountNumber: "4567890123",
            ifscCode: "AXIS0001234",
            bankName: "Axis Bank",
            branch: "Hyderabad Branch",
          },
          leaveBalance: {
            casual: 12,
            sick: 12,
            earned: 20,
            maternity: 0,
            paternity: 5,
          },
          status: "Active",
        },
      },
    ];

    // 4. Create users and their employee profiles
    for (const { userData, employeeData } of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`⚠️  User already exists: ${userData.email}`);
        continue;
      }

      // Create user
      const user = await User.create(userData);
      console.log(`✅ Created User: ${userData.email} (${userData.role})`);

      // Create employee profile
      await Employee.create({
        ...employeeData,
        userId: user._id,
      });
      console.log(
        `✅ Created Employee Profile for: ${employeeData.firstName} ${employeeData.lastName}`
      );
    }

    console.log("\n🎉 ALL TEST USERS CREATED SUCCESSFULLY!\n");
    console.log("═══════════════════════════════════════════");
    console.log("TEST ACCOUNTS:");
    console.log("═══════════════════════════════════════════");
    console.log("👤 Employee: employee@company.com / Employee@123");
    console.log("👨‍💼 Manager:  manager@company.com  / Manager@123");
    console.log("👩‍💼 HR:       hr@company.com       / HR@123");
    console.log("👨‍💻 Admin:    admin@company.com    / Admin@123");
    console.log("═══════════════════════════════════════════\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createTestUsers();
