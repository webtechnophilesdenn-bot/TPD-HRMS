// controllers/salaryStructureController.js (create if doesn't exist)
const SalaryStructure = require('../models/SalaryStructure');
const Employee = require('../models/Employee');
const { sendResponse } = require('../utils/responseHandler');

// Create salary structures for all employees without one
exports.createMissingSalaryStructures = async (req, res, next) => {
  try {
    const { effectiveFrom = new Date() } = req.body;

    // Find all active employees without salary structure
    const employees = await Employee.find({
      status: { $in: ['Active', 'On Leave'] },
      $or: [
        { currentSalaryStructure: null },
        { currentSalaryStructure: { $exists: false } }
      ]
    }).select('_id firstName lastName employeeId basicSalary');

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
        const basicSalary = employee.basicSalary || 0;

        if (basicSalary === 0) {
          failed.push({
            employeeId: employee.employeeId,
            name: `${employee.firstName} ${employee.lastName}`,
            error: 'Basic salary is not set. Please update employee basic salary first.'
          });
          continue;
        }

        // Create salary structure with proper calculations
        const salaryStructure = await SalaryStructure.create({
          employee: employee._id,
          effectiveFrom: effectiveFrom,
          isActive: true,
          earnings: {
            basic: basicSalary,
            hraPercentage: 40, // 40% of basic
            hra: Math.round((basicSalary * 40) / 100),
            specialAllowance: Math.round(basicSalary * 0.2), // 20% of basic
            conveyance: 1600,
            medicalAllowance: 1250,
            educationAllowance: 0,
            lta: 0,
            otherAllowances: 0
          },
          deductions: {
            pf: {
              applicable: true,
              employeePercentage: 12,
              employerPercentage: 12,
              employeeContribution: Math.round((Math.min(basicSalary, 15000) * 12) / 100),
              employerContribution: Math.round((Math.min(basicSalary, 15000) * 12) / 100)
            },
            esi: {
              applicable: basicSalary <= 21000,
              employeePercentage: 0.75,
              employerPercentage: 3.25,
              employeeContribution: basicSalary <= 21000 ? Math.round((basicSalary * 0.75) / 100) : 0,
              employerContribution: basicSalary <= 21000 ? Math.round((basicSalary * 3.25) / 100) : 0
            },
            professionalTax: {
              applicable: true,
              amount: 200
            },
            tds: {
              applicable: true,
              regime: 'new',
              monthlyTDS: 0 // Will be calculated based on annual income
            }
          },
          createdBy: req.user._id
        });

        // Calculate summary
        const grossSalary = 
          salaryStructure.earnings.basic +
          salaryStructure.earnings.hra +
          salaryStructure.earnings.specialAllowance +
          salaryStructure.earnings.conveyance +
          salaryStructure.earnings.medicalAllowance;

        const totalDeductions = 
          salaryStructure.deductions.pf.employeeContribution +
          salaryStructure.deductions.esi.employeeContribution +
          salaryStructure.deductions.professionalTax.amount;

        salaryStructure.summary = {
          grossSalary: Math.round(grossSalary),
          totalDeductions: Math.round(totalDeductions),
          netSalary: Math.round(grossSalary - totalDeductions),
          costToCompany: Math.round(
            grossSalary + 
            salaryStructure.deductions.pf.employerContribution +
            salaryStructure.deductions.esi.employerContribution
          )
        };

        await salaryStructure.save();

        // Update employee reference
        employee.currentSalaryStructure = salaryStructure._id;
        await employee.save();

        created.push({
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          salaryStructureId: salaryStructure._id,
          grossSalary: salaryStructure.summary.grossSalary
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

    sendResponse(res, 201, true, 'Salary structures created', {
      summary: {
        total: employees.length,
        created: created.length,
        failed: failed.length
      },
      created,
      failed
    });

  } catch (error) {
    console.error('Error in createMissingSalaryStructures:', error);
    next(error);
  }
};

// Get employees without salary structure
exports.getEmployeesWithoutSalaryStructure = async (req, res, next) => {
  try {
    const employees = await Employee.find({
      status: { $in: ['Active', 'On Leave'] },
      $or: [
        { currentSalaryStructure: null },
        { currentSalaryStructure: { $exists: false } }
      ]
    })
    .select('employeeId firstName lastName basicSalary department designation')
    .populate('department', 'name')
    .populate('designation', 'title');

    sendResponse(res, 200, true, 'Employees without salary structure', {
      count: employees.length,
      employees
    });

  } catch (error) {
    console.error('Error in getEmployeesWithoutSalaryStructure:', error);
    next(error);
  }
};

module.exports = {
  createMissingSalaryStructures,
  getEmployeesWithoutSalaryStructure
};
