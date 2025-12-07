const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// models/User.js - Update with proper roles
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'hr', 'manager', 'finance', 'employee'],
    default: 'employee'
  },
  permissions: {
    payroll: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      approve: { type: Boolean, default: false },
      process: { type: Boolean, default: false }
    },
    departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }]
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }
});


// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);