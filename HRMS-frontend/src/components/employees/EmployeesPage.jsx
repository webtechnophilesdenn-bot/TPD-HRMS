import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { apiService } from "../../services/apiService";

const EmployeesPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filters, setFilters] = useState({
    department: "",
    status: "",
    employmentType: "",
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await apiService.getAllEmployees();
      const employeesData = Array.isArray(response.data) ? response.data : [];
      setEmployees(employeesData);
      setLoading(false);
    } catch (error) {
      showError("Failed to load employees");
      setEmployees([]);
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm("Are you sure you want to terminate this employee?")) {
      try {
        await apiService.updateEmployee(employeeId, {
          status: "Terminated",
          exitDate: new Date(),
        });
        showSuccess("Employee terminated successfully");
        loadEmployees();
      } catch (error) {
        showError("Failed to terminate employee");
      }
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.personalEmail?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      !filters.department || emp.department?._id === filters.department;
    const matchesStatus = !filters.status || emp.status === filters.status;
    const matchesEmploymentType =
      !filters.employmentType || emp.employmentType === filters.employmentType;

    return (
      matchesSearch &&
      matchesDepartment &&
      matchesStatus &&
      matchesEmploymentType
    );
  });

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        {(user?.role === "hr" || user?.role === "admin") && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filters.department}
            onChange={(e) =>
              setFilters({ ...filters, department: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Departments</option>
            <option value="it">IT</option>
            <option value="hr">HR</option>
            <option value="finance">Finance</option>
            <option value="sales">Sales</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Resigned">Resigned</option>
            <option value="Terminated">Terminated</option>
          </select>

          <select
            value={filters.employmentType}
            onChange={(e) =>
              setFilters({ ...filters, employmentType: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Contract">Contract</option>
            <option value="Intern">Intern</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employee.employeeId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {employee.personalEmail}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.department?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.designation?.title || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.employmentType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        employee.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : employee.status === "On Leave"
                          ? "bg-blue-100 text-blue-800"
                          : employee.status === "Resigned"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedEmployee(employee)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {(user?.role === "hr" || user?.role === "admin") && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowEditModal(true);
                            }}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit Employee"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          {employee.status !== "Terminated" && (
                            <button
                              onClick={() => handleDeleteEmployee(employee._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Terminate Employee"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No employees found matching your criteria.
            </p>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <EmployeeFormModal
          mode="add"
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadEmployees();
          }}
        />
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <EmployeeFormModal
          mode="edit"
          employee={selectedEmployee}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEmployee(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedEmployee(null);
            loadEmployees();
          }}
        />
      )}

      {/* View Employee Modal */}
      {selectedEmployee && !showEditModal && (
        <EmployeeDetailsModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onEdit={() => {
            setShowEditModal(true);
          }}
        />
      )}
    </div>
  );
};

// Employee Form Modal Component
const EmployeeFormModal = ({ mode, employee, onClose, onSuccess }) => {
  const { showSuccess, showError } = useNotification();
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: employee?.firstName || "",
    lastName: employee?.lastName || "",
    employeeId: employee?.employeeId || "",
    personalEmail: employee?.personalEmail || "",
    phone: employee?.phone || "",
    dateOfBirth: employee?.dateOfBirth
      ? new Date(employee.dateOfBirth).toISOString().split("T")[0]
      : "",
    gender: employee?.gender || "",
    department: employee?.department?._id || "",
    designation: employee?.designation?._id || "",
    joiningDate: employee?.joiningDate
      ? new Date(employee.joiningDate).toISOString().split("T")[0]
      : "",
    employmentType: employee?.employmentType || "Full-Time",
    ctc: employee?.ctc || "",
    workLocation: employee?.workLocation || "",
    address: {
      street: employee?.address?.street || "",
      city: employee?.address?.city || "",
      state: employee?.address?.state || "",
      zipCode: employee?.address?.zipCode || "",
    },
  });

  // Load departments and designations
  useEffect(() => {
    loadDepartmentsAndDesignations();
  }, []);

  const loadDepartmentsAndDesignations = async () => {
    try {
      // You'll need to create these API endpoints or use mock data
      setDepartments([
        { _id: "65a1b2c3d4e5f6a7b8c9d0e1", name: "IT" },
        { _id: "65a1b2c3d4e5f6a7b8c9d0e2", name: "HR" },
        { _id: "65a1b2c3d4e5f6a7b8c9d0e3", name: "Finance" },
        { _id: "65a1b2c3d4e5f6a7b8c9d0e4", name: "Sales" },
        { _id: "65a1b2c3d4e5f6a7b8c9d0e5", name: "Marketing" },
      ]);

      setDesignations([
        { _id: "65b1c2d3e4f5g6h7i8j9k0l1", title: "Software Engineer" },
        { _id: "65b1c2d3e4f5g6h7i8j9k0l2", title: "Senior Software Engineer" },
        { _id: "65b1c2d3e4f5g6h7i8j9k0l3", title: "HR Manager" },
        { _id: "65b1c2d3e4f5g6h7i8j9k0l4", title: "Finance Analyst" },
        { _id: "65b1c2d3e4f5g6h7i8j9k0l5", title: "Sales Executive" },
      ]);
    } catch (error) {
      console.error("Failed to load departments and designations");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Prepare data - remove empty values for department and designation
      const submitData = { ...formData };

      if (!submitData.department) {
        delete submitData.department;
      }
      if (!submitData.designation) {
        delete submitData.designation;
      }

      if (mode === "add") {
        await apiService.createEmployee(submitData);
        showSuccess("Employee added successfully");
      } else {
        await apiService.updateEmployee(employee._id, submitData);
        showSuccess("Employee updated successfully");
      }
      onSuccess();
    } catch (error) {
      showError(error.message || `Failed to ${mode} employee`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {mode === "add" ? "Add New Employee" : "Edit Employee"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee ID *
            </label>
            <input
              type="text"
              value={formData.employeeId}
              onChange={(e) =>
                setFormData({ ...formData, employeeId: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={mode === "edit"}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personal Email *
            </label>
            <input
              type="email"
              value={formData.personalEmail}
              onChange={(e) =>
                setFormData({ ...formData, personalEmail: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Designation
            </label>
            <select
              value={formData.designation}
              onChange={(e) =>
                setFormData({ ...formData, designation: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Designation</option>
              {designations.map((designation) => (
                <option key={designation._id} value={designation._id}>
                  {designation.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Joining Date *
            </label>
            <input
              type="date"
              value={formData.joiningDate}
              onChange={(e) =>
                setFormData({ ...formData, joiningDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employment Type
            </label>
            <select
              value={formData.employmentType}
              onChange={(e) =>
                setFormData({ ...formData, employmentType: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CTC (₹)
            </label>
            <input
              type="number"
              value={formData.ctc}
              onChange={(e) =>
                setFormData({ ...formData, ctc: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Annual salary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Location
            </label>
            <input
              type="text"
              value={formData.workLocation}
              onChange={(e) =>
                setFormData({ ...formData, workLocation: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Office location"
            />
          </div>
        </div>

        {/* Address Fields */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-3">Address Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street
              </label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                value={formData.address.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, state: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                value={formData.address.zipCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, zipCode: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Processing..."
              : mode === "add"
              ? "Add Employee"
              : "Update Employee"}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Employee Details Modal Component
const EmployeeDetailsModal = ({ employee, onClose, onEdit }) => {
  const { user } = useAuth();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Employee Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Full Name
                </label>
                <p className="text-gray-900">
                  {employee.firstName} {employee.lastName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Employee ID
                </label>
                <p className="text-gray-900">{employee.employeeId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Email
                </label>
                <p className="text-gray-900">{employee.personalEmail}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Phone
                </label>
                <p className="text-gray-900">{employee.phone || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Gender
                </label>
                <p className="text-gray-900">{employee.gender || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Date of Birth
                </label>
                <p className="text-gray-900">
                  {employee.dateOfBirth
                    ? new Date(employee.dateOfBirth).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Professional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Department
                </label>
                <p className="text-gray-900">
                  {employee.department?.name || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Designation
                </label>
                <p className="text-gray-900">
                  {employee.designation?.title || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Joining Date
                </label>
                <p className="text-gray-900">
                  {employee.joiningDate
                    ? new Date(employee.joiningDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Employment Type
                </label>
                <p className="text-gray-900">{employee.employmentType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Status
                </label>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    employee.status === "Active"
                      ? "bg-green-100 text-green-800"
                      : employee.status === "On Leave"
                      ? "bg-blue-100 text-blue-800"
                      : employee.status === "Resigned"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {employee.status}
                </span>
              </div>
              {employee.ctc && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    CTC
                  </label>
                  <p className="text-gray-900">
                    ₹{employee.ctc.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {(user?.role === "hr" || user?.role === "admin") && (
            <div className="flex space-x-3 pt-4 border-t">
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Edit Employee
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;
