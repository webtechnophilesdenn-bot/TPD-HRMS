const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  content: { 
    type: String, 
    required: [true, 'Content is required']
  },
  
  category: { 
    type: String, 
    enum: [
      'General', 
      'Holiday', 
      'Event', 
      'Policy Update', 
      'Achievement', 
      'Birthday', 
      'Work Anniversary', 
      'Emergency',
      'Training',
      'Company News',
      'System Update',
      'Celebration'
    ],
    default: 'General'
  },
  
  priority: { 
    type: String, 
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal'
  },
  
  // Targeting Options
  visibility: {
    type: String,
    enum: ['All', 'Departments', 'Designations', 'Locations', 'Employees', 'Teams'],
    default: 'All'
  },
  
  targetDepartments: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department' 
  }],
  
  targetDesignations: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Designation' 
  }],
  
  targetLocations: [String],
  
  targetEmployees: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee' 
  }],
  
  // Media & Attachments
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  
  imageUrl: String,
  videoUrl: String,
  
  // Scheduling
  publishDate: { 
    type: Date, 
    default: Date.now 
  },
  expiryDate: Date,
  
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Scheduled', 'Published', 'Archived', 'Expired'],
    default: 'Published'
  },
  
  isActive: { 
    type: Boolean, 
    default: true 
  },
  
  isPinned: { 
    type: Boolean, 
    default: false 
  },
  
  showOnDashboard: {
    type: Boolean,
    default: true
  },
  
  // Engagement Tracking
  views: [{
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  reactions: [{
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    type: {
      type: String,
      enum: ['like', 'love', 'celebrate', 'insightful', 'support']
    },
    reactedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  comments: [{
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Action Items
  actionRequired: {
    type: Boolean,
    default: false
  },
  
  actionButton: {
    text: String,
    url: String
  },
  
  acknowledgmentRequired: {
    type: Boolean,
    default: false
  },
  
  acknowledgedBy: [{
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Notification Settings
  sendEmail: {
    type: Boolean,
    default: false
  },
  
  sendPushNotification: {
    type: Boolean,
    default: false
  },
  
  // Creator Info
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee',
    required: true 
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  
  // Analytics
  totalViews: {
    type: Number,
    default: 0
  },
  
  totalReactions: {
    type: Number,
    default: 0
  },
  
  totalComments: {
    type: Number,
    default: 0
  },
  
  totalAcknowledgments: {
    type: Number,
    default: 0
  }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
announcementSchema.index({ status: 1, publishDate: -1 });
announcementSchema.index({ visibility: 1, status: 1 });
announcementSchema.index({ createdBy: 1 });
announcementSchema.index({ isPinned: -1, publishDate: -1 });

// Virtual for engagement rate
announcementSchema.virtual('engagementRate').get(function() {
  if (this.totalViews === 0) return 0;
  return ((this.totalReactions + this.totalComments) / this.totalViews * 100).toFixed(2);
});

// Method to check if announcement is visible to employee
announcementSchema.methods.isVisibleTo = function(employee) {
  if (this.visibility === 'All') return true;
  
  if (this.visibility === 'Departments') {
    return this.targetDepartments.some(dept => 
      dept.toString() === employee.department.toString()
    );
  }
  
  if (this.visibility === 'Designations') {
    return this.targetDesignations.some(desig => 
      desig.toString() === employee.designation.toString()
    );
  }
  
  if (this.visibility === 'Locations') {
    return this.targetLocations.includes(employee.location);
  }
  
  if (this.visibility === 'Employees') {
    return this.targetEmployees.some(emp => 
      emp.toString() === employee._id.toString()
    );
  }
  
  return false;
};

// Method to mark as viewed
announcementSchema.methods.markAsViewed = async function(employeeId) {
  const alreadyViewed = this.views.some(v => 
    v.employee.toString() === employeeId.toString()
  );
  
  if (!alreadyViewed) {
    this.views.push({ employee: employeeId });
    this.totalViews += 1;
    await this.save();
  }
};

// Auto-expire announcements
announcementSchema.pre('save', function(next) {
  if (this.expiryDate && new Date() > this.expiryDate && this.status === 'Published') {
    this.status = 'Expired';
    this.isActive = false;
  }
  next();
});

module.exports = mongoose.model('Announcement', announcementSchema);