const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  action: { 
    type: String, 
    required: true 
  },
  entity: { 
    type: String, 
    required: true 
  }, // Employee, Leave, Payroll, etc.
  entityId: mongoose.Schema.Types.ObjectId,
  
  changes: mongoose.Schema.Types.Mixed,
  
  ipAddress: String,
  userAgent: String,
  
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Index for faster queries
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);