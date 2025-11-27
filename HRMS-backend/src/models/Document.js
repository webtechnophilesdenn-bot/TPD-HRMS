const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: [
      'Policy',
      'Handbook',
      'Form',
      'Certificate',
      'Contract',
      'Agreement',
      'Memo',
      'Report',
      'Other'
    ],
    required: true 
  },
  description: String,
  
  fileUrl: { 
    type: String, 
    required: true 
  },
  fileName: String,
  fileSize: Number,
  mimeType: String,
  
  category: String,
  tags: [String],
  
  department: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department' 
  },
  
  accessLevel: { 
    type: String, 
    enum: ['Public', 'Employees Only', 'Managers Only', 'HR Only', 'Restricted'],
    default: 'Employees Only'
  },
  
  version: { 
    type: Number, 
    default: 1 
  },
  
  effectiveDate: Date,
  expiryDate: Date,
  
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee',
    required: true 
  },
  
  isActive: { 
    type: Boolean, 
    default: true 
  },
  
  viewCount: { 
    type: Number, 
    default: 0 
  },
  downloadCount: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);