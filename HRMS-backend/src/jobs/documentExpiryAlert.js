const Employee = require('../models/Employee');
const { sendEmail } = require('../services/emailService');
const moment = require('moment');

exports.sendDocumentExpiryAlerts = async () => {
  try {
    const employees = await Employee.find({ status: 'Active' }).populate('userId');
    const thirtyDaysFromNow = moment().add(30, 'days').toDate();

    let alertCount = 0;

    for (const emp of employees) {
      // Check for expiring documents
      const expiringDocs = emp.documents.filter(doc => {
        if (!doc.expiryDate) return false;
        return moment(doc.expiryDate).isBefore(thirtyDaysFromNow);
      });

      if (expiringDocs.length > 0) {
        await sendEmail({
          email: emp.userId.email,
          subject: '⚠️ Document Expiry Alert',
          html: `
            <h2>Document Expiry Notification</h2>
            <p>Dear ${emp.firstName},</p>
            <p>The following documents are expiring soon:</p>
            <ul>
              ${expiringDocs.map(doc => `
                <li>${doc.type} - Expires on ${moment(doc.expiryDate).format('DD MMM YYYY')}</li>
              `).join('')}
            </ul>
            <p>Please update your documents at the earliest.</p>
          `
        });
        alertCount++;
      }
    }

    console.log(`Sent document expiry alerts to ${alertCount} employees`);
  } catch (error) {
    throw error;
  }
};
