const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Removed unique: true - will be defined in schema.index() below
    },
    employeeId: {
      type: String,
      required: true,
      // Removed unique: true - will be defined in schema.index() below
    },
    
    // ==================== PERSONAL INFORMATION ====================
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: Date,
    gender: { 
      type: String, 
      enum: ["Male", "Female", "Other"] 
    },
    phone: String,
    alternatePhone: String,
    personalEmail: String,
    
    // ==================== ADDRESS ====================
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: "India" },
    },
    
    // ==================== EMPLOYMENT DETAILS ====================
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    designation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
    },
    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    confirmationDate: Date,
    probationPeriod: {
      type: Number,
      default: 3, // months
    },
    employmentType: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Contract", "Intern", "Consultant"],
      default: "Full-Time",
    },
    workLocation: String,
    workShift: {
      type: String,
      enum: ["Day", "Night", "Rotational", "Flexible"],
      default: "Day",
    },
    
    // ==================== SALARY INFORMATION ====================
    ctc: Number,
    basicSalary: Number,
    currentSalaryStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryStructure",
    },
    
    // ==================== BANK DETAILS ====================
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branch: String,
      accountHolderName: String,
      accountType: { 
        type: String, 
        enum: ["Savings", "Current"], 
        default: "Savings" 
      },
    },
    
    // ==================== STATUTORY DETAILS ====================
    statutoryDetails: {
      panNumber: String,
      aadharNumber: String,
      uanNumber: String,
      epfNumber: String,
      esiNumber: String,
      passportNumber: String,
      drivingLicense: String,
    },
    
    // ==================== LEAVE BALANCE ====================
    leaveBalance: {
      casual: { type: Number, default: 12 },
      sick: { type: Number, default: 12 },
      earned: { type: Number, default: 0 },
      maternity: { type: Number, default: 0 },
      paternity: { type: Number, default: 0 },
      compOff: { type: Number, default: 0 },
      lossOfPay: { type: Number, default: 0 },
    },
    
    // ==================== EMERGENCY CONTACT ====================
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      alternatePhone: String,
      address: String,
    },
    
    // ==================== DOCUMENTS ====================
    documents: [
      {
        type: {
          type: String,
          enum: [
            "Aadhar",
            "PAN",
            "Passport",
            "Driving License",
            "Educational Certificate",
            "Experience Letter",
            "Offer Letter",
            "Appointment Letter",
            "Salary Slip",
            "Bank Statement",
            "Other",
          ],
        },
        fileName: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now },
        verifiedAt: Date,
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        isVerified: { type: Boolean, default: false },
      },
    ],
    
    // ==================== EDUCATION ====================
    education: [
      {
        degree: String,
        institution: String,
        specialization: String,
        yearOfPassing: Number,
        percentage: Number,
        grade: String,
      },
    ],
    
    // ==================== WORK EXPERIENCE ====================
    workExperience: [
      {
        company: String,
        designation: String,
        from: Date,
        to: Date,
        isCurrent: { type: Boolean, default: false },
        responsibilities: String,
        reasonForLeaving: String,
      },
    ],
    
    // ==================== SKILLS ====================
    skills: [
      {
        name: String,
        level: {
          type: String,
          enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
        },
        yearsOfExperience: Number,
      },
    ],
    
    // ==================== STATUS ====================
    status: {
      type: String,
      enum: [
        "Active",
        "On Leave",
        "On Probation",
        "On Notice",
        "Resigned",
        "Terminated",
        "Retired",
        "Absconding",
        "Inactive",
      ],
      default: "Active",
    },
    exitDate: Date,
    exitReason: String,
    noticePeriod: {
      type: Number,
      default: 30, // days
    },
    
    // ==================== PROFILE ====================
    profilePicture: String,
    bio: String,
    
    // ==================== PERFORMANCE ====================
    performance: {
      lastReviewDate: Date,
      nextReviewDate: Date,
      currentRating: {
        type: Number,
        min: 1,
        max: 5,
      },
    },
    
    // ==================== METADATA ====================
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    notes: String,
    isActive: { type: Boolean, default: true },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== INDEXES ====================
// Define indexes only once here (not in field definitions)
employeeSchema.index({ employeeId: 1 }, { unique: true });
employeeSchema.index({ userId: 1 }, { unique: true });
employeeSchema.index({ department: 1, status: 1 });
employeeSchema.index({ designation: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ joiningDate: -1 });
employeeSchema.index({ "statutoryDetails.panNumber": 1 });
employeeSchema.index({ "statutoryDetails.aadharNumber": 1 });

// ==================== VIRTUALS ====================
employeeSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

employeeSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

employeeSchema.virtual("totalExperience").get(function () {
  if (!this.joiningDate) return 0;
  const today = new Date();
  const joining = new Date(this.joiningDate);
  const years = today.getFullYear() - joining.getFullYear();
  const months = today.getMonth() - joining.getMonth();
  return years + months / 12;
});

employeeSchema.virtual("isProbation").get(function () {
  if (!this.joiningDate || !this.probationPeriod) return false;
  const today = new Date();
  const joining = new Date(this.joiningDate);
  const probationEndDate = new Date(joining);
  probationEndDate.setMonth(probationEndDate.getMonth() + this.probationPeriod);
  return today < probationEndDate;
});

// ==================== METHODS ====================
employeeSchema.methods.updateLeaveBalance = function (leaveType, days, operation = "deduct") {
  if (this.leaveBalance[leaveType] !== undefined) {
    if (operation === "deduct") {
      this.leaveBalance[leaveType] = Math.max(0, this.leaveBalance[leaveType] - days);
    } else if (operation === "add") {
      this.leaveBalance[leaveType] += days;
    }
  }
  return this.leaveBalance[leaveType];
};

employeeSchema.methods.getAvailableLeaves = function () {
  return {
    casual: this.leaveBalance.casual,
    sick: this.leaveBalance.sick,
    earned: this.leaveBalance.earned,
    maternity: this.leaveBalance.maternity,
    paternity: this.leaveBalance.paternity,
    compOff: this.leaveBalance.compOff,
    total:
      this.leaveBalance.casual +
      this.leaveBalance.sick +
      this.leaveBalance.earned +
      this.leaveBalance.maternity +
      this.leaveBalance.paternity +
      this.leaveBalance.compOff,
  };
};

employeeSchema.methods.isEligibleForLeave = function (leaveType, days) {
  if (!this.leaveBalance[leaveType]) return false;
  return this.leaveBalance[leaveType] >= days;
};

employeeSchema.methods.getTenure = function () {
  if (!this.joiningDate) return { years: 0, months: 0, days: 0 };
  
  const today = new Date();
  const joining = new Date(this.joiningDate);
  
  let years = today.getFullYear() - joining.getFullYear();
  let months = today.getMonth() - joining.getMonth();
  let days = today.getDate() - joining.getDate();
  
  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years, months, days };
};

employeeSchema.methods.addDocument = function (documentData) {
  this.documents.push(documentData);
  return this.documents[this.documents.length - 1];
};

employeeSchema.methods.verifyDocument = function (documentId, verifiedBy) {
  const doc = this.documents.id(documentId);
  if (doc) {
    doc.isVerified = true;
    doc.verifiedAt = new Date();
    doc.verifiedBy = verifiedBy;
  }
  return doc;
};

// ==================== STATIC METHODS ====================
employeeSchema.statics.findByEmployeeId = function (employeeId) {
  return this.findOne({ employeeId });
};

employeeSchema.statics.findByDepartment = function (departmentId) {
  return this.find({ department: departmentId, status: "Active" });
};

employeeSchema.statics.findActiveEmployees = function () {
  return this.find({ status: "Active" });
};

employeeSchema.statics.getEmployeeCount = async function () {
  return await this.countDocuments({ status: "Active" });
};

// ==================== PRE-SAVE MIDDLEWARE ====================
employeeSchema.pre("save", function (next) {
  // Auto-generate employee ID if not provided
  if (!this.employeeId && this.isNew) {
    const randomId = Math.floor(100000 + Math.random() * 900000);
    this.employeeId = `EMP${randomId}`;
  }
  
  // Update confirmation date based on probation period
  if (this.joiningDate && this.probationPeriod && !this.confirmationDate) {
    const confirmDate = new Date(this.joiningDate);
    confirmDate.setMonth(confirmDate.getMonth() + this.probationPeriod);
    this.confirmationDate = confirmDate;
  }
  
  next();
});

// ==================== POST-SAVE MIDDLEWARE ====================
employeeSchema.post("save", function (doc, next) {
  console.log(`Employee ${doc.employeeId} saved successfully`);
  next();
});

// ==================== EXPORT WITH SAFE MODEL CHECK ====================
const Employee = mongoose.models.Employee || mongoose.model("Employee", employeeSchema);
module.exports = Employee;
