// controllers/eventController.js
const Event = require('../models/Event');
const Employee = require('../models/Employee');
const { sendResponse } = require('../utils/responseHandler');
const moment = require('moment');

// ==================== CREATE EVENT ====================
exports.createEvent = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee profile not found');
    }

    const event = await Event.create({
      ...req.body,
      organizer: employee._id,
    });

    await event.populate([
      { path: 'organizer', select: 'firstName lastName email' },
      { path: 'targetDepartments', select: 'name' },
    ]);

    sendResponse(res, 201, true, 'Event created successfully', event);
  } catch (error) {
    next(error);
  }
};

// ==================== GET ALL EVENTS ====================
exports.getAllEvents = async (req, res, next) => {
  try {
    const { 
      startDate, 
      endDate, 
      type, 
      visibility, 
      status,
      page = 1, 
      limit = 20 
    } = req.query;

    const employee = await Employee.findOne({ userId: req.user.id });

    const query = { status: { $ne: 'Cancelled' } };

    // Date range filter
    if (startDate && endDate) {
      query.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.startDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.endDate = { $lte: new Date(endDate) };
    }

    if (type) query.type = type;
    if (status) query.status = status;

    // Role-based filtering
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      query.$or = [
        { visibility: 'Public' },
        { 'attendees.employee': employee._id },
        { organizer: employee._id },
        { targetDepartments: employee.department },
      ];
    }

    const events = await Event.find(query)
      .populate('organizer', 'firstName lastName email profilePicture')
      .populate('attendees.employee', 'firstName lastName email')
      .populate('targetDepartments', 'name')
      .sort({ startDate: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Event.countDocuments(query);

    sendResponse(res, 200, true, 'Events fetched successfully', {
      events,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET EVENT BY ID ====================
exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'firstName lastName email profilePicture')
      .populate('attendees.employee', 'firstName lastName email profilePicture')
      .populate('targetDepartments', 'name');

    if (!event) {
      return sendResponse(res, 404, false, 'Event not found');
    }

    sendResponse(res, 200, true, 'Event fetched successfully', event);
  } catch (error) {
    next(error);
  }
};

// ==================== UPDATE EVENT ====================
exports.updateEvent = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    const event = await Event.findById(req.params.id);

    if (!event) {
      return sendResponse(res, 404, false, 'Event not found');
    }

    // Authorization check
    const isOrganizer = event.organizer.toString() === employee._id.toString();
    const isAuthorized = ['admin', 'hr'].includes(req.user.role) || isOrganizer;

    if (!isAuthorized) {
      return sendResponse(res, 403, false, 'Not authorized to update this event');
    }

    Object.assign(event, req.body);
    await event.save();

    await event.populate([
      { path: 'organizer', select: 'firstName lastName email' },
      { path: 'attendees.employee', select: 'firstName lastName' },
    ]);

    sendResponse(res, 200, true, 'Event updated successfully', event);
  } catch (error) {
    next(error);
  }
};

// ==================== DELETE EVENT ====================
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return sendResponse(res, 404, false, 'Event not found');
    }

    // Soft delete - mark as cancelled
    event.status = 'Cancelled';
    await event.save();

    sendResponse(res, 200, true, 'Event cancelled successfully');
  } catch (error) {
    next(error);
  }
};

// ==================== RSVP TO EVENT ====================
exports.rsvpToEvent = async (req, res, next) => {
  try {
    const { status } = req.body; // 'Accepted', 'Declined', 'Maybe'
    const employee = await Employee.findOne({ userId: req.user.id });

    if (!['Accepted', 'Declined', 'Maybe'].includes(status)) {
      return sendResponse(res, 400, false, 'Invalid RSVP status. Must be: Accepted, Declined, or Maybe');
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return sendResponse(res, 404, false, 'Event not found');
    }

    // Find existing RSVP
    const existingIndex = event.attendees.findIndex(
      (a) => a.employee.toString() === employee._id.toString()
    );

    if (existingIndex !== -1) {
      // Update existing RSVP
      event.attendees[existingIndex].rsvpStatus = status;
      event.attendees[existingIndex].rsvpDate = new Date();
    } else {
      // Add new RSVP
      event.attendees.push({
        employee: employee._id,
        rsvpStatus: status,
        rsvpDate: new Date(),
      });
    }

    await event.save();
    await event.populate('attendees.employee', 'firstName lastName email');

    sendResponse(res, 200, true, `RSVP ${status.toLowerCase()} successfully`, event);
  } catch (error) {
    next(error);
  }
};

// ==================== GET MY EVENTS ====================
exports.getMyEvents = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });

    const events = await Event.find({
      $or: [
        { organizer: employee._id },
        { 'attendees.employee': employee._id },
      ],
      status: { $ne: 'Cancelled' },
    })
      .populate('organizer', 'firstName lastName email')
      .populate('attendees.employee', 'firstName lastName')
      .sort({ startDate: 1 });

    // Add my RSVP status to each event
    const eventsWithRSVP = events.map(event => {
      const myRSVP = event.attendees.find(
        a => a.employee._id.toString() === employee._id.toString()
      );
      
      return {
        ...event.toObject(),
        myRSVPStatus: myRSVP ? myRSVP.rsvpStatus : 'N/A',
        isOrganizer: event.organizer._id.toString() === employee._id.toString(),
      };
    });

    sendResponse(res, 200, true, 'My events fetched successfully', eventsWithRSVP);
  } catch (error) {
    next(error);
  }
};

// ==================== SEND EVENT REMINDERS ====================
exports.sendEventReminders = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('attendees.employee', 'firstName lastName email');

    if (!event) {
      return sendResponse(res, 404, false, 'Event not found');
    }

    // Filter only accepted attendees
    const acceptedAttendees = event.attendees.filter(
      a => a.rsvpStatus === 'Accepted'
    );

    // TODO: Implement email/SMS reminder service
    // For now, just return count
    console.log(`Sending reminders for event: ${event.title}`);
    console.log(`Recipients: ${acceptedAttendees.length}`);

    sendResponse(res, 200, true, `Reminders sent to ${acceptedAttendees.length} attendees`, {
      eventTitle: event.title,
      remindersSent: acceptedAttendees.length,
    });
  } catch (error) {
    next(error);
  }
};


// Add to eventController.js

// ==================== GET BIRTHDAY CALENDAR ====================
exports.getBirthdayCalendar = async (req, res, next) => {
  try {
    const { month, year = moment().year() } = req.query;
    
    let query = { 
      status: "Active",
      dateOfBirth: { $exists: true, $ne: null }
    };

    const employees = await Employee.find(query)
      .select("firstName lastName employeeId dateOfBirth department profilePicture")
      .populate("department", "name");

    // Filter by month if specified
    let birthdayList = employees.map(emp => {
      const dob = moment(emp.dateOfBirth);
      return {
        _id: emp._id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        fullName: `${emp.firstName} ${emp.lastName}`,
        employeeId: emp.employeeId,
        department: emp.department?.name || "N/A",
        profilePicture: emp.profilePicture,
        dateOfBirth: emp.dateOfBirth,
        birthMonth: dob.month() + 1,
        birthDay: dob.date(),
        birthdayThisYear: moment(`${year}-${dob.format('MM-DD')}`).toDate(),
        age: year - dob.year()
      };
    });

    // Filter by month if provided
    if (month) {
      birthdayList = birthdayList.filter(b => b.birthMonth === parseInt(month));
    }

    // Sort by birth day
    birthdayList.sort((a, b) => {
      if (a.birthMonth === b.birthMonth) {
        return a.birthDay - b.birthDay;
      }
      return a.birthMonth - b.birthMonth;
    });

    // Find today's and upcoming birthdays
    const today = moment();
    const upcomingBirthdays = birthdayList.filter(b => {
      const birthday = moment(b.birthdayThisYear);
      return birthday.isSameOrAfter(today, 'day') && 
             birthday.isBefore(today.clone().add(30, 'days'), 'day');
    });

    const todaysBirthdays = birthdayList.filter(b => {
      return moment(b.birthdayThisYear).isSame(today, 'day');
    });

    sendResponse(res, 200, true, "Birthday calendar fetched successfully", {
      allBirthdays: birthdayList,
      todaysBirthdays,
      upcomingBirthdays: upcomingBirthdays.slice(0, 10),
      totalEmployees: birthdayList.length
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SEND BIRTHDAY WISH ====================
exports.sendBirthdayWish = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { message } = req.body;

    const sender = await Employee.findOne({ userId: req.user._id });
    const receiver = await Employee.findById(employeeId);

    if (!receiver) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    // Create a birthday wish record (you can store in Event or create BirthdayWish model)
    const wish = {
      from: sender._id,
      to: receiver._id,
      message,
      sentOn: new Date()
    };

    // Store wish in employee's record or separate collection
    // For now, you can use Event model with type "Birthday"
    const birthdayEvent = await Event.create({
      title: `Birthday Wish for ${receiver.firstName}`,
      description: message,
      type: "Birthday",
      startDate: new Date(),
      endDate: new Date(),
      organizer: sender._id,
      attendees: [{
        employee: receiver._id,
        rsvpStatus: "Accepted"
      }],
      visibility: "Private"
    });

    sendResponse(res, 200, true, "Birthday wish sent successfully", {
      wish: {
        to: `${receiver.firstName} ${receiver.lastName}`,
        message,
        sentOn: wish.sentOn
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET BIRTHDAY WISHES FOR ME ====================
exports.getMyBirthdayWishes = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    
    const wishes = await Event.find({
      type: "Birthday",
      "attendees.employee": employee._id
    })
      .populate("organizer", "firstName lastName profilePicture")
      .sort({ startDate: -1 })
      .limit(50);

    sendResponse(res, 200, true, "Birthday wishes fetched successfully", wishes);
  } catch (error) {
    next(error);
  }
};
