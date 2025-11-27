const express = require('express');
const app = express();
const onboardingRoutes = require('./routes/onboarding.routes');
const offboardingRoutes = require('./routes/offboarding.routes');

// existing mounts might be plural — add singular aliases to avoid 404s
app.use('/api/v1/onboardings', onboardingRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);   // alias for frontend
app.use('/api/v1/offboardings', offboardingRoutes);
app.use('/api/v1/offboarding', offboardingRoutes); // alias for frontend