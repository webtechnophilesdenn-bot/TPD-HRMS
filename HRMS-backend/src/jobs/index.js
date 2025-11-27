const cron = require('node-cron');
const logger = require('../utils/logger');

// Import individual job modules
const { autoMarkAbsent } = require('./autoAttendanceSync');
const { sendBirthdayWishes } = require('./birthdayReminder');
const { resetLeaveBalance } = require('./leaveBalanceReset');
const { sendDocumentExpiryAlerts } = require('./documentExpiryAlert');
const { processMonthlyPayroll } = require('./payrollScheduler');

exports.init = () => {
  // 1. Auto-mark absent employees - Daily at 11 PM
  cron.schedule('0 23 * * *', async () => {
    logger.info('Starting auto-attendance job');
    try {
      await autoMarkAbsent();
      logger.info('Auto-attendance job completed');
    } catch (error) {
      logger.error('Auto-attendance job failed:', error);
    }
  });

  // 2. Birthday wishes - Daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info('Starting birthday reminder job');
    try {
      await sendBirthdayWishes();
      logger.info('Birthday reminder job completed');
    } catch (error) {
      logger.error('Birthday reminder job failed:', error);
    }
  });

  // 3. Leave balance reset - 1st January every year
  cron.schedule('0 0 1 1 *', async () => {
    logger.info('Starting leave balance reset job');
    try {
      await resetLeaveBalance();
      logger.info('Leave balance reset completed');
    } catch (error) {
      logger.error('Leave balance reset failed:', error);
    }
  });

  // 4. Document expiry alerts - Weekly on Monday 9 AM
  cron.schedule('0 9 * * 1', async () => {
    logger.info('Starting document expiry alert job');
    try {
      await sendDocumentExpiryAlerts();
      logger.info('Document expiry alerts sent');
    } catch (error) {
      logger.error('Document expiry alert job failed:', error);
    }
  });

  // 5. Monthly payroll - 25th of every month at 9 AM
  cron.schedule('0 9 25 * *', async () => {
    logger.info('Starting monthly payroll job');
    try {
      await processMonthlyPayroll();
      logger.info('Monthly payroll processed');
    } catch (error) {
      logger.error('Monthly payroll job failed:', error);
    }
  });

  logger.info('✅ All cron jobs initialized successfully');
};