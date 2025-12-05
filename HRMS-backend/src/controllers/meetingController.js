const Meeting = require('../models/Meeting');
const Employee = require('../models/Employee');
const Candidate = require('../models/Candidate');
const Event = require('../models/Event');
const { sendResponse } = require('../utils/responseHandler');
const { v4: uuidv4 } = require('uuid');
const { sendMeetingNotification, sendMeetingReminder } = require('../services/notificationService');

// ==================== CREATE MEETING ====================
exports.createMeeting = async (req, res, next) => {
  try {
    const {
      title,
      description,
      type,
      startTime,
      endTime,
      participants,
      privacy,
      visibleToDepartments,
      visibleToTeams,
      visibleToRoles,
      requiresPassword,
      password,
      linkedCandidate,
      linkedEvent,
      linkedJob,
      agenda,
      waitingRoom,
      allowGuestJoin,
      recordingEnabled,
      isRecurring,
      recurrence,
      requiresApproval,
      approvers,
      resources,
      actionItems,
    } = req.body;

    const employee = await Employee.findOne({ userId: req.user.id }).populate('department');
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee profile not found');
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.round((end - start) / (1000 * 60));

    const meetingId = uuidv4().split('-').join('').substring(0, 10);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const meetingLink = `${baseUrl}/meet/${meetingId}`;

    // ✅ Auto-add participants based on privacy settings
    let normalizedParticipants = (participants || []).map((p) => {
      if (p && typeof p === 'object') {
        return {
          employee: p.employee,
          status: p.status || 'Invited',
          isRequired: p.isRequired !== undefined ? p.isRequired : true,
          ...p,
        };
      }
      return {
        employee: p,
        status: 'Invited',
        isRequired: true,
      };
    });

    // ✅ Auto-add department members if privacy is 'Department'
    if (privacy === 'Department' && visibleToDepartments && visibleToDepartments.length > 0) {
      const deptEmployees = await Employee.find({
        department: { $in: visibleToDepartments },
        _id: { $nin: normalizedParticipants.map(p => p.employee) }, // Don't duplicate
      });

      deptEmployees.forEach(emp => {
        normalizedParticipants.push({
          employee: emp._id,
          status: 'Invited',
          isRequired: false,
        });
      });
    }

    // ✅ Auto-add team members if privacy is 'Team'
    if (privacy === 'Team' && visibleToTeams && visibleToTeams.length > 0) {
      const teamEmployees = await Employee.find({
        team: { $in: visibleToTeams },
        _id: { $nin: normalizedParticipants.map(p => p.employee) },
      });

      teamEmployees.forEach(emp => {
        normalizedParticipants.push({
          employee: emp._id,
          status: 'Invited',
          isRequired: false,
        });
      });
    }

    const meetingData = {
      meetingId,
      title,
      description,
      type,
      startTime: start,
      endTime: end,
      duration,
      organizer: employee._id,
      participants: normalizedParticipants,
      privacy: privacy || 'Custom',
      visibleToDepartments: visibleToDepartments || [],
      visibleToTeams: visibleToTeams || [],
      visibleToRoles: visibleToRoles || [],
      meetingLink,
      requiresPassword: requiresPassword || false,
      password: requiresPassword ? password : undefined,
      linkedCandidate,
      linkedEvent,
      linkedJob,
      agenda: agenda || [],
      waitingRoom: waitingRoom || false,
      allowGuestJoin: allowGuestJoin !== undefined ? allowGuestJoin : true,
      recordingEnabled: recordingEnabled || false,
      isRecurring: isRecurring || false,
      recurrence: isRecurring ? recurrence : undefined,
      requiresApproval: requiresApproval || false,
      approvers: requiresApproval ? (approvers || []).map(a => ({ employee: a, status: 'Pending' })) : [],
      resources: resources || [],
      actionItems: actionItems || [],
      status: requiresApproval ? 'Pending Approval' : 'Scheduled',
      auditLog: [{
        action: 'Meeting Created',
        performedBy: employee._id,
        timestamp: new Date(),
      }],
    };

    const meeting = await Meeting.create(meetingData);

    await meeting.populate('organizer', 'firstName lastName email profilePicture department');
    await meeting.populate('participants.employee', 'firstName lastName email profilePicture department');

    // ✅ Send notifications to participants
    try {
      await sendMeetingNotification(meeting, 'created');
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    return sendResponse(res, 201, true, 'Meeting created successfully', meeting);
  } catch (error) {
    console.error('Create meeting error:', error);
    next(error);
  }
};

// ==================== GET ALL MEETINGS (Enhanced with Privacy) ====================
exports.getAllMeetings = async (req, res, next) => {
  try {
    const {
      status,
      type,
      privacy,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const employee = await Employee.findOne({ userId: req.user.id }).populate('department');
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee profile not found');
    }

    const filter = {};

    // ✅ Enhanced role-based filtering with privacy support
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      filter.$or = [
        { organizer: employee._id },
        { 'participants.employee': employee._id },
        { privacy: 'Public' },
        { privacy: 'Department', visibleToDepartments: employee.department?._id },
        { privacy: 'Team', visibleToTeams: employee.team },
        { visibleToRoles: employee.role },
      ];
    }

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (privacy) filter.privacy = privacy;

    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }

    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
        ],
      });
    }

    const numericLimit = Number(limit) || 50;
    const numericPage = Number(page) || 1;

    const meetings = await Meeting.find(filter)
      .populate('organizer', 'firstName lastName email profilePicture department')
      .populate('participants.employee', 'firstName lastName email profilePicture department')
      .populate('linkedCandidate', 'name email')
      .populate('linkedJob', 'title')
      .populate('visibleToDepartments', 'name')
      .populate('actionItems.assignedTo', 'firstName lastName')
      .sort({ startTime: -1 })
      .limit(numericLimit)
      .skip((numericPage - 1) * numericLimit);

    const total = await Meeting.countDocuments(filter);

    return sendResponse(res, 200, true, 'Meetings fetched successfully', {
      meetings,
      pagination: {
        currentPage: numericPage,
        totalPages: Math.ceil(total / numericLimit),
        totalRecords: total,
        hasNext: numericPage * numericLimit < total,
        hasPrev: numericPage > 1,
      },
    });
  } catch (error) {
    console.error('Get all meetings error:', error);
    next(error);
  }
};

// ==================== GET MEETING BY ID ====================
exports.getMeetingById = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('organizer', 'firstName lastName email profilePicture')
      .populate('participants.employee', 'firstName lastName email profilePicture department')
      .populate('linkedCandidate', 'name email phone')
      .populate('linkedEvent', 'title type')
      .populate('linkedJob', 'title department')
      .populate('visibleToDepartments', 'name')
      .populate('actionItems.assignedTo', 'firstName lastName email')
      .populate('approvers.employee', 'firstName lastName email')
      .populate('minutes.recordedBy', 'firstName lastName');

    if (!meeting) {
      return sendResponse(res, 404, false, 'Meeting not found');
    }

    sendResponse(res, 200, true, 'Meeting fetched successfully', meeting);
  } catch (error) {
    console.error('Get meeting by ID error:', error);
    next(error);
  }
};

// ✅ NEW: Respond to Meeting Invitation
exports.respondToInvitation = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const { status, responseNote } = req.body; // 'Accepted', 'Declined', 'Tentative'

    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee profile not found');
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return sendResponse(res, 404, false, 'Meeting not found');
    }

    const participant = meeting.participants.find(
      p => p.employee && p.employee.toString() === employee._id.toString()
    );

    if (!participant) {
      return sendResponse(res, 403, false, 'You are not invited to this meeting');
    }

    participant.status = status;
    participant.responseNote = responseNote;

    meeting.auditLog.push({
      action: `Invitation ${status}`,
      performedBy: employee._id,
      timestamp: new Date(),
    });

    await meeting.save();

    sendResponse(res, 200, true, `Meeting invitation ${status.toLowerCase()}`, meeting);
  } catch (error) {
    console.error('Respond to invitation error:', error);
    next(error);
  }
};

// ✅ NEW: Add Action Item
exports.addActionItem = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const { title, description, assignedTo, dueDate, priority } = req.body;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return sendResponse(res, 404, false, 'Meeting not found');
    }

    meeting.actionItems.push({
      title,
      description,
      assignedTo,
      dueDate,
      priority: priority || 'Medium',
      status: 'Not Started',
    });

    await meeting.save();

    sendResponse(res, 200, true, 'Action item added successfully', meeting);
  } catch (error) {
    console.error('Add action item error:', error);
    next(error);
  }
};

// ✅ NEW: Update Action Item Status
exports.updateActionItemStatus = async (req, res, next) => {
  try {
    const { meetingId, actionItemId } = req.params;
    const { status } = req.body;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return sendResponse(res, 404, false, 'Meeting not found');
    }

    const actionItem = meeting.actionItems.id(actionItemId);
    if (!actionItem) {
      return sendResponse(res, 404, false, 'Action item not found');
    }

    actionItem.status = status;
    if (status === 'Completed') {
      actionItem.completedAt = new Date();
    }

    await meeting.save();

    sendResponse(res, 200, true, 'Action item updated successfully', meeting);
  } catch (error) {
    console.error('Update action item error:', error);
    next(error);
  }
};

// ✅ NEW: Submit Feedback
exports.submitFeedback = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const { rating, wasProductive, comments } = req.body;

    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee profile not found');
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return sendResponse(res, 404, false, 'Meeting not found');
    }

    meeting.feedback.push({
      employee: employee._id,
      rating,
      wasProductive,
      comments,
      submittedAt: new Date(),
    });

    await meeting.save();

    sendResponse(res, 200, true, 'Feedback submitted successfully', meeting);
  } catch (error) {
    console.error('Submit feedback error:', error);
    next(error);
  }
};

// ✅ NEW: Approve/Reject Meeting
exports.approveMeeting = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const { approved, comments } = req.body;

    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee profile not found');
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return sendResponse(res, 404, false, 'Meeting not found');
    }

    const approver = meeting.approvers.find(
      a => a.employee.toString() === employee._id.toString()
    );

    if (!approver) {
      return sendResponse(res, 403, false, 'You are not authorized to approve this meeting');
    }

    approver.status = approved ? 'Approved' : 'Rejected';
    approver.responseDate = new Date();
    approver.comments = comments;

    // Check if all approvers have responded
    const allApproved = meeting.approvers.every(a => a.status === 'Approved');
    const anyRejected = meeting.approvers.some(a => a.status === 'Rejected');

    if (anyRejected) {
      meeting.status = 'Cancelled';
      meeting.cancellationReason = 'Approval rejected';
    } else if (allApproved) {
      meeting.status = 'Scheduled';
    }

    meeting.auditLog.push({
      action: approved ? 'Meeting Approved' : 'Meeting Rejected',
      performedBy: employee._id,
      details: { comments },
      timestamp: new Date(),
    });

    await meeting.save();

    sendResponse(res, 200, true, `Meeting ${approved ? 'approved' : 'rejected'} successfully`, meeting);
  } catch (error) {
    console.error('Approve meeting error:', error);
    next(error);
  }
};

// Existing functions continue...
exports.getMeetingByMeetingId = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findOne({ meetingId })
      .populate('organizer', 'firstName lastName email profilePicture')
      .populate('participants.employee', 'firstName lastName email profilePicture');

    if (!meeting) {
      return sendResponse(res, 404, false, 'Meeting not found');
    }

    const publicMeetingInfo = {
      id: meeting.id,
      meetingId: meeting.meetingId,
      title: meeting.title,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      duration: meeting.duration,
      organizer: meeting.organizer,
      requiresPassword: meeting.requiresPassword,
      status: meeting.status,
      type: meeting.type,
      waitingRoom: meeting.waitingRoom,
    };

    sendResponse(res, 200, true, 'Meeting info fetched', publicMeetingInfo);
  } catch (error) {
    console.error('Get meeting by meetingId error:', error);
    next(error);
  }
};

exports.joinMeeting = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const { password, name, email } = req.body;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return sendResponse(res, 404, false, 'Meeting not found');
    }

    if (meeting.requiresPassword && meeting.password !== password) {
      return sendResponse(res, 401, false, 'Incorrect password');
    }

    const now = new Date();
    if (meeting.status === 'Cancelled') {
      return sendResponse(res, 400, false, 'Meeting has been cancelled');
    }

    if (meeting.status === 'Completed') {
      return sendResponse(res, 400, false, 'Meeting has ended');
    }

    if (now >= meeting.startTime && meeting.status === 'Scheduled') {
      meeting.status = 'In Progress';
    }

    const isAuthenticated = !!req.user;
    let existingParticipant;

    if (isAuthenticated) {
      const employee = await Employee.findOne({ userId: req.user.id });
      if (!employee) {
        return sendResponse(res, 404, false, 'Employee profile not found');
      }

      existingParticipant = meeting.participants.find(
        (p) => p.employee && p.employee.toString() === employee._id.toString()
      );

      if (!existingParticipant) {
        meeting.participants.push({
          employee: employee._id,
          joinedAt: now,
          status: 'Attended',
        });
      } else {
        existingParticipant.joinedAt = now;
        existingParticipant.status = 'Attended';
      }
    } else {
      existingParticipant = meeting.participants.find(
        (p) => p.isExternal && p.email === email
      );

      if (!existingParticipant) {
        meeting.participants.push({
          name,
          email,
          isExternal: true,
          joinedAt: now,
          status: 'Attended',
        });
      } else {
        existingParticipant.joinedAt = now;
        existingParticipant.status = 'Attended';
      }
    }

    await meeting.save();

    sendResponse(res, 200, true, 'Joined meeting successfully', {
      meetingId: meeting.meetingId,
      title: meeting.title,
      organizer: meeting.organizer,
    });
  } catch (error) {
    console.error('Join meeting error:', error);
    next(error);
  }
};

exports.updateMeeting = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id, 
      {
        ...req.body,
        $push: {
          auditLog: {
            action: 'Meeting Updated',
            performedBy: employee._id,
            timestamp: new Date(),
          }
        }
      }, 
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('organizer', 'firstName lastName email')
      .populate('participants.employee', 'firstName lastName email');

    if (!meeting) {
      return sendResponse(res, 404, false, 'Meeting not found');
    }

    sendResponse(res, 200, true, 'Meeting updated successfully', meeting);
  } catch (error) {
    console.error('Update meeting error:', error);
    next(error);
  }
};

exports.cancelMeeting = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    const { reason } = req.body;

    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Cancelled',
        cancellationReason: reason,
        $push: {
          auditLog: {
            action: 'Meeting Cancelled',
            performedBy: employee._id,
            details: { reason },
            timestamp: new Date(),
          }
        }
      },
      { new: true }
    );

    if (!meeting) {
      return sendResponse(res, 404, false, 'Meeting not found');
    }

    sendResponse(res, 200, true, 'Meeting cancelled successfully', meeting);
  } catch (error) {
    console.error('Cancel meeting error:', error);
    next(error);
  }
};

exports.endMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return sendResponse(res, 404, false, 'Meeting not found');
    }

    meeting.status = 'Completed';
    const now = new Date();

    const attendees = meeting.participants.filter(p => p.status === 'Attended');
    meeting.analytics = {
      totalParticipants: meeting.participants.length,
      actualAttendees: attendees.length,
      attendanceRate: (attendees.length / meeting.participants.length) * 100,
      actualDuration: Math.round((now - meeting.startTime) / (1000 * 60)),
    };

    await meeting.save();

    sendResponse(res, 200, true, 'Meeting ended successfully', meeting);
  } catch (error) {
    console.error('End meeting error:', error);
    next(error);
  }
};

exports.deleteMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findByIdAndDelete(req.params.id);
    if (!meeting) {
      return sendResponse(res, 404, false, 'Meeting not found');
    }

    sendResponse(res, 200, true, 'Meeting deleted successfully');
  } catch (error) {
    console.error('Delete meeting error:', error);
    next(error);
  }
};

exports.getMyMeetings = async (req, res, next) => {
  try {
    const { upcoming = 'true' } = req.query;
    const now = new Date();

    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee profile not found');
    }

    const filter = {
      $or: [
        { organizer: employee._id },
        { 'participants.employee': employee._id },
      ],
      status: { $ne: 'Cancelled' },
    };

    if (upcoming === 'true') {
      filter.startTime = { $gte: now };
      filter.status = { $in: ['Scheduled', 'In Progress', 'Approved'] };
    }

    const meetings = await Meeting.find(filter)
      .populate('organizer', 'firstName lastName email')
      .populate('participants.employee', 'firstName lastName email')
      .sort({ startTime: 1 })
      .limit(50);

    sendResponse(res, 200, true, 'My meetings fetched successfully', meetings);
  } catch (error) {
    console.error('Get my meetings error:', error);
    next(error);
  }
};
