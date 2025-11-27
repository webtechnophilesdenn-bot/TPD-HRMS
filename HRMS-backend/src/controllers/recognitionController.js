const Recognition = require('../models/Recognition');
const Employee = require('../models/Employee');
const { sendResponse } = require('../utils/responseHandler');

// Give Recognition
exports.giveRecognition = async (req, res, next) => {
  try {
    const {
      employee,
      title,
      description,
      type,
      category,
      points,
      badge,
      rewards,
      visibility,
      effectivePeriod,
      tags,
      criteria,
      impact
    } = req.body;

    // Validate employee exists
    const recipient = await Employee.findById(employee);
    if (!recipient) {
      return sendResponse(res, 404, false, 'Recipient employee not found');
    }

    // Get awarding employee
    const awardedBy = await Employee.findOne({ userId: req.user.id });
    if (!awardedBy) {
      return sendResponse(res, 404, false, 'Awarding user not found');
    }

    // Check for duplicate recognition for same period
    if (effectivePeriod?.month && effectivePeriod?.year) {
      const existingRecognition = await Recognition.findOne({
        employee,
        type,
        'effectivePeriod.month': effectivePeriod.month,
        'effectivePeriod.year': effectivePeriod.year,
        status: { $in: ['Approved', 'Published'] }
      });

      if (existingRecognition) {
        return sendResponse(res, 400, false, 
          `${type} already awarded to this employee for the selected period`);
      }
    }

    const recognition = await Recognition.create({
      employee,
      title,
      description,
      type,
      category,
      points: points || 0,
      badge,
      rewards,
      awardedBy: awardedBy._id,
      department: recipient.department,
      visibility: visibility || 'Public',
      effectivePeriod: {
        ...effectivePeriod,
        year: effectivePeriod?.year || new Date().getFullYear()
      },
      tags,
      criteria,
      impact,
      status: 'Pending Approval' // Default workflow status
    });

    // Populate for response
    await recognition.populate('employee', 'firstName lastName employeeId department designation profilePicture');
    await recognition.populate('awardedBy', 'firstName lastName employeeId');

    sendResponse(res, 201, true, 'Recognition created successfully', recognition);
  } catch (error) {
    next(error);
  }
};

// Get My Recognitions
exports.getMyRecognitions = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    const { 
      year, 
      type, 
      category, 
      status, 
      page = 1, 
      limit = 10 
    } = req.query;

    const filter = { employee: employee._id };
    
    if (year) filter['effectivePeriod.year'] = parseInt(year);
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;

    const recognitions = await Recognition.find(filter)
      .populate('employee', 'firstName lastName employeeId department designation profilePicture')
      .populate('awardedBy', 'firstName lastName employeeId profilePicture')
      .populate('approvedBy', 'firstName lastName employeeId')
      .sort({ awardedDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Recognition.countDocuments(filter);

    sendResponse(res, 200, true, 'Recognitions fetched successfully', {
      recognitions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    next(error);
  }
};

// Get All Recognitions (with role-based filtering)
// Get All Recognitions (with role-based filtering)
exports.getAllRecognitions = async (req, res, next) => {
  try {
    const {
      department,
      type,
      category,
      status,
      year,
      month,
      page = 1,
      limit = 10,
      sortBy = 'awardedDate',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    
    // Role-based filtering
    const userRole = req.user.role ? req.user.role.toLowerCase() : 'employee';
    const isPrivilegedUser = ['manager', 'hr', 'admin'].includes(userRole);
    
    // For normal employees: show only public recognitions (remove status filter for now)
    if (!isPrivilegedUser) {
      filter.visibility = 'Public';
      // Removed strict status filter to allow employees to see recognitions
    }
    
    if (department) filter.department = department;
    if (type) filter.type = type;
    if (category) filter.category = category;
    
    // Only privileged users can filter by status
    if (status && isPrivilegedUser) {
      filter.status = status;
    }
    
    if (year) filter['effectivePeriod.year'] = parseInt(year);
    if (month) filter['effectivePeriod.month'] = parseInt(month);

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const recognitions = await Recognition.find(filter)
      .populate('employee', 'firstName lastName employeeId department designation profilePicture')
      .populate('awardedBy', 'firstName lastName employeeId profilePicture')
      .populate('approvedBy', 'firstName lastName employeeId')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Recognition.countDocuments(filter);

    sendResponse(res, 200, true, 'All recognitions fetched successfully', {
      recognitions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    next(error);
  }
};


// Get Recognition by ID
exports.getRecognitionById = async (req, res, next) => {
  try {
    const recognition = await Recognition.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId department designation profilePicture email')
      .populate('awardedBy', 'firstName lastName employeeId profilePicture designation')
      .populate('approvedBy', 'firstName lastName employeeId')
      .populate('reactions.employee', 'firstName lastName employeeId profilePicture')
      .populate('comments.employee', 'firstName lastName employeeId profilePicture');

    if (!recognition) {
      return sendResponse(res, 404, false, 'Recognition not found');
    }

    // Increment views
    recognition.views += 1;
    await recognition.save();

    sendResponse(res, 200, true, 'Recognition fetched successfully', recognition);
  } catch (error) {
    next(error);
  }
};

// Update Recognition Status (Approve/Reject)
exports.updateRecognitionStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const { id } = req.params;

    const recognition = await Recognition.findById(id);
    if (!recognition) {
      return sendResponse(res, 404, false, 'Recognition not found');
    }

    const approver = await Employee.findOne({ userId: req.user.id });
    if (!approver) {
      return sendResponse(res, 404, false, 'Approver not found');
    }

    recognition.status = status;
    recognition.approvedBy = approver._id;
    recognition.approvedAt = new Date();

    if (status === 'Rejected') {
      recognition.rejectionReason = rejectionReason;
    }

    await recognition.save();
    await recognition.populate('approvedBy', 'firstName lastName employeeId');

    sendResponse(res, 200, true, `Recognition ${status.toLowerCase()} successfully`, recognition);
  } catch (error) {
    next(error);
  }
};

// Add Reaction to Recognition
exports.addReaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    const recognition = await Recognition.findById(id);
    if (!recognition) {
      return sendResponse(res, 404, false, 'Recognition not found');
    }

    // Remove existing reaction from same employee
    recognition.reactions = recognition.reactions.filter(
      reaction => !reaction.employee.equals(employee._id)
    );

    // Add new reaction
    recognition.reactions.push({
      employee: employee._id,
      type
    });

    await recognition.save();
    await recognition.populate('reactions.employee', 'firstName lastName employeeId profilePicture');

    sendResponse(res, 200, true, 'Reaction added successfully', recognition.reactions);
  } catch (error) {
    next(error);
  }
};

// Add Comment to Recognition
exports.addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    const recognition = await Recognition.findById(id);
    if (!recognition) {
      return sendResponse(res, 404, false, 'Recognition not found');
    }

    if (!recognition.allowComments) {
      return sendResponse(res, 400, false, 'Comments are disabled for this recognition');
    }

    recognition.comments.push({
      employee: employee._id,
      content
    });

    await recognition.save();
    await recognition.populate('comments.employee', 'firstName lastName employeeId profilePicture');

    sendResponse(res, 201, true, 'Comment added successfully', recognition.comments);
  } catch (error) {
    next(error);
  }
};

// Get Recognition Analytics
exports.getRecognitionAnalytics = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear(), department } = req.query;

    const matchStage = { 
      status: { $in: ['Approved', 'Published'] },
      'effectivePeriod.year': parseInt(year) 
    };

    if (department) {
      matchStage.department = department;
    }

    const analytics = await Recognition.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRecognitions: { $sum: 1 },
          totalPointsAwarded: { $sum: '$points' },
          totalMonetaryValue: { $sum: '$rewards.monetary.amount' },
          byType: { $push: '$type' },
          byCategory: { $push: '$category' },
          byDepartment: { $push: '$department' }
        }
      },
      {
        $project: {
          totalRecognitions: 1,
          totalPointsAwarded: 1,
          totalMonetaryValue: 1,
          typeDistribution: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: ['$byType', []] },
                as: 'type',
                in: {
                  k: '$$type',
                  v: {
                    $size: {
                      $filter: {
                        input: '$byType',
                        as: 't',
                        cond: { $eq: ['$$t', '$$type'] }
                      }
                    }
                  }
                }
              }
            }
          },
          categoryDistribution: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: ['$byCategory', []] },
                as: 'category',
                in: {
                  k: '$$category',
                  v: {
                    $size: {
                      $filter: {
                        input: '$byCategory',
                        as: 'c',
                        cond: { $eq: ['$$c', '$$category'] }
                      }
                    }
                  }
                }
              }
            }
          },
          departmentDistribution: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: ['$byDepartment', []] },
                as: 'dept',
                in: {
                  k: '$$dept',
                  v: {
                    $size: {
                      $filter: {
                        input: '$byDepartment',
                        as: 'd',
                        cond: { $eq: ['$$d', '$$dept'] }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]);

    // Get top recognized employees
    const topEmployees = await Recognition.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$employee',
          recognitionCount: { $sum: 1 },
          totalPoints: { $sum: '$points' }
        }
      },
      { $sort: { recognitionCount: -1, totalPoints: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $project: {
          employee: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            employeeId: 1,
            department: 1,
            designation: 1,
            profilePicture: 1
          },
          recognitionCount: 1,
          totalPoints: 1
        }
      }
    ]);

    const result = {
      overview: analytics[0] || {
        totalRecognitions: 0,
        totalPointsAwarded: 0,
        totalMonetaryValue: 0,
        typeDistribution: {},
        categoryDistribution: {},
        departmentDistribution: {}
      },
      topEmployees,
      timeframe: {
        year: parseInt(year),
        department: department || 'All'
      }
    };

    sendResponse(res, 200, true, 'Analytics fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

// Get Employee Recognition Summary
exports.getEmployeeRecognitionSummary = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { year = new Date().getFullYear() } = req.query;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    const summary = await Recognition.aggregate([
      {
        $match: {
          employee: employee._id,
          status: { $in: ['Approved', 'Published'] },
          'effectivePeriod.year': parseInt(year)
        }
      },
      {
        $group: {
          _id: '$employee',
          totalRecognitions: { $sum: 1 },
          totalPoints: { $sum: '$points' },
          recognitionsByType: {
            $push: {
              type: '$type',
              points: '$points',
              awardedDate: '$awardedDate'
            }
          }
        }
      },
      {
        $project: {
          totalRecognitions: 1,
          totalPoints: 1,
          typeBreakdown: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: ['$recognitionsByType.type', []] },
                as: 'type',
                in: {
                  k: '$$type',
                  v: {
                    count: {
                      $size: {
                        $filter: {
                          input: '$recognitionsByType',
                          as: 'r',
                          cond: { $eq: ['$$r.type', '$$type'] }
                        }
                      }
                    },
                    points: {
                      $sum: {
                        $map: {
                          input: {
                            $filter: {
                              input: '$recognitionsByType',
                              as: 'r',
                              cond: { $eq: ['$$r.type', '$$type'] }
                            }
                          },
                          as: 'r',
                          in: '$$r.points'
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          recentRecognitions: {
            $slice: [
              {
                $map: {
                  input: '$recognitionsByType',
                  as: 'r',
                  in: {
                    type: '$$r.type',
                    points: '$$r.points',
                    awardedDate: '$$r.awardedDate'
                  }
                }
              },
              5
            ]
          }
        }
      }
    ]);

    const result = summary[0] || {
      totalRecognitions: 0,
      totalPoints: 0,
      typeBreakdown: {},
      recentRecognitions: []
    };

    sendResponse(res, 200, true, 'Employee recognition summary fetched successfully', {
      employee: {
        _id: employee._id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeId: employee.employeeId,
        department: employee.department,
        designation: employee.designation
      },
      summary: result,
      year: parseInt(year)
    });
  } catch (error) {
    next(error);
  }
};


