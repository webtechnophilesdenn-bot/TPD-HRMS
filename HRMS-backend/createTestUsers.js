require('dotenv').config();
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hrms";

async function createTestUsers() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Clear mongoose models cache
    if (mongoose.models.Employee) delete mongoose.models.Employee;
    if (mongoose.models.User) delete mongoose.models.User;

    // Import models
    const User = require("./src/models/User");
    const Employee = require("./src/models/Employee");
    const Department = require("./src/models/Department");
    const Designation = require("./src/models/Designation");

    console.log("📦 Employee model:", Employee.modelName);
    console.log("📦 User model:", User.modelName);

    // ==================== CREATE DEPARTMENTS ====================
    console.log("\n📁 Creating Departments...");
    const departments = {
      eng: await Department.findOneAndUpdate(
        { code: "ENG" },
        { name: "Engineering", code: "ENG", description: "Engineering Team", isActive: true },
        { upsert: true, new: true }
      ),
      hr: await Department.findOneAndUpdate(
        { code: "HR" },
        { name: "Human Resources", code: "HR", description: "HR Department", isActive: true },
        { upsert: true, new: true }
      ),
      admin: await Department.findOneAndUpdate(
        { code: "ADMIN" },
        { name: "Administration", code: "ADMIN", description: "Admin Department", isActive: true },
        { upsert: true, new: true }
      ),
    };

    // ==================== CREATE DESIGNATIONS ====================
    console.log("\n📋 Creating Designations...");
    const designations = {
      softwareEngineer: await Designation.findOneAndUpdate(
        { title: "Software Engineer" },
        { title: "Software Engineer", level: "Mid", department: departments.eng._id, isActive: true },
        { upsert: true, new: true }
      ),
      projectManager: await Designation.findOneAndUpdate(
        { title: "Project Manager" },
        { title: "Project Manager", level: "Senior", department: departments.eng._id, isActive: true },
        { upsert: true, new: true }
      ),
      hrManager: await Designation.findOneAndUpdate(
        { title: "HR Manager" },
        { title: "HR Manager", level: "Senior", department: departments.hr._id, isActive: true },
        { upsert: true, new: true }
      ),
      systemAdmin: await Designation.findOneAndUpdate(
        { title: "System Administrator" },
        { title: "System Administrator", level: "Senior", department: departments.admin._id, isActive: true },
        { upsert: true, new: true }
      ),
    };

    // ==================== CREATE COMPLETE TEST USERS ====================
    const testUsers = [
      {
        email: "employee@company.com",
        password: "Employee@123",
        role: "employee",
        name: "John Doe",
        employeeData: {
          employeeId: "EMP001",
          firstName: "John",
          lastName: "Doe",
          dateOfBirth: new Date("1995-05-15"),
          gender: "Male",
          phone: "+919876543210",
          alternatePhone: "+919876543211",
          personalEmail: "john.doe@gmail.com",
          address: {
            street: "123 Main Street",
            city: "Mumbai",
            state: "Maharashtra",
            zipCode: "400001",
            country: "India",
          },
          department: departments.eng._id,
          designation: designations.softwareEngineer._id,
          joiningDate: new Date("2024-01-15"),
          employmentType: "Full-Time",
          workLocation: "Mumbai Office",
          workShift: "Day",
          ctc: 800000,
          basicSalary: 400000,
          bankDetails: {
            accountNumber: "12345678901234",
            ifscCode: "HDFC0001234",
            bankName: "HDFC Bank",
            branch: "Mumbai Branch",
            accountHolderName: "John Doe",
            accountType: "Savings",
          },
          statutoryDetails: {
            panNumber: "ABCDE1234F",
            aadharNumber: "123456789012",
            uanNumber: "123456789012",
          },
          leaveBalance: {
            casual: 12,
            sick: 12,
            earned: 5,
            compOff: 2,
          },
          emergencyContact: {
            name: "Jane Doe",
            relationship: "Mother",
            phone: "+919876543200",
          },
          status: "Active",
        },
      },
      {
        email: "manager@company.com",
        password: "Manager@123",
        role: "manager",
        name: "Sarah Wilson",
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
          department: departments.eng._id,
          designation: designations.projectManager._id,
          reportingManager: null,
          joiningDate: new Date("2020-06-10"),
          employmentType: "Full-Time",
          workLocation: "Bangalore Office",
          ctc: 1500000,
          basicSalary: 750000,
          bankDetails: {
            accountNumber: "23456789012345",
            ifscCode: "ICIC0001234",
            bankName: "ICICI Bank",
            branch: "Bangalore Branch",
            accountHolderName: "Sarah Wilson",
          },
          statutoryDetails: {
            panNumber: "FGHIJ5678K",
            aadharNumber: "234567890123",
          },
          leaveBalance: {
            casual: 15,
            sick: 12,
            earned: 20,
          },
          emergencyContact: {
            name: "David Wilson",
            relationship: "Husband",
            phone: "+919876543201",
          },
          status: "Active",
        },
      },
      {
        email: "hr@company.com",
        password: "HR@123",
        role: "hr",
        name: "Emily Davis",
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
          department: departments.hr._id,
          designation: designations.hrManager._id,
          joiningDate: new Date("2019-08-15"),
          employmentType: "Full-Time",
          workLocation: "Delhi Office",
          ctc: 1200000,
          basicSalary: 600000,
          bankDetails: {
            accountNumber: "34567890123456",
            ifscCode: "SBI0001234",
            bankName: "State Bank of India",
            branch: "Delhi Branch",
            accountHolderName: "Emily Davis",
          },
          statutoryDetails: {
            panNumber: "KLMNO9012P",
            aadharNumber: "345678901234",
          },
          leaveBalance: {
            casual: 15,
            sick: 12,
            earned: 18,
          },
          status: "Active",
        },
      },
      {
        email: "admin@company.com",
        password: "Admin@123",
        role: "admin",
        name: "Michael Brown",
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
          department: departments.admin._id,
          designation: designations.systemAdmin._id,
          joiningDate: new Date("2018-03-01"),
          employmentType: "Full-Time",
          workLocation: "Hyderabad Office",
          ctc: 1800000,
          basicSalary: 900000,
          bankDetails: {
            accountNumber: "45678901234567",
            ifscCode: "AXIS0001234",
            bankName: "Axis Bank",
            branch: "Hyderabad Branch",
            accountHolderName: "Michael Brown",
          },
          statutoryDetails: {
            panNumber: "PQRST3456U",
            aadharNumber: "456789012345",
          },
          leaveBalance: {
            casual: 18,
            sick: 12,
            earned: 25,
          },
          status: "Active",
        },
      },
    ];

    console.log("\n👥 Creating Complete Test Users...\n");

    let created = 0;
    let skipped = 0;

    for (const testUser of testUsers) {
      console.log(`🔄 Processing: ${testUser.email} (${testUser.role})`);

      // Check if user exists
      let user = await User.findOne({ email: testUser.email });
      
      if (!user) {
        console.log(`  📝 Creating user...`);
        user = await User.create({
          email: testUser.email,
          password: testUser.password,
          role: testUser.role,
          name: testUser.name,
        });
        console.log(`  ✅ Created user: ${user.email}`);
      } else {
        console.log(`  ⚠️  User exists: ${user.email}`);
      }

      // Check if employee exists
      let emp = await Employee.findOne({ userId: user._id });
      
      if (emp) {
        console.log(`  ✅ Employee exists: ${emp.employeeId}`);
        skipped++;
        continue;
      }

      console.log(`  📝 Creating employee profile...`);
      
      const employeeData = {
        ...testUser.employeeData,
        userId: user._id,
      };

      emp = new Employee(employeeData);
      await emp.save();

      console.log(`  ✅ Created employee: ${emp.employeeId}`);
      created++;
    }

    console.log("\n🎉 SUCCESS! Test Users Created!");
    console.log("═══════════════════════════════════════════");
    console.log("📋 TEST ACCOUNTS - LOGIN CREDENTIALS:");
    console.log("═══════════════════════════════════════════");
    testUsers.forEach(user => {
      console.log(`👤 ${user.role.toUpperCase()}:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Employee ID: ${user.employeeData.employeeId}`);
      console.log("");
    });
    console.log("═══════════════════════════════════════════");

    await mongoose.connection.close();
    console.log("✅ Database connection closed");
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

createTestUsers();
