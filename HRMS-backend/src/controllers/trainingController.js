const Training = require('../models/Training');
const Employee = require('../models/Employee');
const { sendResponse } = require('../utils/responseHandler');

// Helper function for manual pagination
const paginate = async (model, query, options = {}) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 10;
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    model.find(query)
      .sort(options.sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(options.populate || ''),
    model.countDocuments(query)
  ]);
  
  return {
    docs: data,
    totalDocs: total,
    limit,
    page,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1,
    nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null
  };
};

// Create Training - SIMPLIFIED VERSION
exports.createTraining = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      type,
      instructor,
      duration,
      startDate,
      endDate,
      location,
      meetingLink,
      capacity,
      cost,
      prerequisites,
      learningObjectives,
      tags
    } = req.body;

    // Create training with frontend-compatible structure
    const training = await Training.create({
      title,
      description,
      category: category || 'Technical',
      type: type || 'Online',
      instructor: instructor || '',
      duration: parseInt(duration) || 0,
      startDate: startDate || new Date(),
      endDate: endDate || new Date(),
      location: location || 'Online',
      meetingLink: meetingLink || '',
      capacity: parseInt(capacity) || 0,
      cost: parseFloat(cost) || 0,
      prerequisites: prerequisites ? prerequisites.split(',').map(p => p.trim()) : [],
      learningObjectives: learningObjectives ? learningObjectives.split(',').map(o => o.trim()) : [],
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      status: 'published', // Set to published by default
      totalEnrollments: 0,
      averageRating: 0,
      enrolledEmployees: [],
      createdBy: req.user.id
    });

    sendResponse(res, 201, true, 'Training created successfully', training);
  } catch (error) {
    console.error('Create Training Error:', error);
    next(error);
  }
};

// Get All Trainings - FIXED FOR FRONTEND
exports.getAllTrainings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      type,
      search
    } = req.query;

    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (type) filter.type = type;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } }
      ];
    }

    // For employees, only show published trainings
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      filter.status = { $in: ['published', 'upcoming', 'ongoing'] };
    }

    const trainings = await paginate(Training, filter, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { startDate: -1 },
      populate: [
        { path: 'enrolledEmployees', select: 'firstName lastName email' },
        { path: 'createdBy', select: 'firstName lastName' }
      ]
    });
    
    sendResponse(res, 200, true, 'Trainings fetched successfully', trainings);
  } catch (error) {
    console.error('Get All Trainings Error:', error);
    next(error);
  }
};

// Get Training by ID
exports.getTrainingById = async (req, res, next) => {
  try {
    const training = await Training.findById(req.params.id)
      .populate('enrolledEmployees', 'firstName lastName email department position')
      .populate('createdBy', 'firstName lastName');

    if (!training) {
      return sendResponse(res, 404, false, 'Training not found');
    }

    sendResponse(res, 200, true, 'Training fetched successfully', training);
  } catch (error) {
    console.error('Get Training Error:', error);
    next(error);
  }
};

// Enroll in Training - FIXED FOR FRONTEND
exports.enrollInTraining = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee profile not found');
    }

    const training = await Training.findById(req.params.id);

    if (!training) {
      return sendResponse(res, 404, false, 'Training not found');
    }

    if (training.status !== 'published' && training.status !== 'upcoming') {
      return sendResponse(res, 400, false, 'Training is not available for enrollment');
    }

    // Check if already enrolled
    const existingEnrollment = training.enrolledEmployees.find(
      empId => empId.toString() === employee._id.toString()
    );

    if (existingEnrollment) {
      return sendResponse(res, 400, false, 'Already enrolled in this training');
    }

    // Check capacity
    if (training.capacity > 0 && training.enrolledEmployees.length >= training.capacity) {
      return sendResponse(res, 400, false, 'Training is full');
    }

    training.enrolledEmployees.push(employee._id);
    training.totalEnrollments = training.enrolledEmployees.length;
    await training.save();

    sendResponse(res, 200, true, 'Enrolled successfully', training);
  } catch (error) {
    console.error('Enroll Training Error:', error);
    next(error);
  }
};

// Get My Trainings - FIXED FOR FRONTEND
exports.getMyTrainings = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee profile not found');
    }
    
    const trainings = await Training.find({
      enrolledEmployees: employee._id
    })
    .select('title description type category status duration startDate endDate enrolledEmployees')
    .populate('enrolledEmployees', 'firstName lastName');

    // Format response for frontend
    const myTrainings = trainings.map(training => {
      const enrollment = training.enrolledEmployees.find(
        emp => emp._id.toString() === employee._id.toString()
      );
      
      return {
        _id: training._id,
        title: training.title,
        description: training.description,
        type: training.type,
        category: training.category,
        status: training.status,
        duration: training.duration,
        startDate: training.startDate,
        endDate: training.endDate,
        enrollmentStatus: 'enrolled', // Default status
        progress: 0, // Default progress
        completedAt: null
      };
    });

    sendResponse(res, 200, true, 'My trainings fetched successfully', myTrainings);
  } catch (error) {
    console.error('Get My Trainings Error:', error);
    next(error);
  }
};

// Update Training Progress
exports.updateProgress = async (req, res, next) => {
  try {
    const { progress } = req.body;
    const employee = await Employee.findOne({ userId: req.user.id });
    
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee profile not found');
    }

    const training = await Training.findById(req.params.id);

    if (!training) {
      return sendResponse(res, 404, false, 'Training not found');
    }

    // In a real implementation, you'd update progress in a separate progress collection
    // For now, we'll just return success
    sendResponse(res, 200, true, 'Progress updated successfully', { progress });
  } catch (error) {
    console.error('Update Progress Error:', error);
    next(error);
  }
};

// Submit Feedback
exports.submitFeedback = async (req, res, next) => {
  try {
    const { rating, comments } = req.body;
    const employee = await Employee.findOne({ userId: req.user.id });
    
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee profile not found');
    }

    const training = await Training.findById(req.params.id);

    if (!training) {
      return sendResponse(res, 404, false, 'Training not found');
    }

    // Add feedback logic here
    sendResponse(res, 200, true, 'Feedback submitted successfully');
  } catch (error) {
    console.error('Submit Feedback Error:', error);
    next(error);
  }
};

// Update Training
exports.updateTraining = async (req, res, next) => {
  try {
    const training = await Training.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!training) {
      return sendResponse(res, 404, false, 'Training not found');
    }

    sendResponse(res, 200, true, 'Training updated successfully', training);
  } catch (error) {
    console.error('Update Training Error:', error);
    next(error);
  }
};

// Delete Training
exports.deleteTraining = async (req, res, next) => {
  try {
    const training = await Training.findByIdAndDelete(req.params.id);

    if (!training) {
      return sendResponse(res, 404, false, 'Training not found');
    }

    sendResponse(res, 200, true, 'Training deleted successfully');
  } catch (error) {
    console.error('Delete Training Error:', error);
    next(error);
  }
};

// Get Training Analytics
exports.getTrainingAnalytics = async (req, res, next) => {
  try {
    const totalTrainings = await Training.countDocuments();
    const publishedTrainings = await Training.countDocuments({ status: 'published' });
    const upcomingTrainings = await Training.countDocuments({ status: 'upcoming' });
    const ongoingTrainings = await Training.countDocuments({ status: 'ongoing' });

    const enrollmentStats = await Training.aggregate([
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: '$totalEnrollments' },
          avgRating: { $avg: '$averageRating' }
        }
      }
    ]);

    const categoryStats = await Training.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          enrollments: { $sum: '$totalEnrollments' }
        }
      }
    ]);

    const stats = enrollmentStats[0] || {
      totalEnrollments: 0,
      avgRating: 0
    };

    const analytics = {
      overview: {
        totalTrainings,
        publishedTrainings,
        upcomingTrainings,
        ongoingTrainings,
        ...stats
      },
      byCategory: categoryStats
    };

    sendResponse(res, 200, true, 'Analytics fetched successfully', analytics);
  } catch (error) {
    console.error('Get Analytics Error:', error);
    next(error);
  }
};