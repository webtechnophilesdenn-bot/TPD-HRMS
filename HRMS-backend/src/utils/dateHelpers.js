const moment = require('moment');

exports.isWeekend = (date) => {
  const day = moment(date).day();
  return day === 0 || day === 6; // Sunday or Saturday
};

exports.isHoliday = async (date) => {
  // Check against holiday calendar
  // Implementation depends on your holiday model
  return false;
};

exports.calculateWorkingDays = (startDate, endDate) => {
  let count = 0;
  let currentDate = moment(startDate);
  const end = moment(endDate);

  while (currentDate.isSameOrBefore(end)) {
    if (!this.isWeekend(currentDate.toDate())) {
      count++;
    }
    currentDate.add(1, 'day');
  }

  return count;
};

exports.getFinancialYear = (date = new Date()) => {
  const year = moment(date).year();
  const month = moment(date).month(); // 0-11

  if (month >= 3) { // April onwards
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};