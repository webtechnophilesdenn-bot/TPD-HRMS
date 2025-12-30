const express = require('express');
const app = express();

// ==================== AUTHENTICATION ====================
const authRoutes = require('./routes/auth.routes');
app.use('/api/v1/auth', authRoutes);

// ==================== EMPLOYEE MANAGEMENT ====================
const employeeRoutes = require('./routes/employee.routes');
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/employee', employeeRoutes); // alias

const departmentRoutes = require('./routes/department.routes');
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/department', departmentRoutes); // alias

const designationRoutes = require('./routes/designation.routes');
app.use('/api/v1/designations', designationRoutes);
app.use('/api/v1/designation', designationRoutes); // alias

// ==================== BIRTHDAYS ====================
// Import birthday routes
const birthdayRoutes = require('./routes/birthday.routes');

// Register birthday routes
app.use('/api/v1/birthdays', birthdayRoutes);


// ==================== ONBOARDING & OFFBOARDING ====================
const onboardingRoutes = require('./routes/onboarding.routes');
const offboardingRoutes = require('./routes/offboarding.routes');
app.use('/api/v1/onboardings', onboardingRoutes);
app.use('/api/v1/onboarding', onboardingRoutes); // alias
app.use('/api/v1/offboardings', offboardingRoutes);
app.use('/api/v1/offboarding', offboardingRoutes); // alias

// ==================== ATTENDANCE & LEAVE ====================
const attendanceRoutes = require('./routes/attendance.routes');
app.use('/api/v1/attendance', attendanceRoutes);

const leaveRoutes = require('./routes/leave.routes');
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/leave', leaveRoutes); // alias

// ==================== PAYROLL & SALARY ====================
const payrollRoutes = require('./routes/payroll.routes');
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/payrolls', payrollRoutes); // alias

const salaryStructureRoutes = require('./routes/salaryStructure.routes');
app.use('/api/v1/salary-structures', salaryStructureRoutes);
app.use('/api/v1/salary-structure', salaryStructureRoutes); // alias

// ==================== FINANCIAL ====================
const loanRoutes = require('./routes/loan.routes');
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/loan', loanRoutes); // alias

const advanceRoutes = require('./routes/advance.routes');
app.use('/api/v1/advances', advanceRoutes);
app.use('/api/v1/advance', advanceRoutes); // alias

// ✅ NEW: EXPENSE MANAGEMENT
const expenseRoutes = require('./routes/expense.routes');
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/expense', expenseRoutes); // alias

// ==================== ASSETS & CONTRACTS ====================
const assetRoutes = require('./routes/asset.routes');
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/asset', assetRoutes); // alias

const contractRoutes = require('./routes/contract.routes');
app.use('/api/v1/contracts', contractRoutes);
app.use('/api/v1/contract', contractRoutes); // alias

// ==================== EVENTS & MEETINGS ====================
const eventRoutes = require('./routes/event.routes');
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/event', eventRoutes); // alias

const meetingRoutes = require('./routes/meeting.routes');
app.use('/api/v1/meetings', meetingRoutes);
app.use('/api/v1/meeting', meetingRoutes); // alias

// ==================== ANNOUNCEMENTS & RECOGNITION ====================
const announcementRoutes = require('./routes/announcement.routes');
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/announcement', announcementRoutes); // alias

const recognitionRoutes = require('./routes/recognitionRoutes');
app.use('/api/v1/recognitions', recognitionRoutes);
app.use('/api/v1/recognition', recognitionRoutes); // alias

// ==================== TRAINING & RECRUITMENT ====================
const trainingRoutes = require('./routes/training.routes');
app.use('/api/v1/trainings', trainingRoutes);
app.use('/api/v1/training', trainingRoutes); // alias

const recruitmentRoutes = require('./routes/recruitment.routes');
app.use('/api/v1/recruitments', recruitmentRoutes);
app.use('/api/v1/recruitment', recruitmentRoutes); // alias

// ==================== COMPLIANCE & REPORTS ====================
const complianceRoutes = require('./routes/complianceRoutes');
app.use('/api/v1/compliance', complianceRoutes);

const reportRoutes = require('./routes/reportRoutes');
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/report', reportRoutes); // alias

// ==================== ANALYTICS ====================
const analyticsRoutes = require('./routes/analytics.routes');
app.use('/api/v1/analytics', analyticsRoutes);

// ==================== CHATBOT ====================
const chatbotRoutes = require('./routes/chatbot.routes');
app.use('/api/v1/chatbot', chatbotRoutes);

module.exports = app;
