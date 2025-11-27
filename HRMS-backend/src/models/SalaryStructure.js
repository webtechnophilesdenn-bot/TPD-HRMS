const mongoose = require('mongoose');

const salaryStructureSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true 
  },
  designation: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Designation' 
  },
  basic: { 
    type: Number, 
    required: true 
  },
  hra: { 
    type: Number, 
    default: 0 
  },
  allowances: {
    transport: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    special: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  deductions: {
    pf: { type: Number, default: 12 }, // Percentage
    professionalTax: { type: Number, default: 200 },
    insurance: { type: Number, default: 0 }
  },
  ctc: { 
    type: Number, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// Calculate CTC before saving
salaryStructureSchema.pre('save', function(next) {
  const totalAllowances = Object.values(this.allowances).reduce((sum, val) => sum + val, 0);
  this.ctc = this.basic + this.hra + totalAllowances;
  next();
});

module.exports = mongoose.model('SalaryStructure', salaryStructureSchema);