const express = require('express');
const app = express();

// ✅ Add payroll routes
const payrollRoutes = require('./routes/payroll.routes');
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/payrolls', payrollRoutes); // alias

// ✅ Add auth routes (if not already there)
const authRoutes = require('./routes/auth.routes');
app.use('/api/v1/auth', authRoutes);

// ✅ Your existing routes
const onboardingRoutes = require('./routes/onboarding.routes');
const offboardingRoutes = require('./routes/offboarding.routes');

app.use('/api/v1/onboardings', onboardingRoutes);
app.use('/api/v1/onboarding', onboardingRoutes); // alias
app.use('/api/v1/offboardings', offboardingRoutes);
app.use('/api/v1/offboarding', offboardingRoutes); // alias

module.exports = app;
