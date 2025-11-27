const Announcement = require('../models/Announcement');
const Employee = require('../models/Employee');
const { sendResponse } = require('../utils/responseHandler');

// Create Announcement
exports.createAnnouncement = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee profile not found');
    }

    const announcementData = {
      ...req.body,
      createdBy: employee._id,
      status: req.body.publishDate && new Date(req.body.publishDate) > new Date() 
        ? 'Scheduled' 
        : 'Published'
    };

    const announcement = await Announcement.create(announcementData);
    
    await announcement.populate([
      { path: 'createdBy', select: 'firstName lastName profilePicture' },
      { path: 'targetDepartments', select: 'name' },
      { path: 'targetDesignations', select: 'name' }
    ]);

    sendResponse(res, 201, true, 'Announcement created successfully', announcement);
  } catch (error) {
    next(error);
  }
};

// Get All Announcements (with role-based filtering)
exports.getAllAnnouncements = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee profile not found');
    }

    const { 
      category, 
      priority, 
      status, 
      search,
      page = 1,
      limit = 20,
      includeExpired = false
    } = req.query;

    // Base query
    let query = { isActive: true };

    // Role-based filtering
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      query.$or = [
        { visibility: 'All' },
        { targetDepartments: employee.department },
        { targetDesignations: employee.designation },
        { targetLocations: employee.location },
        { targetEmployees: employee._id }
      ];
    }

    // Apply filters
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (status) query.status = status;
    
    if (!includeExpired) {
      query.$or = [
        { expiryDate: { $exists: false } },
        { expiryDate: { $gt: new Date() } },
        { status: 'Published' }
      ];
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .populate('createdBy', 'firstName lastName profilePicture department')
        .populate('targetDepartments', 'name')
        .populate('targetDesignations', 'name')
        .sort({ isPinned: -1, publishDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Announcement.countDocuments(query)
    ]);

    // Mark announcements as viewed
    const viewPromises = announcements.map(ann => 
      ann.markAsViewed(employee._id)
    );
    await Promise.all(viewPromises);

    sendResponse(res, 200, true, 'Announcements fetched successfully', {
      announcements,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Announcement
exports.getAnnouncementById = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'firstName lastName profilePicture department')
      .populate('targetDepartments', 'name')
      .populate('targetDesignations', 'name')
      .populate('comments.employee', 'firstName lastName profilePicture')
      .populate('reactions.employee', 'firstName lastName')
      .populate('acknowledgedBy.employee', 'firstName lastName');

    if (!announcement) {
      return sendResponse(res, 404, false, 'Announcement not found');
    }

    // Check if employee has access
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      if (!announcement.isVisibleTo(employee)) {
        return sendResponse(res, 403, false, 'Access denied to this announcement');
      }
    }

    // Mark as viewed
    await announcement.markAsViewed(employee._id);

    sendResponse(res, 200, true, 'Announcement fetched successfully', announcement);
  } catch (error) {
    next(error);
  }
};

// Update Announcement
exports.updateAnnouncement = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return sendResponse(res, 404, false, 'Announcement not found');
    }

    // Only creator, HR, or Admin can update
    if (
      announcement.createdBy.toString() !== employee._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'hr'
    ) {
      return sendResponse(res, 403, false, 'Not authorized to update this announcement');
    }

    Object.assign(announcement, req.body);
    announcement.lastModifiedBy = employee._id;
    
    await announcement.save();
    await announcement.populate('createdBy', 'firstName lastName profilePicture');

    sendResponse(res, 200, true, 'Announcement updated successfully', announcement);
  } catch (error) {
    next(error);
  }
};

// Delete Announcement
exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return sendResponse(res, 404, false, 'Announcement not found');
    }

    // Only creator, HR, or Admin can delete
    if (
      announcement.createdBy.toString() !== employee._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'hr'
    ) {
      return sendResponse(res, 403, false, 'Not authorized to delete this announcement');
    }

    await announcement.deleteOne();

    sendResponse(res, 200, true, 'Announcement deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Add Reaction
exports.addReaction = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    const { type } = req.body;

    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return sendResponse(res, 404, false, 'Announcement not found');
    }

    // Remove existing reaction if any
    announcement.reactions = announcement.reactions.filter(
      r => r.employee.toString() !== employee._id.toString()
    );

    // Add new reaction
    announcement.reactions.push({
      employee: employee._id,
      type
    });
    
    announcement.totalReactions = announcement.reactions.length;
    await announcement.save();

    sendResponse(res, 200, true, 'Reaction added successfully');
  } catch (error) {
    next(error);
  }
};

// Add Comment
exports.addComment = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    const { content } = req.body;

    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return sendResponse(res, 404, false, 'Announcement not found');
    }

    announcement.comments.push({
      employee: employee._id,
      content
    });
    
    announcement.totalComments = announcement.comments.length;
    await announcement.save();
    
    await announcement.populate('comments.employee', 'firstName lastName profilePicture');

    sendResponse(res, 200, true, 'Comment added successfully', announcement.comments);
  } catch (error) {
    next(error);
  }
};

// Acknowledge Announcement
exports.acknowledgeAnnouncement = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return sendResponse(res, 404, false, 'Announcement not found');
    }

    if (!announcement.acknowledgmentRequired) {
      return sendResponse(res, 400, false, 'Acknowledgment not required for this announcement');
    }

    // Check if already acknowledged
    const alreadyAcknowledged = announcement.acknowledgedBy.some(
      ack => ack.employee.toString() === employee._id.toString()
    );

    if (alreadyAcknowledged) {
      return sendResponse(res, 400, false, 'Already acknowledged');
    }

    announcement.acknowledgedBy.push({ employee: employee._id });
    announcement.totalAcknowledgments = announcement.acknowledgedBy.length;
    await announcement.save();

    sendResponse(res, 200, true, 'Announcement acknowledged successfully');
  } catch (error) {
    next(error);
  }
};

// Pin/Unpin Announcement
exports.togglePin = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return sendResponse(res, 404, false, 'Announcement not found');
    }

    announcement.isPinned = !announcement.isPinned;
    await announcement.save();

    sendResponse(res, 200, true, `Announcement ${announcement.isPinned ? 'pinned' : 'unpinned'} successfully`, announcement);
  } catch (error) {
    next(error);
  }
};

// Get Announcement Analytics
exports.getAnnouncementAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const analytics = await Announcement.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalViews: { $sum: '$totalViews' },
          totalReactions: { $sum: '$totalReactions' },
          totalComments: { $sum: '$totalComments' },
          avgEngagement: { $avg: '$totalViews' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const priorityStats = await Announcement.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    sendResponse(res, 200, true, 'Analytics fetched successfully', {
      byCategory: analytics,
      byPriority: priorityStats
    });
  } catch (error) {
    next(error);
  }
};