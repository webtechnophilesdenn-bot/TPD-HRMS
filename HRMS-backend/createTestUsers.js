// ============================================
// CREATE TEST USERS FOR ALL ROLES WITH DIFFERENT EMAILS
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

async function clearExistingTestData() {
  try {
    // Delete existing test users and employees
    const testEmails = [
      'raj.sharma@company.com',
      'priya.patel@company.com', 
      'arjun.kumar@company.com',
      'neha.gupta@company.com',
      'anita.desai@company.com',
      'vivek.mishra@company.com',
      'admin.user@company.com'
    ];

    // Delete users with test emails
    await User.deleteMany({ email: { $in: testEmails } });
    console.log('✅ Cleared existing test users');

    // Delete employees with test employee IDs
    const testEmployeeIds = ['EMP001', 'EMP002', 'MGR001', 'MGR002', 'HR001', 'HR002', 'ADM001'];
    await Employee.deleteMany({ employeeId: { $in: testEmployeeIds } });
    console.log('✅ Cleared existing test employees');

  } catch (error) {
    console.log('⚠️  No existing test data to clear or error clearing:', error.message);
  }
}

async function createTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing test data first
    await clearExistingTestData();

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

    const financeDept = await Department.findOneAndUpdate(
      { code: "FIN" },
      {
        name: "Finance",
        code: "FIN",
        description: "Finance Department",
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

    const seniorDeveloper = await Designation.findOneAndUpdate(
      { title: "Senior Software Engineer" },
      {
        title: "Senior Software Engineer",
        level: "Senior",
        department: engDept._id,
        description: "Senior Software Development",
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

    const hrExecutive = await Designation.findOneAndUpdate(
      { title: "HR Executive" },
      {
        title: "HR Executive",
        level: "Junior",
        department: hrDept._id,
        description: "HR Operations",
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

    const financeManager = await Designation.findOneAndUpdate(
      { title: "Finance Manager" },
      {
        title: "Finance Manager",
        level: "Senior",
        department: financeDept._id,
        description: "Financial Management",
      },
      { upsert: true, new: true }
    );

    console.log("✅ Created/Found Designations");

    // 3. Define all test users with different emails and passwords
    const testUsers = [
      // EMPLOYEE 1
      {
        userData: {
          email: "raj.sharma@company.com",
          password: "Raj@2024",
          role: "employee",
        },
        employeeData: {
          employeeId: "EMP001",
          firstName: "Raj",
          lastName: "Sharma",
          dateOfBirth: new Date("1995-05-15"),
          gender: "Male",
          phone: "+919876543210",
          personalEmail: "raj.sharma.personal@gmail.com",
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

      // EMPLOYEE 2
      {
        userData: {
          email: "priya.patel@company.com",
          password: "Priya@2024",
          role: "employee",
        },
        employeeData: {
          employeeId: "EMP002",
          firstName: "Priya",
          lastName: "Patel",
          dateOfBirth: new Date("1993-08-22"),
          gender: "Female",
          phone: "+919876543211",
          personalEmail: "priya.patel.personal@gmail.com",
          address: {
            street: "456 Tech Park Road",
            city: "Bangalore",
            state: "Karnataka",
            zipCode: "560001",
            country: "India",
          },
          department: engDept._id,
          designation: seniorDeveloper._id,
          joiningDate: new Date("2023-03-10"),
          employmentType: "Full-Time",
          workLocation: "Bangalore Office",
          ctc: 1200000,
          bankDetails: {
            accountNumber: "2345678901",
            ifscCode: "ICIC0001234",
            bankName: "ICICI Bank",
            branch: "Bangalore Branch",
          },
          leaveBalance: {
            casual: 10,
            sick: 10,
            earned: 8,
            maternity: 0,
            paternity: 5,
          },
          status: "Active",
        },
      },

      // MANAGER 1
      {
        userData: {
          email: "arjun.kumar@company.com",
          password: "Arjun@2024",
          role: "manager",
        },
        employeeData: {
          employeeId: "MGR001",
          firstName: "Arjun",
          lastName: "Kumar",
          dateOfBirth: new Date("1985-08-20"),
          gender: "Male",
          phone: "+919876543212",
          personalEmail: "arjun.kumar.personal@gmail.com",
          address: {
            street: "789 Manager Avenue",
            city: "Delhi",
            state: "Delhi",
            zipCode: "110001",
            country: "India",
          },
          department: engDept._id,
          designation: projectManager._id,
          joiningDate: new Date("2020-06-10"),
          employmentType: "Full-Time",
          workLocation: "Delhi Office",
          ctc: 1500000,
          bankDetails: {
            accountNumber: "3456789012",
            ifscCode: "SBI0001234",
            bankName: "State Bank of India",
            branch: "Delhi Branch",
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

      // MANAGER 2
      {
        userData: {
          email: "neha.gupta@company.com",
          password: "Neha@2024",
          role: "manager",
        },
        employeeData: {
          employeeId: "MGR002",
          firstName: "Neha",
          lastName: "Gupta",
          dateOfBirth: new Date("1988-03-10"),
          gender: "Female",
          phone: "+919876543213",
          personalEmail: "neha.gupta.personal@gmail.com",
          address: {
            street: "321 Corporate Road",
            city: "Hyderabad",
            state: "Telangana",
            zipCode: "500001",
            country: "India",
          },
          department: financeDept._id,
          designation: financeManager._id,
          joiningDate: new Date("2019-08-15"),
          employmentType: "Full-Time",
          workLocation: "Hyderabad Office",
          ctc: 1400000,
          bankDetails: {
            accountNumber: "4567890123",
            ifscCode: "AXIS0001234",
            bankName: "Axis Bank",
            branch: "Hyderabad Branch",
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

      // HR 1
      {
        userData: {
          email: "anita.desai@company.com",
          password: "Anita@2024",
          role: "hr",
        },
        employeeData: {
          employeeId: "HR001",
          firstName: "Anita",
          lastName: "Desai",
          dateOfBirth: new Date("1988-11-30"),
          gender: "Female",
          phone: "+919876543214",
          personalEmail: "anita.desai.personal@gmail.com",
          address: {
            street: "654 HR Street",
            city: "Chennai",
            state: "Tamil Nadu",
            zipCode: "600001",
            country: "India",
          },
          department: hrDept._id,
          designation: hrManager._id,
          joiningDate: new Date("2019-08-15"),
          employmentType: "Full-Time",
          workLocation: "Chennai Office",
          ctc: 1200000,
          bankDetails: {
            accountNumber: "5678901234",
            ifscCode: "HDFC0005678",
            bankName: "HDFC Bank",
            branch: "Chennai Branch",
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

      // HR 2
      {
        userData: {
          email: "vivek.mishra@company.com",
          password: "Vivek@2024",
          role: "hr",
        },
        employeeData: {
          employeeId: "HR002",
          firstName: "Vivek",
          lastName: "Mishra",
          dateOfBirth: new Date("1990-07-15"),
          gender: "Male",
          phone: "+919876543215",
          personalEmail: "vivek.mishra.personal@gmail.com",
          address: {
            street: "987 Talent Avenue",
            city: "Pune",
            state: "Maharashtra",
            zipCode: "411001",
            country: "India",
          },
          department: hrDept._id,
          designation: hrExecutive._id,
          joiningDate: new Date("2022-01-20"),
          employmentType: "Full-Time",
          workLocation: "Pune Office",
          ctc: 700000,
          bankDetails: {
            accountNumber: "6789012345",
            ifscCode: "ICIC0006789",
            bankName: "ICICI Bank",
            branch: "Pune Branch",
          },
          leaveBalance: {
            casual: 12,
            sick: 12,
            earned: 10,
            maternity: 0,
            paternity: 5,
          },
          status: "Active",
        },
      },

      // ADMIN
      {
        userData: {
          email: "admin.user@company.com",
          password: "Admin@2024",
          role: "admin",
        },
        employeeData: {
          employeeId: "ADM001",
          firstName: "Admin",
          lastName: "User",
          dateOfBirth: new Date("1980-12-25"),
          gender: "Male",
          phone: "+919876543216",
          personalEmail: "admin.user.personal@gmail.com",
          address: {
            street: "321 Admin Street",
            city: "Gurgaon",
            state: "Haryana",
            zipCode: "122001",
            country: "India",
          },
          department: adminDept._id,
          designation: systemAdmin._id,
          joiningDate: new Date("2018-03-01"),
          employmentType: "Full-Time",
          workLocation: "Gurgaon Office",
          ctc: 1800000,
          bankDetails: {
            accountNumber: "7890123456",
            ifscCode: "AXIS0007890",
            bankName: "Axis Bank",
            branch: "Gurgaon Branch",
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
    let createdCount = 0;
    let skippedCount = 0;

    for (const { userData, employeeData } of testUsers) {
      try {
        // Check if user already exists (even though we cleared, just in case)
        const existingUser = await User.findOne({ email: userData.email });
        const existingEmployee = await Employee.findOne({ employeeId: employeeData.employeeId });

        if (existingUser || existingEmployee) {
          console.log(`⚠️  User or Employee already exists: ${userData.email} (${employeeData.employeeId})`);
          skippedCount++;
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
          `✅ Created Employee Profile for: ${employeeData.firstName} ${employeeData.lastName} (${employeeData.employeeId})`
        );
        createdCount++;
      } catch (error) {
        console.log(`❌ Error creating ${userData.email}:`, error.message);
        skippedCount++;
      }
    }

    console.log("\n🎉 TEST USERS CREATION COMPLETED!");
    console.log("═══════════════════════════════════════════");
    console.log(`📊 Created: ${createdCount} users`);
    console.log(`📊 Skipped: ${skippedCount} users`);
    console.log("═══════════════════════════════════════════");
    console.log("\n🔐 TEST ACCOUNTS:");
    console.log("═══════════════════════════════════════════");
    console.log("👤 EMPLOYEES:");
    console.log("   raj.sharma@company.com    / Raj@2024");
    console.log("   priya.patel@company.com   / Priya@2024");
    console.log("\n👨‍💼 MANAGERS:");
    console.log("   arjun.kumar@company.com   / Arjun@2024");
    console.log("   neha.gupta@company.com    / Neha@2024");
    console.log("\n👩‍💼 HR:");
    console.log("   anita.desai@company.com   / Anita@2024");
    console.log("   vivek.mishra@company.com  / Vivek@2024");
    console.log("\n👨‍💻 ADMIN:");
    console.log("   admin.user@company.com    / Admin@2024");
    console.log("═══════════════════════════════════════════\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createTestUsers();