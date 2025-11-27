const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

exports.sendEmail = async (options) => {
  const mailOptions = {
    from: `HRMS System <${process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  await transporter.sendMail(mailOptions);
};

// Send Leave Approval Email
exports.sendLeaveApprovalEmail = async (employee, leave) => {
  const html = `
    <h2>Leave Application ${leave.status}</h2>
    <p>Dear ${employee.firstName},</p>
    <p>Your leave application from ${leave.startDate} to ${leave.endDate} has been ${leave.status.toLowerCase()}.</p>
    ${leave.status === 'Rejected' ? `<p>Reason: ${leave.rejectionReason}</p>` : ''}
    <p>Thank you,<br>HR Team</p>
  `;

  await this.sendEmail({
    email: employee.userId.email,
    subject: `Leave ${leave.status}`,
    html
  });
};
