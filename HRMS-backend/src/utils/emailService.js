// Placeholder email service - replace with actual implementation (nodemailer, SendGrid, etc.)
exports.sendEmail = async ({ to, subject, template, data }) => {
  console.log(`📧 Email sent to ${to}: ${subject}`);
  // TODO: Implement actual email sending logic
  return Promise.resolve();
};
