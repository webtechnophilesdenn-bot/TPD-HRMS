const mongoose = require('mongoose');

const onboardingSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  joiningDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  buddy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  
  // Pre-boarding
  preboarding: {
    welcomeEmailSent: { type: Boolean, default: false },
    offerLetterSigned: { type: Boolean, default: false },
    documentsSubmitted: { type: Boolean, default: false },
    backgroundCheckCompleted: { type: Boolean, default: false }
  },

  // Documents
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['Aadhar', 'PAN', 'Passport', 'Degree', 'Experience Letter', 'Address Proof', 'Photo', 'Other']
    },
    url: String,
    verified: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now }
  }],

  // IT Setup
  itSetup: {
    emailCreated: { type: Boolean, default: false },
    systemAccessGranted: { type: Boolean, default: false },
    laptopAssigned: { type: Boolean, default: false },
    softwareInstalled: { type: Boolean, default: false },
    vpnConfigured: { type: Boolean, default: false }
  },

  // HR Setup
  hrSetup: {
    employeeIdGenerated: { type: Boolean, default: false },
    payrollSetup: { type: Boolean, default: false },
    attendanceSystemSetup: { type: Boolean, default: false },
    leaveBalanceInitialized: { type: Boolean, default: false },
    insuranceEnrolled: { type: Boolean, default: false }
  },

  // Training & Orientation
  training: {
    orientationCompleted: { type: Boolean, default: false },
    complianceTrainingCompleted: { type: Boolean, default: false },
    departmentTrainingCompleted: { type: Boolean, default: false },
    toolsTrainingCompleted: { type: Boolean, default: false }
  },

  // Tasks & Checklist
  tasks: [{
    title: String,
    description: String,
    assignedTo: {
      type: String,
      enum: ['HR', 'IT', 'Manager', 'Employee', 'Admin']
    },
    dueDate: Date,
    completed: { type: Boolean, default: false },
    completedAt: Date,
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    }
  }],

  // Feedback
  feedback: {
    week1: { rating: Number, comments: String, submittedAt: Date },
    week4: { rating: Number, comments: String, submittedAt: Date },
    week12: { rating: Number, comments: String, submittedAt: Date }
  },

  completedAt: Date,
  notes: String
}, {
  timestamps: true
});

// Calculate overall progress
onboardingSchema.virtual('progress').get(function() {
  let totalTasks = 0;
  let completedTasks = 0;

  // Count preboarding
  Object.values(this.preboarding).forEach(val => {
    totalTasks++;
    if (val) completedTasks++;
  });

  // Count IT setup
  Object.values(this.itSetup).forEach(val => {
    totalTasks++;
    if (val) completedTasks++;
  });

  // Count HR setup
  Object.values(this.hrSetup).forEach(val => {
    totalTasks++;
    if (val) completedTasks++;
  });

  // Count training
  Object.values(this.training).forEach(val => {
    totalTasks++;
    if (val) completedTasks++;
  });

  // Count custom tasks
  this.tasks.forEach(task => {
    totalTasks++;
    if (task.completed) completedTasks++;
  });

  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
});

// In your onboarding model
onboardingSchema.set('toObject', { virtuals: true });
onboardingSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Onboarding', onboardingSchema);
