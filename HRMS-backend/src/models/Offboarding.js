const mongoose = require('mongoose');

const offboardingSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  resignationDate: {
    type: Date,
    required: true
  },
  lastWorkingDate: {
    type: Date,
    required: true
  },
  noticePeriod: {
    type: Number, // in days
    required: true
  },
  reasonForLeaving: {
    type: String,
    enum: [
      'Better Opportunity',
      'Career Growth',
      'Higher Studies',
      'Personal Reasons',
      'Health Issues',
      'Relocation',
      'Company Culture',
      'Work-Life Balance',
      'Salary',
      'Retirement',
      'Other'
    ]
  },
  exitType: {
    type: String,
    enum: ['Resignation', 'Termination', 'Retirement', 'End of Contract'],
    required: true
  },
  status: {
    type: String,
    enum: ['Initiated', 'In Progress', 'Completed'],
    default: 'Initiated'
  },

  // Resignation Details
  resignationLetter: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  approvalDate: Date,

  // Knowledge Transfer
  knowledgeTransfer: {
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    documentationCompleted: { type: Boolean, default: false },
    trainingCompleted: { type: Boolean, default: false },
    handoverNotes: String,
    completedAt: Date
  },

  // Asset Return
  assets: [{
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset'
    },
    assetName: String,
    returned: { type: Boolean, default: false },
    returnedAt: Date,
    condition: {
      type: String,
      enum: ['Good', 'Fair', 'Damaged', 'Lost']
    },
    notes: String
  }],

  // Access Revocation
  accessRevocation: {
    emailDisabled: { type: Boolean, default: false },
    systemAccessRevoked: { type: Boolean, default: false },
    idCardCollected: { type: Boolean, default: false },
    keysCollected: { type: Boolean, default: false },
    vpnDisabled: { type: Boolean, default: false },
    completedAt: Date
  },

  // Department Clearances
  clearances: [{
    department: {
      type: String,
      enum: ['HR', 'IT', 'Finance', 'Admin', 'Manager']
    },
    clearedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    cleared: { type: Boolean, default: false },
    clearedAt: Date,
    remarks: String
  }],

  // Final Settlement
  finalSettlement: {
    lastSalaryProcessed: { type: Boolean, default: false },
    leaveEncashment: Number,
    bonusPayment: Number,
    otherDeductions: Number,
    totalAmount: Number,
    paymentDate: Date,
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Processed', 'Completed'],
      default: 'Pending'
    }
  },

  // Exit Interview
  exitInterview: {
    scheduledDate: Date,
    conductedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    completed: { type: Boolean, default: false },
    completedAt: Date,
    
    // Questions
    overallExperience: { type: Number, min: 1, max: 5 },
    workEnvironment: { type: Number, min: 1, max: 5 },
    managementSupport: { type: Number, min: 1, max: 5 },
    careerGrowth: { type: Number, min: 1, max: 5 },
    workLifeBalance: { type: Number, min: 1, max: 5 },
    
    wouldRecommend: Boolean,
    wouldRejoin: Boolean,
    feedback: String,
    suggestions: String
  },

  // Documents
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['Experience Letter', 'Relieving Letter', 'Service Certificate', 'No Dues Certificate', 'Other']
    },
    url: String,
    issuedAt: Date
  }],

  completedAt: Date,
  notes: String
}, {
  timestamps: true
});

// Calculate overall progress
offboardingSchema.virtual('progress').get(function() {
  let totalSteps = 0;
  let completedSteps = 0;

  // Knowledge Transfer
  totalSteps += 2;
  if (this.knowledgeTransfer.documentationCompleted) completedSteps++;
  if (this.knowledgeTransfer.trainingCompleted) completedSteps++;

  // Assets
  this.assets.forEach(asset => {
    totalSteps++;
    if (asset.returned) completedSteps++;
  });

  // Access Revocation
  Object.values(this.accessRevocation).forEach((val, index) => {
    if (index < 5) { // Exclude completedAt
      totalSteps++;
      if (val) completedSteps++;
    }
  });

  // Clearances
  this.clearances.forEach(clearance => {
    totalSteps++;
    if (clearance.cleared) completedSteps++;
  });

  // Exit Interview
  totalSteps++;
  if (this.exitInterview.completed) completedSteps++;

  return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
});

offboardingSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Offboarding', offboardingSchema);
