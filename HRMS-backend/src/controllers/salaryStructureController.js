// controllers/salaryStructureController.js
const SalaryStructure = require('../models/SalaryStructure');
const Employee = require('../models/Employee');
const Designation = require('../models/Designation');
const { sendResponse } = require('../utils/responseHandler');

// ==================== EXISTING FUNCTIONS (ENHANCED) ====================

/**
 * @desc    Create salary structures for all employees without one
 * @route   POST /api/salary-structure/create-missing
 * @access  Private (HR, Admin)
 */
exports.createMissingSalaryStructures = async (req, res, next) => {
  try {
    const { effectiveFrom = new Date(), useDesignationDefaults = true } = req.body;

    // Find all active employees without salary structure
    const employees = await Employee.find({
      status: { $in: ['Active', 'On Leave'] },
      isActive: true,
      $or: [
        { currentSalaryStructure: null },
        { currentSalaryStructure: { $exists: false } }
      ]
    })
    .populate('designation')
    .select('_id firstName lastName employeeId basicSalary ctc designation');

    if (employees.length === 0) {
      return sendResponse(res, 200, true, 'All employees already have salary structures', {
        created: 0,
        skipped: 0
      });
    }

    const created = [];
    const failed = [];

    for (const employee of employees) {
      try {
        let salaryStructure;

        // If useDesignationDefaults is true and employee has designation
        if (useDesignationDefaults && employee.designation) {
          const ctc = employee.ctc || employee.basicSalary * 2.5 || 300000;
          
          // Validate CTC against designation range
          const validation = employee.designation.isValidCTC(ctc);
          if (!validation.valid) {
            failed.push({
              employeeId: employee.employeeId,
              name: `${employee.firstName} ${employee.lastName}`,
              error: validation.message
            });
            continue;
          }

          // Create using designation defaults
          salaryStructure = await SalaryStructure.createFromDesignation(
            employee._id,
            employee.designation._id,
            ctc,
            effectiveFrom
          );
        } else {
          // Create using basic salary (legacy method)
          const basicSalary = employee.basicSalary || employee.ctc * 0.4 || 0;

          if (basicSalary === 0) {
            failed.push({
              employeeId: employee.employeeId,
              name: `${employee.firstName} ${employee.lastName}`,
              error: 'Basic salary/CTC is not set. Please update employee salary first.'
            });
            continue;
          }

          // Calculate components
          const hra = Math.round((basicSalary * 40) / 100);
          const specialAllowance = Math.round(basicSalary * 0.2);
          const conveyance = 1600;
          const medicalAllowance = 1250;

          const grossSalary = basicSalary + hra + specialAllowance + conveyance + medicalAllowance;

          // PF calculation
          const pfBase = Math.min(basicSalary, 15000);
          const pfEmployee = Math.round((pfBase * 12) / 100);
          const pfEmployer = Math.round((pfBase * 12) / 100);

          // ESI calculation
          const esiApplicable = grossSalary <= 21000;
          const esiEmployee = esiApplicable ? Math.round((grossSalary * 0.75) / 100) : 0;
          const esiEmployer = esiApplicable ? Math.round((grossSalary * 3.25) / 100) : 0;

          const professionalTax = 200;
          const totalDeductions = pfEmployee + esiEmployee + professionalTax;
          const netSalary = grossSalary - totalDeductions;
          const ctc = grossSalary + pfEmployer + esiEmployer;

          salaryStructure = await SalaryStructure.create({
            employee: employee._id,
            effectiveFrom: effectiveFrom,
            isActive: true,
            earnings: {
              basic: basicSalary,
              hraPercentage: 40,
              hra: hra,
              specialAllowance: specialAllowance,
              conveyance: conveyance,
              medicalAllowance: medicalAllowance,
              educationAllowance: 0,
              lta: 0,
              da: 0,
              performanceBonus: 0,
              otherAllowances: 0,
              overtime: {
                enabled: employee.designation?.benefits?.overtimeEligible || false,
                hourlyRate: 0
              }
            },
            deductions: {
              pf: {
                applicable: true,
                employeePercentage: 12,
                employerPercentage: 12,
                employeeContribution: pfEmployee,
                employerContribution: pfEmployer,
                maxWageLimit: 15000
              },
              esi: {
                applicable: esiApplicable,
                employeePercentage: 0.75,
                employerPercentage: 3.25,
                employeeContribution: esiEmployee,
                employerContribution: esiEmployer,
                maxWageLimit: 21000
              },
              professionalTax: {
                applicable: true,
                amount: professionalTax
              },
              tds: {
                applicable: netSalary * 12 > 300000,
                regime: 'New',
                monthlyTDS: 0
              },
              lwf: {
                applicable: false,
                employeeContribution: 0,
                employerContribution: 0
              }
            },
            summary: {
              grossSalary: Math.round(grossSalary),
              totalDeductions: Math.round(totalDeductions),
              netSalary: Math.round(netSalary),
              costToCompany: Math.round(ctc),
              takeHome: Math.round(netSalary),
              annualCTC: Math.round(ctc * 12)
            },
            createdBy: req.user._id
          });
        }

        // Update employee reference
        employee.currentSalaryStructure = salaryStructure._id;
        if (!employee.ctc) {
          employee.ctc = salaryStructure.summary.costToCompany;
        }
        if (!employee.basicSalary) {
          employee.basicSalary = salaryStructure.earnings.basic;
        }
        await employee.save();

        created.push({
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          designation: employee.designation?.title,
          salaryStructureId: salaryStructure._id,
          grossSalary: salaryStructure.summary.grossSalary,
          netSalary: salaryStructure.summary.netSalary,
          ctc: salaryStructure.summary.costToCompany
        });

      } catch (error) {
        console.error(`Error creating salary structure for ${employee.employeeId}:`, error);
        failed.push({
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          error: error.message
        });
      }
    }

    return sendResponse(res, 201, true, 'Salary structures creation completed', {
      summary: {
        total: employees.length,
        created: created.length,
        failed: failed.length,
        totalGrossSalary: created.reduce((sum, emp) => sum + emp.grossSalary, 0),
        totalNetSalary: created.reduce((sum, emp) => sum + emp.netSalary, 0)
      },
      created,
      failed
    });

  } catch (error) {
    console.error('Error in createMissingSalaryStructures:', error);
    next(error);
  }
};

/**
 * @desc    Get employees without salary structure
 * @route   GET /api/salary-structure/missing
 * @access  Private (HR, Admin)
 */
exports.getEmployeesWithoutSalaryStructure = async (req, res, next) => {
  try {
    const employees = await Employee.find({
      status: { $in: ['Active', 'On Leave'] },
      isActive: true,
      $or: [
        { currentSalaryStructure: null },
        { currentSalaryStructure: { $exists: false } }
      ]
    })
    .select('employeeId firstName lastName basicSalary ctc department designation joiningDate')
    .populate('department', 'name')
    .populate('designation', 'title level salaryRange');

    const employeesWithDetails = employees.map(emp => ({
      _id: emp._id,
      employeeId: emp.employeeId,
      name: `${emp.firstName} ${emp.lastName}`,
      department: emp.department?.name,
      designation: emp.designation?.title,
      designationLevel: emp.designation?.level,
      basicSalary: emp.basicSalary || 0,
      ctc: emp.ctc || 0,
      joiningDate: emp.joiningDate,
      suggestedCTC: emp.designation?.salaryRange?.minimum || 300000,
      salaryRange: emp.designation?.salaryRange || null,
      canCreateFromDesignation: !!emp.designation
    }));

    return sendResponse(res, 200, true, 'Employees without salary structure retrieved', {
      count: employees.length,
      employees: employeesWithDetails
    });

  } catch (error) {
    console.error('Error in getEmployeesWithoutSalaryStructure:', error);
    next(error);
  }
};

// ==================== NEW DESIGNATION-BASED FUNCTIONS ====================

/**
 * @desc    Create salary structure from designation template
 * @route   POST /api/salary-structure/from-designation
 * @access  Private (HR, Admin)
 */
exports.createFromDesignation = async (req, res, next) => {
  try {
    const { employeeId, ctc, effectiveFrom } = req.body;

    if (!employeeId || !ctc) {
      return sendResponse(res, 400, false, 'Employee ID and CTC are required');
    }

    // Get employee
    const employee = await Employee.findOne({ employeeId })
      .populate('designation')
      .populate('department');

    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    if (!employee.designation) {
      return sendResponse(res, 400, false, 'Employee has no designation assigned. Please assign a designation first.');
    }

    // Deactivate existing active structure
    const existingStructure = await SalaryStructure.findOne({
      employee: employee._id,
      isActive: true
    });

    if (existingStructure) {
      await existingStructure.deactivate(effectiveFrom || new Date());
    }

    // Create new structure from designation
    const salaryStructure = await SalaryStructure.createFromDesignation(
      employee._id,
      employee.designation._id,
      ctc,
      effectiveFrom
    );

    // Update employee record
    employee.currentSalaryStructure = salaryStructure._id;
    employee.ctc = ctc;
    employee.basicSalary = salaryStructure.earnings.basic;
    await employee.save();

    return sendResponse(res, 201, true, 'Salary structure created successfully', {
      salaryStructure,
      employee: {
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`,
        designation: employee.designation.title,
        department: employee.department?.name
      },
      designationInfo: {
        title: employee.designation.title,
        level: employee.designation.level,
        salaryRange: employee.designation.salaryRange,
        benefits: employee.designation.benefits
      }
    });

  } catch (error) {
    console.error('Create salary structure from designation error:', error);
    next(error);
  }
};

/**
 * @desc    Get designation salary configuration
 * @route   GET /api/salary-structure/designation-config/:designationId
 * @access  Private (HR, Admin)
 */
exports.getDesignationConfig = async (req, res, next) => {
  try {
    const designation = await Designation.findById(req.params.designationId)
      .populate('department', 'name');

    if (!designation) {
      return sendResponse(res, 404, false, 'Designation not found');
    }

    // Sample CTC calculation
    const sampleCTC = designation.salaryRange?.minimum || 300000;
    const sampleStructure = designation.generateDefaultSalaryStructure(sampleCTC);

    // Calculate sample totals
    const sampleGross = 
      sampleStructure.basic +
      sampleStructure.hra +
      sampleStructure.da +
      sampleStructure.specialAllowance +
      sampleStructure.conveyance +
      sampleStructure.medicalAllowance;

    const pfEmployee = Math.round((Math.min(sampleStructure.basic, 15000) * 12) / 100);
    const esiEmployee = sampleGross <= 21000 ? Math.round((sampleGross * 0.75) / 100) : 0;
    const pt = 200;
    const sampleDeductions = pfEmployee + esiEmployee + pt;
    const sampleNet = sampleGross - sampleDeductions;

    return sendResponse(res, 200, true, 'Designation configuration retrieved', {
      designation: {
        _id: designation._id,
        title: designation.title,
        level: designation.level,
        department: designation.department?.name,
        salaryRange: designation.salaryRange,
        defaultComponents: designation.defaultSalaryComponents,
        benefits: designation.benefits,
        statutory: designation.statutoryConfig
      },
      sampleBreakdown: {
        ctc: sampleCTC,
        earnings: sampleStructure,
        grossSalary: sampleGross,
        deductions: {
          pfEmployee,
          esiEmployee,
          professionalTax: pt,
          total: sampleDeductions
        },
        netSalary: sampleNet,
        note: 'This is a sample breakdown based on minimum CTC for this designation'
      }
    });

  } catch (error) {
    console.error('Get designation config error:', error);
    next(error);
  }
};

/**
 * @desc    Validate CTC for designation
 * @route   POST /api/salary-structure/validate-ctc
 * @access  Private (HR, Admin)
 */
exports.validateCTC = async (req, res, next) => {
  try {
    const { designationId, ctc } = req.body;

    if (!designationId || !ctc) {
      return sendResponse(res, 400, false, 'Designation ID and CTC are required');
    }

    const designation = await Designation.findById(designationId);

    if (!designation) {
      return sendResponse(res, 404, false, 'Designation not found');
    }

    const validation = designation.isValidCTC(ctc);

    if (!validation.valid) {
      return sendResponse(res, 400, false, validation.message, {
        ctc,
        salaryRange: designation.salaryRange,
        isValid: false
      });
    }

    const breakdown = designation.generateDefaultSalaryStructure(ctc);

    // Calculate full breakdown
    const grossSalary = 
      breakdown.basic +
      breakdown.hra +
      breakdown.da +
      breakdown.specialAllowance +
      breakdown.conveyance +
      breakdown.medicalAllowance;

    const pfEmployee = Math.round((Math.min(breakdown.basic, 15000) * 12) / 100);
    const pfEmployer = Math.round((Math.min(breakdown.basic, 15000) * 12) / 100);
    const esiApplicable = grossSalary <= 21000;
    const esiEmployee = esiApplicable ? Math.round((grossSalary * 0.75) / 100) : 0;
    const esiEmployer = esiApplicable ? Math.round((grossSalary * 3.25) / 100) : 0;
    const pt = 200;
    const totalDeductions = pfEmployee + esiEmployee + pt;
    const netSalary = grossSalary - totalDeductions;
    const calculatedCTC = grossSalary + pfEmployer + esiEmployer;

    return sendResponse(res, 200, true, 'CTC is valid for this designation', {
      isValid: true,
      ctc,
      designation: {
        title: designation.title,
        level: designation.level,
        salaryRange: designation.salaryRange
      },
      breakdown: {
        earnings: breakdown,
        grossSalary,
        deductions: {
          pfEmployee,
          pfEmployer,
          esiEmployee,
          esiEmployer,
          professionalTax: pt,
          total: totalDeductions
        },
        netSalary,
        calculatedCTC,
        takeHome: netSalary,
        annualCTC: calculatedCTC * 12
      }
    });

  } catch (error) {
    console.error('Validate CTC error:', error);
    next(error);
  }
};

/**
 * @desc    Bulk create salary structures for department/designation
 * @route   POST /api/salary-structure/bulk-create
 * @access  Private (HR, Admin)
 */
exports.bulkCreateByDesignation = async (req, res, next) => {
  try {
    const { employees, effectiveFrom } = req.body;
    // employees: [{ employeeId, ctc }, ...]

    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return sendResponse(res, 400, false, 'Employees array with at least one employee is required');
    }

    const results = {
      success: [],
      failed: []
    };

    for (const emp of employees) {
      try {
        if (!emp.employeeId || !emp.ctc) {
          results.failed.push({
            employeeId: emp.employeeId || 'unknown',
            error: 'Employee ID and CTC are required'
          });
          continue;
        }

        const employee = await Employee.findOne({ employeeId: emp.employeeId })
          .populate('designation')
          .populate('department');

        if (!employee) {
          results.failed.push({
            employeeId: emp.employeeId,
            error: 'Employee not found'
          });
          continue;
        }

        if (!employee.designation) {
          results.failed.push({
            employeeId: emp.employeeId,
            name: `${employee.firstName} ${employee.lastName}`,
            error: 'No designation assigned'
          });
          continue;
        }

        // Validate CTC
        const validation = employee.designation.isValidCTC(emp.ctc);
        if (!validation.valid) {
          results.failed.push({
            employeeId: emp.employeeId,
            name: `${employee.firstName} ${employee.lastName}`,
            error: validation.message
          });
          continue;
        }

        // Deactivate existing
        const existing = await SalaryStructure.findOne({
          employee: employee._id,
          isActive: true
        });

        if (existing) {
          await existing.deactivate(effectiveFrom || new Date());
        }

        // Create new
        const salaryStructure = await SalaryStructure.createFromDesignation(
          employee._id,
          employee.designation._id,
          emp.ctc,
          effectiveFrom
        );

        // Update employee
        employee.currentSalaryStructure = salaryStructure._id;
        employee.ctc = emp.ctc;
        employee.basicSalary = salaryStructure.earnings.basic;
        await employee.save();

        results.success.push({
          employeeId: emp.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          designation: employee.designation.title,
          department: employee.department?.name,
          ctc: emp.ctc,
          grossSalary: salaryStructure.summary.grossSalary,
          netSalary: salaryStructure.summary.netSalary,
          salaryStructureId: salaryStructure._id
        });

      } catch (error) {
        console.error(`Error processing ${emp.employeeId}:`, error);
        results.failed.push({
          employeeId: emp.employeeId,
          error: error.message
        });
      }
    }

    return sendResponse(res, 201, true, 'Bulk salary structure creation completed', {
      summary: {
        total: employees.length,
        success: results.success.length,
        failed: results.failed.length,
        totalCTC: results.success.reduce((sum, emp) => sum + emp.ctc, 0),
        totalNetSalary: results.success.reduce((sum, emp) => sum + emp.netSalary, 0)
      },
      details: results
    });

  } catch (error) {
    console.error('Bulk create salary structures error:', error);
    next(error);
  }
};

/**
 * @desc    Get all salary structures with filters
 * @route   GET /api/salary-structure
 * @access  Private (HR, Admin, Finance)
 */
exports.getAllSalaryStructures = async (req, res, next) => {
  try {
    const { 
      department, 
      designation, 
      isActive, 
      page = 1, 
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Get employees based on filters
    const employeeFilter = {};
    if (department) employeeFilter.department = department;
    if (designation) employeeFilter.designation = designation;

    let employeeIds;
    if (Object.keys(employeeFilter).length > 0) {
      const employees = await Employee.find(employeeFilter).select('_id');
      employeeIds = employees.map(e => e._id);
      filter.employee = { $in: employeeIds };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const salaryStructures = await SalaryStructure.find(filter)
      .populate({
        path: 'employee',
        select: 'employeeId firstName lastName department designation',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'designation', select: 'title level' }
        ]
      })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SalaryStructure.countDocuments(filter);

    return sendResponse(res, 200, true, 'Salary structures retrieved successfully', {
      salaryStructures,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get all salary structures error:', error);
    next(error);
  }
};

/**
 * @desc    Update salary structure
 * @route   PATCH /api/salary-structure/:id
 * @access  Private (HR, Admin)
 */
exports.updateSalaryStructure = async (req, res, next) => {
  try {
    const { earnings, deductions, remarks } = req.body;

    const salaryStructure = await SalaryStructure.findById(req.params.id)
      .populate('employee', 'employeeId firstName lastName');

    if (!salaryStructure) {
      return sendResponse(res, 404, false, 'Salary structure not found');
    }

    if (!salaryStructure.isActive) {
      return sendResponse(res, 400, false, 'Cannot update inactive salary structure');
    }

    // Update earnings if provided
    if (earnings) {
      salaryStructure.earnings = { ...salaryStructure.earnings, ...earnings };
    }

    // Update deductions if provided
    if (deductions) {
      salaryStructure.deductions = { ...salaryStructure.deductions, ...deductions };
    }

    if (remarks) {
      salaryStructure.remarks = remarks;
    }

    salaryStructure.updatedBy = req.user._id;
    salaryStructure.revisionNumber = (salaryStructure.revisionNumber || 1) + 1;

    // Recalculate
    salaryStructure.calculateSalary();
    await salaryStructure.save();

    // Update employee CTC
    const employee = await Employee.findById(salaryStructure.employee._id);
    if (employee) {
      employee.ctc = salaryStructure.summary.costToCompany;
      employee.basicSalary = salaryStructure.earnings.basic;
      await employee.save();
    }

    return sendResponse(res, 200, true, 'Salary structure updated successfully', {
      salaryStructure
    });

  } catch (error) {
    console.error('Update salary structure error:', error);
    next(error);
  }
};

/**
 * @desc    Get salary structure by ID
 * @route   GET /api/salary-structure/:id
 * @access  Private (HR, Admin, Finance)
 */
exports.getSalaryStructureById = async (req, res, next) => {
  try {
    const salaryStructure = await SalaryStructure.findById(req.params.id)
      .populate({
        path: 'employee',
        select: 'employeeId firstName lastName department designation',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'designation', select: 'title level salaryRange' }
        ]
      })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!salaryStructure) {
      return sendResponse(res, 404, false, 'Salary structure not found');
    }

    return sendResponse(res, 200, true, 'Salary structure retrieved successfully', {
      salaryStructure
    });

  } catch (error) {
    console.error('Get salary structure error:', error);
    next(error);
  }
};

/**
 * @desc    Deactivate salary structure
 * @route   PATCH /api/salary-structure/:id/deactivate
 * @access  Private (HR, Admin)
 */
exports.deactivateSalaryStructure = async (req, res, next) => {
  try {
    const { effectiveTo } = req.body;

    const salaryStructure = await SalaryStructure.findById(req.params.id);

    if (!salaryStructure) {
      return sendResponse(res, 404, false, 'Salary structure not found');
    }

    if (!salaryStructure.isActive) {
      return sendResponse(res, 400, false, 'Salary structure is already inactive');
    }

    await salaryStructure.deactivate(effectiveTo);

    return sendResponse(res, 200, true, 'Salary structure deactivated successfully', {
      salaryStructure
    });

  } catch (error) {
    console.error('Deactivate salary structure error:', error);
    next(error);
  }
};

module.exports = {
  // Existing functions
  createMissingSalaryStructures,
  getEmployeesWithoutSalaryStructure,
  
  // New designation-based functions
  createFromDesignation,
  getDesignationConfig,
  validateCTC,
  bulkCreateByDesignation,
  
  // CRUD operations
  getAllSalaryStructures,
  getSalaryStructureById,
  updateSalaryStructure,
  deactivateSalaryStructure
};
