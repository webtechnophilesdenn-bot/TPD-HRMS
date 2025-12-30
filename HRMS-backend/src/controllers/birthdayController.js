// src/controllers/birthdayController.js
const Employee = require('../models/Employee');
const { sendResponse } = require('../utils/responseHandler');

/**
 * @desc Get birthday calendar (accessible to all authenticated users)
 * @route GET /api/v1/birthdays/calendar
 * @access Private (All roles)
 */
exports.getBirthdayCalendar = async (req, res, next) => {
  try {
    const { month, department } = req.query;
    const today = new Date();

    console.log('📅 Fetching birthday calendar...');

    // Build query
    const query = {
      status: 'Active',
      dateOfBirth: { $exists: true, $ne: null }
    };

    if (department) {
      query.department = department;
    }

    // Fetch employees with birthdays
    const employees = await Employee.find(query)
      .select('firstName lastName employeeId dateOfBirth department designation profilePicture birthdayWishes')
      .populate('department', 'name')
      .populate('designation', 'title')
      .populate({
        path: 'birthdayWishes.wisherId',
        select: 'firstName lastName employeeId profilePicture'
      })
      .lean();

    console.log(`✅ Found ${employees.length} employees with birthdays`);

    // Process birthdays
    const birthdays = employees.map(emp => {
      const dob = new Date(emp.dateOfBirth);
      const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      
      if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }
      
      const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
      const age = today.getFullYear() - dob.getFullYear();
      
      return {
        _id: emp._id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        employeeId: emp.employeeId,
        dateOfBirth: emp.dateOfBirth,
        department: emp.department,
        designation: emp.designation,
        profilePicture: emp.profilePicture,
        birthdayWishes: emp.birthdayWishes || [],
        nextBirthday,
        daysUntil,
        age,
        isToday: daysUntil === 0,
        isThisWeek: daysUntil <= 7,
        isThisMonth: daysUntil <= 30
      };
    });

    // Sort by closest birthday first
    birthdays.sort((a, b) => a.daysUntil - b.daysUntil);

    // Filter by month if specified
    let filteredBirthdays = birthdays;
    if (month) {
      const targetMonth = parseInt(month);
      filteredBirthdays = birthdays.filter(b => {
        const birthMonth = new Date(b.dateOfBirth).getMonth() + 1;
        return birthMonth === targetMonth;
      });
    }

    sendResponse(res, 200, true, 'Birthday calendar fetched successfully', {
      birthdays: filteredBirthdays,
      total: filteredBirthdays.length,
      todayCount: birthdays.filter(b => b.isToday).length,
      weekCount: birthdays.filter(b => b.isThisWeek).length,
      monthCount: birthdays.filter(b => b.isThisMonth).length
    });
  } catch (error) {
    console.error('❌ Error fetching birthday calendar:', error);
    next(error);
  }
};

/**
 * @desc Get today's birthdays
 * @route GET /api/v1/birthdays/today
 * @access Private (All roles)
 */
exports.getTodaysBirthdays = async (req, res, next) => {
  try {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    const employees = await Employee.find({
      status: 'Active',
      dateOfBirth: { $exists: true, $ne: null }
    })
      .select('firstName lastName employeeId dateOfBirth department designation profilePicture birthdayWishes')
      .populate('department', 'name')
      .populate('designation', 'title')
      .lean();

    const todaysBirthdays = employees.filter(emp => {
      const dob = new Date(emp.dateOfBirth);
      return dob.getMonth() === todayMonth && dob.getDate() === todayDate;
    });

    sendResponse(res, 200, true, "Today's birthdays fetched successfully", {
      birthdays: todaysBirthdays,
      count: todaysBirthdays.length
    });
  } catch (error) {
    console.error("❌ Error fetching today's birthdays:", error);
    next(error);
  }
};

/**
 * @desc Get upcoming birthdays (next 30 days)
 * @route GET /api/v1/birthdays/upcoming
 * @access Private (All roles)
 */
exports.getUpcomingBirthdays = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const today = new Date();

    const employees = await Employee.find({
      status: 'Active',
      dateOfBirth: { $exists: true, $ne: null }
    })
      .select('firstName lastName employeeId dateOfBirth department designation profilePicture')
      .populate('department', 'name')
      .populate('designation', 'title')
      .lean();

    const upcomingBirthdays = employees
      .map(emp => {
        const dob = new Date(emp.dateOfBirth);
        const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        
        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
        
        return { ...emp, daysUntil };
      })
      .filter(emp => emp.daysUntil <= parseInt(days))
      .sort((a, b) => a.daysUntil - b.daysUntil);

    sendResponse(res, 200, true, 'Upcoming birthdays fetched successfully', {
      birthdays: upcomingBirthdays,
      count: upcomingBirthdays.length
    });
  } catch (error) {
    console.error('❌ Error fetching upcoming birthdays:', error);
    next(error);
  }
};
