const mongoose = require('mongoose');

const recognitionSchema = new mongoose.Schema({
  // Basic Information
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true 
  },
  
  // Recipient Information
  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee',
    required: true 
  },
  department: {
    type: String,
    required: true
  },
  
  // Recognition Details
  type: { 
    type: String, 
    enum: [
      'Employee of the Month',
      'Employee of the Quarter', 
      'Employee of the Year',
      'Star Performer',
      'Team Player',
      'Innovation Award',
      'Customer Champion',
      'Leadership Excellence',
      'Service Excellence',
      'Spot Award',
      'Rising Star',
      'Mentor of the Month',
      'Safety Champion',
      'Quality Excellence',
      'Sales Achiever'
    ],
    required: true 
  },
  category: {
    type: String,
    enum: ['Performance', 'Behavior', 'Achievement', 'Service', 'Innovation', 'Leadership'],
    required: true
  },
  
  // Rewards & Points
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  badge: {
    name: String,
    icon: String,
    color: String
  },
  rewards: {
    monetary: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' }
    },
    gifts: [{
      name: String,
      description: String,
      value: Number
    }],
    certificates: [{
      type: { type: String },
      url: String
    }]
  },
  
  // Award Details
  awardedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee',
    required: true 
  },
  awardedDate: { 
    type: Date, 
    default: Date.now 
  },
  effectivePeriod: {
    start: Date,
    end: Date,
    month: Number,
    quarter: Number,
    year: { type: Number, required: true }
  },
  
  // Approval Workflow
  status: {
    type: String,
    enum: ['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Published'],
    default: 'Draft'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  approvedAt: Date,
  rejectionReason: String,
  
  // Visibility & Sharing
  visibility: {
    type: String,
    enum: ['Public', 'Department Only', 'Private'],
    default: 'Public'
  },
  isFeatured: { type: Boolean, default: false },
  allowComments: { type: Boolean, default: true },
  allowReactions: { type: Boolean, default: true },
  
  // Social Features
  reactions: [{
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    type: { type: String, enum: ['like', 'love', 'applause', 'celebrate'] },
    createdAt: { type: Date, default: Date.now }
  }],
  comments: [{
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    content: String,
    createdAt: { type: Date, default: Date.now },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }]
  }],
  
  // Analytics
  views: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  
  // Metadata
  tags: [String],
  criteria: [String],
  impact: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Exceptional']
  }
}, { 
  timestamps: true 
});

// Indexes for better performance
recognitionSchema.index({ employee: 1, awardedDate: -1 });
recognitionSchema.index({ department: 1, status: 1 });
recognitionSchema.index({ type: 1, 'effectivePeriod.year': -1 });
recognitionSchema.index({ status: 1, awardedDate: -1 });

module.exports = mongoose.model('Recognition', recognitionSchema);