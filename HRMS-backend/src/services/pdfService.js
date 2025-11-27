const PDFDocument = require("pdfkit");
const moment = require("moment");

exports.generatePayslipPDF = async (payslip) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("PAYSLIP", { align: "center" });

      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(
          `For the period: ${moment(payslip.period.startDate).format(
            "MMMM YYYY"
          )}`,
          { align: "center" }
        );

      doc.moveDown(1);

      // Employee Details
      const employee = payslip.employee;
      doc.fontSize(12).font("Helvetica-Bold").text("Employee Details:");

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Name: ${employee.firstName} ${employee.lastName}`)
        .text(`Employee ID: ${employee.employeeId}`)
        .text(`Designation: ${employee.designation?.title || "N/A"}`)
        .text(`Department: ${employee.department?.name || "N/A"}`);

      doc.moveDown(1);

      // Earnings Table
      doc.fontSize(12).font("Helvetica-Bold").text("Earnings:");

      const earnings = [
        ["Basic Salary", formatCurrency(payslip.earnings.basic)],
        ["House Rent Allowance", formatCurrency(payslip.earnings.hra)],
        [
          "Special Allowance",
          formatCurrency(payslip.earnings.specialAllowance),
        ],
        ["Conveyance", formatCurrency(payslip.earnings.conveyance)],
        [
          "Medical Allowance",
          formatCurrency(payslip.earnings.medicalAllowance),
        ],
        ["Bonus", formatCurrency(payslip.earnings.bonus)],
        ["Overtime", formatCurrency(payslip.earnings.overtime)],
        ["Other Allowances", formatCurrency(payslip.earnings.otherAllowances)],
      ];

      drawTable(doc, earnings, 100);

      doc.moveDown(1);

      // Deductions Table
      doc.fontSize(12).font("Helvetica-Bold").text("Deductions:");

      const deductions = [
        ["PF Employee", formatCurrency(payslip.deductions.pfEmployee)],
        ["ESIC Employee", formatCurrency(payslip.deductions.esicEmployee)],
        [
          "Professional Tax",
          formatCurrency(payslip.deductions.professionalTax),
        ],
        ["TDS", formatCurrency(payslip.deductions.tds)],
        ["Loan Recovery", formatCurrency(payslip.deductions.loanRecovery)],
        [
          "Other Deductions",
          formatCurrency(payslip.deductions.otherDeductions),
        ],
      ];

      drawTable(doc, deductions, 100);

      doc.moveDown(1);

      // Summary
      doc.fontSize(12).font("Helvetica-Bold").text("Summary:");

      const summary = [
        ["Gross Earnings", formatCurrency(payslip.summary.grossEarnings)],
        ["Total Deductions", formatCurrency(payslip.summary.totalDeductions)],
        ["Net Salary", formatCurrency(payslip.summary.netSalary)],
      ];

      drawTable(doc, summary, 100);

      // Footer
      doc.moveDown(2);
      doc
        .fontSize(8)
        .font("Helvetica")
        .text(
          "This is a computer-generated document and does not require signature.",
          { align: "center" }
        )
        .text(`Generated on: ${moment().format("DD/MM/YYYY HH:mm")}`, {
          align: "center",
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

exports.generatePayrollReportPDF = async (payrolls, month, year) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("PAYROLL REPORT", { align: "center" });

      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(
          `For the period: ${moment(`${year}-${month}-01`).format(
            "MMMM YYYY"
          )}`,
          { align: "center" }
        );

      doc.moveDown(1);

      // Summary
      const totalNet = payrolls.reduce(
        (sum, p) => sum + p.summary.netSalary,
        0
      );
      const totalGross = payrolls.reduce(
        (sum, p) => sum + p.summary.grossEarnings,
        0
      );
      const totalDeductions = payrolls.reduce(
        (sum, p) => sum + p.summary.totalDeductions,
        0
      );

      doc.fontSize(12).font("Helvetica-Bold").text("Payroll Summary:");

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Total Employees: ${payrolls.length}`)
        .text(`Total Gross Salary: ${formatCurrency(totalGross)}`)
        .text(`Total Deductions: ${formatCurrency(totalDeductions)}`)
        .text(`Total Net Salary: ${formatCurrency(totalNet)}`);

      doc.moveDown(1);

      // Employee List
      doc.fontSize(12).font("Helvetica-Bold").text("Employee-wise Breakdown:");

      let yPosition = doc.y;
      payrolls.forEach((payroll, index) => {
        if (yPosition > 700) {
          // New page if near bottom
          doc.addPage();
          yPosition = 50;
        }

        const employee = payroll.employee;
        doc
          .fontSize(9)
          .font("Helvetica")
          .text(
            `${index + 1}. ${employee.firstName} ${employee.lastName} (${
              employee.employeeId
            })`
          )
          .text(
            `   Net Salary: ${formatCurrency(
              payroll.summary.netSalary
            )} | Status: ${payroll.status}`,
            { indent: 20 }
          );

        yPosition += 30;
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Helper functions
const drawTable = (doc, data, startY) => {
  const rowHeight = 15;
  const colWidth = 200;

  data.forEach((row, i) => {
    const y = startY + i * rowHeight;

    doc
      .fontSize(9)
      .font("Helvetica")
      .text(row[0], 50, y)
      .text(row[1], 250, y, { width: 100, align: "right" });

    // Draw line
    if (i < data.length - 1) {
      doc
        .moveTo(50, y + rowHeight - 2)
        .lineTo(350, y + rowHeight - 2)
        .strokeColor("#cccccc")
        .stroke();
    }
  });
};

const formatCurrency = (amount) => {
  return (
    "₹" +
    amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};
