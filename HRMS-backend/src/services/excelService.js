const ExcelJS = require('exceljs');

exports.generateAttendanceReport = async (attendanceData) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance Report');

  // Add headers
  worksheet.columns = [
    { header: 'Employee ID', key: 'employeeId', width: 15 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Check In', key: 'checkIn', width: 15 },
    { header: 'Check Out', key: 'checkOut', width: 15 },
    { header: 'Working Hours', key: 'hours', width: 15 },
    { header: 'Status', key: 'status', width: 15 }
  ];

  // Add data
  attendanceData.forEach(record => {
    worksheet.addRow({
      employeeId: record.employee.employeeId,
      name: `${record.employee.firstName} ${record.employee.lastName}`,
      date: record.date,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      hours: record.workingHours,
      status: record.status
    });
  });

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};
