const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Designation title is required'],
    trim: true
  },
  level: { 
    type: String, 
    enum: ['Intern', 'Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'VP', 'C-Level'],
    required: true
  },
  department: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department'
  },
  description: String,
  grade: String,
  responsibilities: [String],
  requiredSkills: [String],
  minExperience: Number,
  maxExperience: Number,
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Designation', designationSchema);
