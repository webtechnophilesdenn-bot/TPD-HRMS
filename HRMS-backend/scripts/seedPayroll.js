// testConnection.js
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/payroll_system')
  .then(() => console.log('✅ Connected'))
  .catch(err => console.error('❌ Error:', err.message));