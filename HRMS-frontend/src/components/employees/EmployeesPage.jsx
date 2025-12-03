import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  User,
  Users,
  Building,
  Briefcase,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  GraduationCap,
  Award,
  Shield,
  Landmark,
  Heart,
  TrendingUp,
  Clock,
  Cake,
  Smartphone,
  IndianRupee,
  Star,
  Settings,
} from "lucide-react";

import { apiService } from "../../services/apiService";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";

const EmployeesPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [employees, setEmployees] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewMode, setViewMode] = useState("myProfile");
  const [filters, setFilters] = useState({
    department: "",
    status: "",
    employmentType: "",
    designation: "",
    workLocation: "",
  });

  // Mock data for departments and designations
  const departments = [
    { _id: "dept1", name: "Engineering", code: "ENG" },
    { _id: "dept2", name: "Human Resources", code: "HR" },
    { _id: "dept3", name: "Finance", code: "FIN" },
    { _id: "dept4", name: "Sales", code: "SALES" },
    { _id: "dept5", name: "Marketing", code: "MKT" },
    { _id: "dept6", name: "Operations", code: "OPS" },
    { _id: "dept7", name: "Customer Support", code: "CS" },
    { _id: "dept8", name: "Product Management", code: "PM" },
    { _id: "dept9", name: "Quality Assurance", code: "QA" },
    { _id: "dept10", name: "Research & Development", code: "R&D" },
  ];

  const designations = [
    { _id: "desig1", title: "Software Engineer", level: "Junior" },
    { _id: "desig2", title: "Senior Software Engineer", level: "Senior" },
    { _id: "desig3", title: "Tech Lead", level: "Lead" },
    { _id: "desig4", title: "Engineering Manager", level: "Manager" },
    { _id: "desig5", title: "HR Manager", level: "Manager" },
    { _id: "desig6", title: "HR Executive", level: "Junior" },
    { _id: "desig7", title: "Finance Analyst", level: "Junior" },
    { _id: "desig8", title: "Finance Manager", level: "Manager" },
    { _id: "desig9", title: "Sales Executive", level: "Junior" },
    { _id: "desig10", title: "Sales Manager", level: "Manager" },
    { _id: "desig11", title: "Marketing Specialist", level: "Junior" },
    { _id: "desig12", title: "Product Manager", level: "Manager" },
    { _id: "desig13", title: "QA Engineer", level: "Junior" },
    { _id: "desig14", title: "DevOps Engineer", level: "Senior" },
    { _id: "desig15", title: "Data Scientist", level: "Senior" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Always load current user's profile
      try {
        const myProfileResponse = await apiService.getMyProfile();
        setMyProfile(myProfileResponse.data);
      } catch (error) {
        console.error("Failed to load my profile:", error);
        // Create mock profile for demo
        setMyProfile({
          _id: "emp1",
          employeeId: "EMP001",
          firstName: "John",
          lastName: "Doe",
          personalEmail: "john.doe@company.com",
          phone: "+91 9876543210",
          dateOfBirth: "1990-05-15",
          gender: "Male",
          department: departments[0],
          designation: designations[1],
          joiningDate: "2022-01-15",
          employmentType: "Full-Time",
          status: "Active",
          ctc: 1200000,
          workLocation: "Bangalore",
          workShift: "Day",
          probationPeriod: 3,
          address: {
            street: "123 Main Street",
            city: "Bangalore",
            state: "Karnataka",
            zipCode: "560001",
            country: "India",
          },
          bankDetails: {
            accountNumber: "123456789012",
            ifscCode: "SBIN0001234",
            bankName: "State Bank of India",
            branch: "MG Road",
            accountHolderName: "John Doe",
            accountType: "Savings",
          },
          statutoryDetails: {
            panNumber: "ABCDE1234F",
            aadharNumber: "123456789012",
            uanNumber: "123456789012",
            epfNumber: "MHBAN123456789012",
            esiNumber: "123456789012345",
          },
          leaveBalance: {
            casual: 12,
            sick: 8,
            earned: 15,
            maternity: 0,
            paternity: 0,
            compOff: 2,
            lossOfPay: 0,
          },
          emergencyContact: {
            name: "Jane Doe",
            relationship: "Spouse",
            phone: "+91 9876543211",
            alternatePhone: "+91 9876543212",
            address: "123 Main Street, Bangalore",
          },
          performance: {
            lastReviewDate: "2024-01-15",
            nextReviewDate: "2024-07-15",
            currentRating: 4.2,
          },
          education: [
            {
              degree: "Bachelor of Engineering",
              institution: "ABC University",
              specialization: "Computer Science",
              yearOfPassing: 2012,
              percentage: 85,
              grade: "A",
            },
          ],
          workExperience: [
            {
              company: "Tech Solutions Inc",
              designation: "Software Developer",
              from: "2012-07-01",
              to: "2021-12-31",
              isCurrent: false,
              responsibilities: "Full stack development, Team leadership",
              reasonForLeaving: "Better opportunity",
            },
          ],
          skills: [
            { name: "JavaScript", level: "Expert", yearsOfExperience: 8 },
            { name: "React", level: "Expert", yearsOfExperience: 6 },
            { name: "Node.js", level: "Advanced", yearsOfExperience: 5 },
          ],
          documents: [
            {
              type: "Aadhar",
              fileName: "aadhar_card.pdf",
              fileUrl: "/documents/aadhar.pdf",
              uploadedAt: "2022-01-20",
              isVerified: true,
            },
          ],
        });
      }

      // Only load all employees if user is admin/hr/manager
      if (["hr", "admin", "manager"].includes(user?.role)) {
        try {
          const employeesResponse = await apiService.getAllEmployees();
          setEmployees(
            Array.isArray(employeesResponse.data) ? employeesResponse.data : []
          );
          // If no employees, create mock data
          if (!employeesResponse.data || employeesResponse.data.length === 0) {
            setEmployees(generateMockEmployees());
          }
        } catch (error) {
          console.error("Failed to load all employees:", error);
          // Create mock employees for demo
          setEmployees(generateMockEmployees());
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to load data:", error);
      showError("Failed to load data");
      setLoading(false);
    }
  };

  // Generate mock employees for demo
  const generateMockEmployees = () => {
    const mockEmployees = [];
    const firstNames = [
      "John",
      "Jane",
      "Mike",
      "Sarah",
      "David",
      "Lisa",
      "Robert",
      "Emily",
      "Michael",
      "Jessica",
    ];
    const lastNames = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
    ];

    for (let i = 1; i <= 20; i++) {
      const dept = departments[Math.floor(Math.random() * departments.length)];
      const desig =
        designations[Math.floor(Math.random() * designations.length)];

      mockEmployees.push({
        _id: `emp${i}`,
        employeeId: `EMP${String(i).padStart(3, "0")}`,
        firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
        lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
        personalEmail: `employee${i}@company.com`,
        phone: `+91 ${Math.floor(9000000000 + Math.random() * 1000000000)}`,
        dateOfBirth: `198${Math.floor(Math.random() * 10)}-${String(
          Math.floor(Math.random() * 12) + 1
        ).padStart(2, "0")}-${String(
          Math.floor(Math.random() * 28) + 1
        ).padStart(2, "0")}`,
        gender: Math.random() > 0.5 ? "Male" : "Female",
        department: dept,
        designation: desig,
        joiningDate: `202${Math.floor(Math.random() * 4)}-${String(
          Math.floor(Math.random() * 12) + 1
        ).padStart(2, "0")}-${String(
          Math.floor(Math.random() * 28) + 1
        ).padStart(2, "0")}`,
        employmentType: ["Full-Time", "Part-Time", "Contract", "Intern"][
          Math.floor(Math.random() * 4)
        ],
        status: ["Active", "Active", "Active", "On Leave", "On Probation"][
          Math.floor(Math.random() * 5)
        ],
        ctc: Math.floor(300000 + Math.random() * 1200000),
        workLocation: ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai"][
          Math.floor(Math.random() * 5)
        ],
        workShift: ["Day", "Night", "Rotational"][
          Math.floor(Math.random() * 3)
        ],
        probationPeriod: [3, 6][Math.floor(Math.random() * 2)],
        address: {
          street: `${Math.floor(Math.random() * 1000)} Street`,
          city: ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai"][
            Math.floor(Math.random() * 5)
          ],
          state: [
            "Karnataka",
            "Maharashtra",
            "Delhi",
            "Telangana",
            "Tamil Nadu",
          ][Math.floor(Math.random() * 5)],
          zipCode: "56000" + Math.floor(Math.random() * 10),
          country: "India",
        },
      });
    }
    return mockEmployees;
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm("Are you sure you want to terminate this employee?")) {
      try {
        await apiService.updateEmployee(employeeId, {
          status: "Terminated",
          exitDate: new Date(),
        });
        showSuccess("Employee terminated successfully");
        loadData();
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
    const matchesDesignation =
      !filters.designation || emp.designation?._id === filters.designation;
    const matchesWorkLocation =
      !filters.workLocation || emp.workLocation === filters.workLocation;

    return (
      matchesSearch &&
      matchesDepartment &&
      matchesStatus &&
      matchesEmploymentType &&
      matchesDesignation &&
      matchesWorkLocation
    );
  });

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-64">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-6 pt-6">
      {/* Header with Toggle for Admin/HR */}
      {["hr", "admin", "manager"].includes(user?.role) ? (
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode("myProfile")}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                viewMode === "myProfile"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <User className="h-4 w-4" />
              <span>My Profile</span>
            </button>
            <button
              onClick={() => setViewMode("allEmployees")}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                viewMode === "allEmployees"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>All Employees ({employees.length})</span>
            </button>
          </div>

          {(user?.role === "hr" || user?.role === "admin") &&
            viewMode === "allEmployees" && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 transition-colors shadow-sm"
              >
                <Plus className="h-5 w-5" />
                <span>Add Employee</span>
              </button>
            )}
        </div>
      ) : (
        // Regular employee header
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <User className="h-8 w-8" />
            <span>My Employee Profile</span>
          </h1>
          <button
            onClick={() => {
              setSelectedEmployee(myProfile);
              setShowEditModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 transition-colors"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === "myProfile" && myProfile && (
        <EmployeeProfileView
          employee={myProfile}
          onEdit={() => {
            setSelectedEmployee(myProfile);
            setShowEditModal(true);
          }}
        />
      )}

      {viewMode === "allEmployees" && (
        <AllEmployeesView
          employees={filteredEmployees}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
          onFiltersChange={setFilters}
          onEmployeeSelect={setSelectedEmployee}
          onDeleteEmployee={handleDeleteEmployee}
          userRole={user?.role}
          departments={departments}
          designations={designations}
        />
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <EmployeeFormModal
          mode="add"
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadData();
          }}
          departments={departments}
          designations={designations}
          employees={employees}
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
            loadData();
          }}
          departments={departments}
          designations={designations}
          employees={employees}
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
          userRole={user?.role}
        />
      )}
    </div>
  );
};

// Employee Profile View Component
const EmployeeProfileView = ({ employee, onEdit }) => {
  const calculateTenure = (joiningDate) => {
    if (!joiningDate) return { years: 0, months: 0, days: 0 };

    const today = new Date();
    const joining = new Date(joiningDate);

    let years = today.getFullYear() - joining.getFullYear();
    let months = today.getMonth() - joining.getMonth();
    let days = today.getDate() - joining.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months, days };
  };

  const tenure = calculateTenure(employee.joiningDate);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex items-center space-x-6">
          <div className="h-24 w-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center border-4 border-white border-opacity-30">
            {employee.profilePicture ? (
              <img
                src={employee.profilePicture}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <User className="h-12 w-12 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-indigo-100 text-lg">
              {employee.designation?.title || "Employee"}
            </p>
            <p className="text-indigo-100 flex items-center space-x-2 mt-2">
              <Building className="h-4 w-4" />
              <span>{employee.department?.name || "No Department"}</span>
              <span className="text-indigo-200">•</span>
              <MapPin className="h-4 w-4" />
              <span>{employee.workLocation || "Remote"}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-indigo-100 text-sm">Employee ID</p>
            <p className="text-2xl font-bold">{employee.employeeId}</p>
            <p className="text-indigo-100 text-sm mt-2">
              Tenure: {tenure.years}y {tenure.months}m
            </p>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-6 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {employee.leaveBalance
                ? employee.leaveBalance.casual +
                  employee.leaveBalance.sick +
                  employee.leaveBalance.earned
                : 0}
            </div>
            <div className="text-sm text-blue-600">Available Leaves</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {tenure.years}.{tenure.months}
            </div>
            <div className="text-sm text-green-600">Years Experience</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {employee.performance?.currentRating || "N/A"}
            </div>
            <div className="text-sm text-purple-600">Performance Rating</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {employee.skills?.length || 0}
            </div>
            <div className="text-sm text-orange-600">Skills</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <User className="h-5 w-5 text-indigo-600" />
                <span>Personal Information</span>
              </h2>
              <button
                onClick={onEdit}
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Edit
              </button>
            </div>

            <div className="space-y-4">
              <InfoField
                label="Full Name"
                value={`${employee.firstName} ${employee.lastName}`}
                icon={<User className="h-4 w-4" />}
              />
              <InfoField
                label="Employee ID"
                value={employee.employeeId}
                icon={<CreditCard className="h-4 w-4" />}
              />
              <InfoField
                label="Email"
                value={employee.personalEmail}
                icon={<Mail className="h-4 w-4" />}
              />
              <InfoField
                label="Phone"
                value={employee.phone || "Not provided"}
                icon={<Phone className="h-4 w-4" />}
              />
              <InfoField
                label="Alternate Phone"
                value={employee.alternatePhone || "Not provided"}
                icon={<Smartphone className="h-4 w-4" />}
              />
              <InfoField
                label="Gender"
                value={employee.gender || "Not specified"}
              />
              <InfoField
                label="Date of Birth"
                value={
                  employee.dateOfBirth
                    ? new Date(employee.dateOfBirth).toLocaleDateString()
                    : "Not provided"
                }
                icon={<Cake className="h-4 w-4" />}
              />
              <InfoField
                label="Age"
                value={
                  employee.dateOfBirth
                    ? Math.floor(
                        (new Date() - new Date(employee.dateOfBirth)) /
                          (1000 * 60 * 60 * 24 * 365.25)
                      )
                    : "N/A"
                }
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-indigo-600" />
              <span>Professional Information</span>
            </h2>

            <div className="space-y-4">
              <InfoField
                label="Department"
                value={employee.department?.name || "Not assigned"}
                icon={<Building className="h-4 w-4" />}
              />
              <InfoField
                label="Designation"
                value={employee.designation?.title || "Not assigned"}
                icon={<Briefcase className="h-4 w-4" />}
              />
             
              <InfoField
                label="Reporting Manager"
                value={
                  employee.reportingManager
                    ? `${employee.reportingManager.firstName} ${employee.reportingManager.lastName} (${employee.reportingManager.employeeId})`
                    : "Not assigned"
                }
                icon={<User className="h-4 w-4" />}
              />
              <InfoField
                label="Joining Date"
                value={
                  employee.joiningDate
                    ? new Date(employee.joiningDate).toLocaleDateString()
                    : "Not provided"
                }
                icon={<Calendar className="h-4 w-4" />}
              />
              <InfoField
                label="Confirmation Date"
                value={
                  employee.confirmationDate
                    ? new Date(employee.confirmationDate).toLocaleDateString()
                    : "Not provided"
                }
                icon={<Calendar className="h-4 w-4" />}
              />
              <InfoField
                label="Employment Type"
                value={employee.employmentType}
              />
              <InfoField
                label="Work Location"
                value={employee.workLocation || "Not specified"}
                icon={<MapPin className="h-4 w-4" />}
              />
              <InfoField
                label="Work Shift"
                value={employee.workShift || "Not specified"}
                icon={<Clock className="h-4 w-4" />}
              />
              <InfoField
                label="Probation Period"
                value={
                  employee.probationPeriod
                    ? `${employee.probationPeriod} months`
                    : "Completed"
                }
              />
              <InfoField
                label="Status"
                value={
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      employee.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : employee.status === "On Leave"
                        ? "bg-blue-100 text-blue-800"
                        : employee.status === "On Probation"
                        ? "bg-yellow-100 text-yellow-800"
                        : employee.status === "Resigned"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {employee.status}
                  </span>
                }
              />
              {employee.ctc && (
                <InfoField
                  label="CTC (Annual)"
                  value={`₹${employee.ctc.toLocaleString()}`}
                  icon={<IndianRupee className="h-4 w-4" />}
                />
              )}
              {employee.basicSalary && (
                <InfoField
                  label="Basic Salary"
                  value={`₹${employee.basicSalary.toLocaleString()}`}
                  icon={<IndianRupee className="h-4 w-4" />}
                />
              )}
            </div>
          </div>

          {/* Address Information */}
          {employee.address && (
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-indigo-600" />
                <span>Address Information</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <InfoField label="Street" value={employee.address.street} />
                <InfoField label="City" value={employee.address.city} />
                <InfoField label="State" value={employee.address.state} />
                <InfoField label="ZIP Code" value={employee.address.zipCode} />
                <InfoField
                  label="Country"
                  value={employee.address.country || "India"}
                />
              </div>
            </div>
          )}

          {/* Bank Details */}
          {employee.bankDetails && (
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Landmark className="h-5 w-5 text-indigo-600" />
                <span>Bank Details</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <InfoField
                  label="Account Number"
                  value={employee.bankDetails.accountNumber || "N/A"}
                />
                <InfoField
                  label="Account Holder"
                  value={employee.bankDetails.accountHolderName || "N/A"}
                />
                <InfoField
                  label="Bank Name"
                  value={employee.bankDetails.bankName || "N/A"}
                />
                <InfoField
                  label="IFSC Code"
                  value={employee.bankDetails.ifscCode || "N/A"}
                />
                <InfoField
                  label="Branch"
                  value={employee.bankDetails.branch || "N/A"}
                />
                <InfoField
                  label="Account Type"
                  value={employee.bankDetails.accountType || "N/A"}
                />
              </div>
            </div>
          )}

          {/* Statutory Details */}
          {employee.statutoryDetails && (
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                <span>Statutory Details</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <InfoField
                  label="PAN Number"
                  value={employee.statutoryDetails.panNumber || "N/A"}
                />
                <InfoField
                  label="Aadhar Number"
                  value={employee.statutoryDetails.aadharNumber || "N/A"}
                />
                <InfoField
                  label="UAN Number"
                  value={employee.statutoryDetails.uanNumber || "N/A"}
                />
                <InfoField
                  label="EPF Number"
                  value={employee.statutoryDetails.epfNumber || "N/A"}
                />
                <InfoField
                  label="ESI Number"
                  value={employee.statutoryDetails.esiNumber || "N/A"}
                />
                <InfoField
                  label="Passport Number"
                  value={employee.statutoryDetails.passportNumber || "N/A"}
                />
              </div>
            </div>
          )}

          {/* Leave Balance */}
          {employee.leaveBalance && (
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <span>Leave Balance</span>
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {employee.leaveBalance.casual}
                  </div>
                  <div className="text-xs text-gray-600">Casual</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-green-600">
                    {employee.leaveBalance.sick}
                  </div>
                  <div className="text-xs text-gray-600">Sick</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {employee.leaveBalance.earned}
                  </div>
                  <div className="text-xs text-gray-600">Earned</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-pink-600">
                    {employee.leaveBalance.maternity}
                  </div>
                  <div className="text-xs text-gray-600">Maternity</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {employee.leaveBalance.paternity}
                  </div>
                  <div className="text-xs text-gray-600">Paternity</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {employee.leaveBalance.compOff}
                  </div>
                  <div className="text-xs text-gray-600">Comp Off</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-red-600">
                    {employee.leaveBalance.lossOfPay}
                  </div>
                  <div className="text-xs text-gray-600">LOP</div>
                </div>
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          {employee.emergencyContact && (
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Heart className="h-5 w-5 text-indigo-600" />
                <span>Emergency Contact</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <InfoField
                  label="Name"
                  value={employee.emergencyContact.name}
                />
                <InfoField
                  label="Relationship"
                  value={employee.emergencyContact.relationship}
                />
                <InfoField
                  label="Phone"
                  value={employee.emergencyContact.phone}
                />
                <InfoField
                  label="Alternate Phone"
                  value={employee.emergencyContact.alternatePhone || "N/A"}
                />
                <InfoField
                  label="Address"
                  value={employee.emergencyContact.address}
                  className="md:col-span-2"
                />
              </div>
            </div>
          )}

          {/* Performance */}
          {employee.performance && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <span>Performance</span>
              </h2>

              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <InfoField
                  label="Current Rating"
                  value={
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-indigo-600">
                        {employee.performance.currentRating}/5
                      </span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <=
                              Math.floor(employee.performance.currentRating)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  }
                />
                <InfoField
                  label="Last Review"
                  value={
                    employee.performance.lastReviewDate
                      ? new Date(
                          employee.performance.lastReviewDate
                        ).toLocaleDateString()
                      : "N/A"
                  }
                />
                <InfoField
                  label="Next Review"
                  value={
                    employee.performance.nextReviewDate
                      ? new Date(
                          employee.performance.nextReviewDate
                        ).toLocaleDateString()
                      : "N/A"
                  }
                />
              </div>
            </div>
          )}

          {/* Education */}
          {employee.education && employee.education.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-indigo-600" />
                <span>Education</span>
              </h2>

              <div className="space-y-3">
                {employee.education.map((edu, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {edu.degree}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {edu.institution}
                        </p>
                        {edu.specialization && (
                          <p className="text-sm text-gray-600">
                            Specialization: {edu.specialization}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{edu.yearOfPassing}</p>
                        <p>
                          {edu.percentage}% | {edu.grade}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {employee.workExperience && employee.workExperience.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-indigo-600" />
                <span>Work Experience</span>
              </h2>

              <div className="space-y-3">
                {employee.workExperience.map((exp, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {exp.designation}
                        </h3>
                        <p className="text-sm text-gray-600">{exp.company}</p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>
                          {new Date(exp.from).toLocaleDateString()} -{" "}
                          {exp.isCurrent
                            ? "Present"
                            : new Date(exp.to).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {exp.responsibilities && (
                      <p className="text-sm text-gray-700 mt-2">
                        {exp.responsibilities}
                      </p>
                    )}
                    {exp.reasonForLeaving && !exp.isCurrent && (
                      <p className="text-xs text-gray-500 mt-1">
                        Reason for leaving: {exp.reasonForLeaving}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {employee.skills && employee.skills.length > 0 && (
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Award className="h-5 w-5 text-indigo-600" />
                <span>Skills</span>
              </h2>

              <div className="flex flex-wrap gap-2">
                {employee.skills.map((skill, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      skill.level === "Expert"
                        ? "bg-green-100 text-green-800"
                        : skill.level === "Advanced"
                        ? "bg-blue-100 text-blue-800"
                        : skill.level === "Intermediate"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {skill.name} ({skill.level}) - {skill.yearsOfExperience} yrs
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {employee.documents && employee.documents.length > 0 && (
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <span>Documents</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employee.documents.map((doc, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {doc.type}
                        </h3>
                        <p className="text-sm text-gray-600">{doc.fileName}</p>
                        <p className="text-xs text-gray-500">
                          Uploaded:{" "}
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          doc.isVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {doc.isVerified ? "Verified" : "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper component for info fields
const InfoField = ({ label, value, icon, className = "" }) => (
  <div
    className={`flex justify-between items-start py-2 border-b border-gray-100 ${className}`}
  >
    <div className="flex items-center space-x-2 text-sm font-medium text-gray-600">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-sm text-gray-900 text-right max-w-xs">{value}</div>
  </div>
);

// All Employees View Component
const AllEmployeesView = ({
  employees,
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  onEmployeeSelect,
  onDeleteEmployee,
  userRole,
  departments,
  designations,
}) => {
  const workLocations = [
    "Bangalore",
    "Mumbai",
    "Delhi",
    "Hyderabad",
    "Chennai",
    "Pune",
    "Kolkata",
    "Remote",
  ];

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <select
            value={filters.department}
            onChange={(e) =>
              onFiltersChange({ ...filters, department: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>

          <select
            value={filters.designation}
            onChange={(e) =>
              onFiltersChange({ ...filters, designation: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Designations</option>
            {designations.map((desig) => (
              <option key={desig._id} value={desig._id}>
                {desig.title}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) =>
              onFiltersChange({ ...filters, status: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="On Probation">On Probation</option>
            <option value="Resigned">Resigned</option>
            <option value="Terminated">Terminated</option>
          </select>

          <select
            value={filters.employmentType}
            onChange={(e) =>
              onFiltersChange({ ...filters, employmentType: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Contract">Contract</option>
            <option value="Intern">Intern</option>
            <option value="Consultant">Consultant</option>
          </select>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            Showing {employees.length} of {employees.length} employees
          </span>
          <div className="flex space-x-2">
            <button className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-700">
              <Filter className="h-4 w-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joining Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr
                  key={employee._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {employee.profilePicture ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={employee.profilePicture}
                            alt=""
                          />
                        ) : (
                          <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-indigo-600" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.employeeId}
                        </div>
                        <div className="text-xs text-gray-400">
                          {employee.personalEmail}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.department?.name || "N/A"}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.designation?.title || "N/A"}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.employmentType}
                  </td>
                  <td className="px-9 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.workLocation || "Remote"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        employee.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : employee.status === "On Leave"
                          ? "bg-blue-100 text-blue-800"
                          : employee.status === "On Probation"
                          ? "bg-yellow-100 text-yellow-800"
                          : employee.status === "Resigned"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.joiningDate
                      ? new Date(employee.joiningDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEmployeeSelect(employee)}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors p-1 rounded hover:bg-indigo-50"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {(userRole === "hr" || userRole === "admin") && (
                        <>
                          <button
                            onClick={() => onEmployeeSelect(employee)}
                            className="text-gray-600 hover:text-gray-900 transition-colors p-1 rounded hover:bg-gray-50"
                            title="Edit Employee"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          {employee.status !== "Terminated" && (
                            <button
                              onClick={() => onDeleteEmployee(employee._id)}
                              className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
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

        {employees.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No employees found</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm || Object.values(filters).some((f) => f)
                ? "Try adjusting your search or filters"
                : "No employees in the system"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Employee Form Modal Component
const EmployeeFormModal = ({
  mode,
  employee,
  onClose,
  onSuccess,
  departments,
  designations,
  employees = [],
}) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");
  const [reportingManagers, setReportingManagers] = useState([]);

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: employee?.firstName || "",
    lastName: employee?.lastName || "",
    employeeId: employee?.employeeId || "",
    personalEmail: employee?.personalEmail || "",
    phone: employee?.phone || "",
    alternatePhone: employee?.alternatePhone || "",
    dateOfBirth: employee?.dateOfBirth
      ? new Date(employee.dateOfBirth).toISOString().split("T")[0]
      : "",
    gender: employee?.gender || "",

    // Professional Information
    department: employee?.department?._id || "",
    designation: employee?.designation?._id || "",
    reportingManager: employee?.reportingManager?._id || "",
    joiningDate: employee?.joiningDate
      ? new Date(employee.joiningDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    confirmationDate: employee?.confirmationDate
      ? new Date(employee.confirmationDate).toISOString().split("T")[0]
      : "",
    probationPeriod: employee?.probationPeriod || 3,
    employmentType: employee?.employmentType || "Full-Time",
    workLocation: employee?.workLocation || "",
    workShift: employee?.workShift || "Day",
    status: employee?.status || "Active",

    // Salary Information
    ctc: employee?.ctc || "",
    basicSalary: employee?.basicSalary || "",

    // Address Information
    address: {
      street: employee?.address?.street || "",
      city: employee?.address?.city || "",
      state: employee?.address?.state || "",
      zipCode: employee?.address?.zipCode || "",
      country: employee?.address?.country || "India",
    },

    // Bank Details
    bankDetails: {
      accountNumber: employee?.bankDetails?.accountNumber || "",
      ifscCode: employee?.bankDetails?.ifscCode || "",
      bankName: employee?.bankDetails?.bankName || "",
      branch: employee?.bankDetails?.branch || "",
      accountHolderName: employee?.bankDetails?.accountHolderName || "",
      accountType: employee?.bankDetails?.accountType || "Savings",
    },

    // Statutory Details
    statutoryDetails: {
      panNumber: employee?.statutoryDetails?.panNumber || "",
      aadharNumber: employee?.statutoryDetails?.aadharNumber || "",
      uanNumber: employee?.statutoryDetails?.uanNumber || "",
      epfNumber: employee?.statutoryDetails?.epfNumber || "",
      esiNumber: employee?.statutoryDetails?.esiNumber || "",
      passportNumber: employee?.statutoryDetails?.passportNumber || "",
    },

    // Emergency Contact
    emergencyContact: {
      name: employee?.emergencyContact?.name || "",
      relationship: employee?.emergencyContact?.relationship || "",
      phone: employee?.emergencyContact?.phone || "",
      alternatePhone: employee?.emergencyContact?.alternatePhone || "",
      address: employee?.emergencyContact?.address || "",
    },

    // System Access
    password: "",
    role: employee?.userId?.role || "employee",
  });

  useEffect(() => {
    // Load reporting managers when modal opens
    if (["hr", "admin", "manager"].includes(user?.role)) {
      loadReportingManagers();
    }
  }, [user?.role]); // REMOVED showAddModal and showEditModal from dependencies

 const loadReportingManagers = async () => {
  try {
    const response = await apiService.getReportingManagers();
    setReportingManagers(response.data);
  } catch (error) {
    // fallback: filter from employees by role manager/hr/admin and status active
    const managers = employees.filter(
      emp =>
        ['manager', 'hr', 'admin'].includes(emp.userId?.role) &&
        emp.status === 'Active'
    );
    setReportingManagers(managers);
  }
};


  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Prepare data - remove empty values and validate ObjectIds
      const submitData = { ...formData };

      // Clean up empty values
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === "" || submitData[key] === null) {
          delete submitData[key];
        }
      });

      // Validate and clean ObjectId fields
      const objectIdFields = ['department', 'designation', 'reportingManager'];
      objectIdFields.forEach(field => {
        if (submitData[field] && !/^[0-9a-fA-F]{24}$/.test(submitData[field])) {
          delete submitData[field];
        }
      });

      // For regular employees: Remove admin-only fields during edit
      if (mode === "edit" && !["hr", "admin"].includes(user?.role)) {
        const adminFields = [
          'password', 'role', 'employeeId', 'department', 'designation', 
          'ctc', 'employmentType', 'joiningDate', 'status', 'bankDetails', 
          'statutoryDetails', 'reportingManager'
        ];
        adminFields.forEach(field => delete submitData[field]);
      }

      // Remove password if empty for new employees
      if (mode === "add" && !submitData.password) {
        delete submitData.password;
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
      showError(error.message || "Failed to " + mode + " employee");
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = ["hr", "admin"].includes(user?.role);

  const sections = [
    { id: "personal", name: "Personal Info", icon: User },
    { id: "professional", name: "Professional", icon: Briefcase },
    { id: "salary", name: "Salary", icon: IndianRupee },
    { id: "address", name: "Address", icon: MapPin },
    { id: "bank", name: "Bank Details", icon: Landmark },
    { id: "statutory", name: "Statutory", icon: Shield },
    { id: "emergency", name: "Emergency Contact", icon: Heart },
  ];

  if (mode === "add" && isAdmin) {
    sections.push({ id: "system", name: "System Access", icon: Settings });
  }

  const renderSection = () => {
    switch (activeSection) {
      case "personal":
        return (
          <PersonalInfoSection
            formData={formData}
            setFormData={setFormData}
            mode={mode}
          />
        );
      case "professional":
        return (
          <ProfessionalInfoSection
            formData={formData}
            setFormData={setFormData}
            departments={departments}
            designations={designations}
            isAdmin={isAdmin}
            mode={mode}
            employees={employees}
            reportingManagers={reportingManagers}
          />
        );
      case "salary":
        return (
          <SalaryInfoSection
            formData={formData}
            setFormData={setFormData}
            isAdmin={isAdmin}
            mode={mode}
          />
        );
      case "address":
        return (
          <AddressInfoSection formData={formData} setFormData={setFormData} />
        );
      case "bank":
        return (
          <BankInfoSection
            formData={formData}
            setFormData={setFormData}
            isAdmin={isAdmin}
            mode={mode}
          />
        );
      case "statutory":
        return (
          <StatutoryInfoSection
            formData={formData}
            setFormData={setFormData}
            isAdmin={isAdmin}
            mode={mode}
          />
        );
      case "emergency":
        return (
          <EmergencyContactSection
            formData={formData}
            setFormData={setFormData}
          />
        );
      case "system":
        return (
          <SystemAccessSection formData={formData} setFormData={setFormData} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === "add" ? "Add New Employee" : "Edit Employee"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 p-1 bg-gray-100 rounded-lg">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeSection === section.id
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:block">{section.name}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Form Content */}
        <div className="space-y-6">{renderSection()}</div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6 pt-6 border-t">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Section Components
const PersonalInfoSection = ({ formData, setFormData, mode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="md:col-span-2">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">
        Personal Information
      </h3>
    </div>

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
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        required
      />
    </div>

    {mode === "add" && (
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          required
        />
      </div>
    )}

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
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        required
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Phone Number *
      </label>
      <input
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        required
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Alternate Phone
      </label>
      <input
        type="tel"
        value={formData.alternatePhone}
        onChange={(e) =>
          setFormData({ ...formData, alternatePhone: e.target.value })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Date of Birth
      </label>
      <input
        type="date"
        value={formData.dateOfBirth}
        onChange={(e) =>
          setFormData({ ...formData, dateOfBirth: e.target.value })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Gender
      </label>
      <select
        value={formData.gender}
        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
        <option value="Prefer not to say">Prefer not to say</option>
      </select>
    </div>
  </div>
);

const ProfessionalInfoSection = ({
  formData,
  setFormData,
  departments,
  designations,
  isAdmin,
  mode,
  employees = [],
  reportingManagers = [],
}) => {
  // Fix reporting manager options - filter out current employee if editing
  const reportingManagerOptions = reportingManagers.filter(manager => 
    mode === "add" || manager._id !== formData._id
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">
          Professional Information
        </h3>
      </div>

      {/* Department */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Department {isAdmin && "*"}
        </label>
        <select
          value={formData.department || ""}
          onChange={(e) =>
            setFormData({ ...formData, department: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={!isAdmin && mode === "edit"}
          required={isAdmin}
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      {/* Designation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Designation {isAdmin && "*"}
        </label>
        <select
          value={formData.designation || ""}
          onChange={(e) =>
            setFormData({ ...formData, designation: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={!isAdmin && mode === "edit"}
          required={isAdmin}
        >
          <option value="">Select Designation</option>
          {designations.map((desig) => (
            <option key={desig._id} value={desig._id}>
              {desig.title} ({desig.level})
            </option>
          ))}
        </select>
      </div>

      {/* Reporting Manager - Fixed */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reporting Manager
        </label>
        <select
          value={formData.reportingManager || ""}
          onChange={(e) =>
            setFormData({ ...formData, reportingManager: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={!isAdmin && mode === "edit"}
        >
          <option value="">Select Reporting Manager</option>
          {reportingManagerOptions.map((manager) => (
            <option key={manager._id} value={manager._id}>
              {manager.firstName} {manager.lastName} - {manager.designation?.title}
            </option>
          ))}
        </select>
      </div>

      {/* Rest of the professional fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Joining Date {isAdmin && "*"}
        </label>
        <input
          type="date"
          value={formData.joiningDate}
          onChange={(e) =>
            setFormData({ ...formData, joiningDate: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={!isAdmin && mode === "edit"}
          required={isAdmin}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirmation Date
        </label>
        <input
          type="date"
          value={formData.confirmationDate}
          onChange={(e) =>
            setFormData({ ...formData, confirmationDate: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Probation Period (months)
        </label>
        <input
          type="number"
          value={formData.probationPeriod}
          onChange={(e) =>
            setFormData({
              ...formData,
              probationPeriod: parseInt(e.target.value) || 3,
            })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          min="1"
          max="6"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={!isAdmin && mode === "edit"}
        >
          <option value="Full-Time">Full-Time</option>
          <option value="Part-Time">Part-Time</option>
          <option value="Contract">Contract</option>
          <option value="Intern">Intern</option>
          <option value="Consultant">Consultant</option>
        </select>
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="e.g., Bangalore, Remote"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Work Shift
        </label>
        <select
          value={formData.workShift}
          onChange={(e) =>
            setFormData({ ...formData, workShift: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="Day">Day Shift</option>
          <option value="Night">Night Shift</option>
          <option value="Rotational">Rotational</option>
          <option value="Flexible">Flexible</option>
        </select>
      </div>

      {isAdmin && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="On Probation">On Probation</option>
              <option value="On Notice">On Notice</option>
              <option value="Resigned">Resigned</option>
              <option value="Terminated">Terminated</option>
              <option value="Retired">Retired</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};

const SalaryInfoSection = ({ formData, setFormData, isAdmin, mode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="md:col-span-2">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">
        Salary Information
      </h3>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        CTC (Annual in ₹)
      </label>
      <input
        type="number"
        value={formData.ctc}
        onChange={(e) => setFormData({ ...formData, ctc: e.target.value })}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        placeholder="Annual Cost to Company"
        disabled={!isAdmin && mode === "edit"}
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Basic Salary (Monthly in ₹)
      </label>
      <input
        type="number"
        value={formData.basicSalary}
        onChange={(e) =>
          setFormData({ ...formData, basicSalary: e.target.value })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        placeholder="Monthly basic salary"
        disabled={!isAdmin && mode === "edit"}
      />
    </div>
  </div>
);

const AddressInfoSection = ({ formData, setFormData }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="md:col-span-2">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">
        Address Information
      </h3>
    </div>

    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Street Address
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
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        placeholder="House no., Building, Street"
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
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Country
      </label>
      <input
        type="text"
        value={formData.address.country}
        onChange={(e) =>
          setFormData({
            ...formData,
            address: { ...formData.address, country: e.target.value },
          })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  </div>
);

const BankInfoSection = ({ formData, setFormData, isAdmin, mode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="md:col-span-2">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2 flex items-center space-x-2">
        <Landmark className="h-5 w-5 text-indigo-600" />
        <span>Bank Account Details</span>
      </h3>
    </div>

    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Account Holder Name
      </label>
      <input
        type="text"
        value={formData.bankDetails.accountHolderName}
        onChange={(e) =>
          setFormData({
            ...formData,
            bankDetails: {
              ...formData.bankDetails,
              accountHolderName: e.target.value,
            },
          })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        disabled={!isAdmin && mode === "edit"}
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Account Number
      </label>
      <input
        type="text"
        value={formData.bankDetails.accountNumber}
        onChange={(e) =>
          setFormData({
            ...formData,
            bankDetails: {
              ...formData.bankDetails,
              accountNumber: e.target.value,
            },
          })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        disabled={!isAdmin && mode === "edit"}
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        IFSC Code
      </label>
      <input
        type="text"
        value={formData.bankDetails.ifscCode}
        onChange={(e) =>
          setFormData({
            ...formData,
            bankDetails: { ...formData.bankDetails, ifscCode: e.target.value },
          })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        disabled={!isAdmin && mode === "edit"}
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Bank Name
      </label>
      <input
        type="text"
        value={formData.bankDetails.bankName}
        onChange={(e) =>
          setFormData({
            ...formData,
            bankDetails: { ...formData.bankDetails, bankName: e.target.value },
          })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        disabled={!isAdmin && mode === "edit"}
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Branch
      </label>
      <input
        type="text"
        value={formData.bankDetails.branch}
        onChange={(e) =>
          setFormData({
            ...formData,
            bankDetails: { ...formData.bankDetails, branch: e.target.value },
          })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        disabled={!isAdmin && mode === "edit"}
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Account Type
      </label>
      <select
        value={formData.bankDetails.accountType}
        onChange={(e) =>
          setFormData({
            ...formData,
            bankDetails: {
              ...formData.bankDetails,
              accountType: e.target.value,
            },
          })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        disabled={!isAdmin && mode === "edit"}
      >
        <option value="Savings">Savings</option>
        <option value="Current">Current</option>
        <option value="Salary">Salary</option>
      </select>
    </div>
  </div>
);

const StatutoryInfoSection = ({ formData, setFormData, isAdmin, mode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="md:col-span-2">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">
        Statutory Details
      </h3>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        PAN Number
      </label>
      <input
        type="text"
        value={formData.statutoryDetails.panNumber}
        onChange={(e) =>
          setFormData({
            ...formData,
            statutoryDetails: {
              ...formData.statutoryDetails,
              panNumber: e.target.value,
            },
          })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        disabled={!isAdmin && mode === "edit"}
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Aadhar Number
      </label>
      <input
        type="text"
        value={formData.statutoryDetails.aadharNumber}
        onChange={(e) =>
          setFormData({
            ...formData,
            statutoryDetails: {
              ...formData.statutoryDetails,
              aadharNumber: e.target.value,
            },
          })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        disabled={!isAdmin && mode === "edit"}
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        UAN Number
      </label>
      <input
        type="text"
        value={formData.statutoryDetails.uanNumber}
        onChange={(e) =>
          setFormData({
            ...formData,
            statutoryDetails: {
              ...formData.statutoryDetails,
              uanNumber: e.target.value,
            },
          })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        disabled={!isAdmin && mode === "edit"}
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        EPF Number
      </label>
      <input
        type="text"
        value={formData.statutoryDetails.epfNumber}
        onChange={(e) =>
          setFormData({
            ...formData,
            statutoryDetails: {
              ...formData.statutoryDetails,
              epfNumber: e.target.value,
            },
          })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        disabled={!isAdmin && mode === "edit"}
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        ESI Number
      </label>
      <input
        type="text"
        value={formData.statutoryDetails.esiNumber}
        onChange={(e) =>
          setFormData({
            ...formData,
            statutoryDetails: {
              ...formData.statutoryDetails,
              esiNumber: e.target.value,
            },
          })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        disabled={!isAdmin && mode === "edit"}
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Passport Number
      </label>
      <input
        type="text"
        value={formData.statutoryDetails.passportNumber}
        onChange={(e) =>
          setFormData({
            ...formData,
            statutoryDetails: {
              ...formData.statutoryDetails,
              passportNumber: e.target.value,
            },
          })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        disabled={!isAdmin && mode === "edit"}
      />
    </div>
  </div>
);

const EmergencyContactSection = ({ formData, setFormData }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="md:col-span-2">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">
        Emergency Contact Information
      </h3>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Contact Name *
      </label>
      <input
        type="text"
        value={formData.emergencyContact.name}
        onChange={(e) =>
          setFormData({
            ...formData,
            emergencyContact: {
              ...formData.emergencyContact,
              name: e.target.value,
            },
          })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        required
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Relationship *
      </label>
      <select
        value={formData.emergencyContact.relationship}
        onChange={(e) =>
          setFormData({
            ...formData,
            emergencyContact: {
              ...formData.emergencyContact,
              relationship: e.target.value,
            },
          })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        required
      >
        <option value="">Select Relationship</option>
        <option value="Spouse">Spouse</option>
        <option value="Parent">Parent</option>
        <option value="Sibling">Sibling</option>
        <option value="Friend">Friend</option>
        <option value="Other">Other</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Phone Number *
      </label>
      <input
        type="tel"
        value={formData.emergencyContact.phone}
        onChange={(e) =>
          setFormData({
            ...formData,
            emergencyContact: {
              ...formData.emergencyContact,
              phone: e.target.value,
            },
          })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        required
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Alternate Phone
      </label>
      <input
        type="tel"
        value={formData.emergencyContact.alternatePhone}
        onChange={(e) =>
          setFormData({
            ...formData,
            emergencyContact: {
              ...formData.emergencyContact,
              alternatePhone: e.target.value,
            },
          })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>

    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Address
      </label>
      <textarea
        value={formData.emergencyContact.address}
        onChange={(e) =>
          setFormData({
            ...formData,
            emergencyContact: {
              ...formData.emergencyContact,
              address: e.target.value,
            },
          })
        }
        rows="3"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        placeholder="Full address of the emergency contact"
      />
    </div>
  </div>
);

const SystemAccessSection = ({ formData, setFormData }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="md:col-span-2">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">
        System Access
      </h3>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Password <span className="text-gray-400 text-sm">(Optional)</span>
      </label>
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        placeholder="Default: Welcome123"
      />
      <p className="text-xs text-gray-500 mt-1">
        Leave empty to use default password
      </p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        User Role
      </label>
      <select
        value={formData.role}
        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        <option value="employee">Employee</option>
        <option value="manager">Manager</option>
        <option value="hr">HR</option>
        <option value="admin">Admin</option>
      </select>
    </div>
  </div>
);

// Employee Details Modal Component
const EmployeeDetailsModal = ({ employee, onClose, onEdit, userRole }) => {
  const isAdmin = ["hr", "admin", "manager"].includes(userRole);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Employee Details</h2>
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
            <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="First Name" value={employee.firstName} />
              <InfoField label="Last Name" value={employee.lastName} />
              <InfoField label="Employee ID" value={employee.employeeId} />
              <InfoField label="Email" value={employee.personalEmail} />
              <InfoField label="Phone" value={employee.phone || "N/A"} />
              <InfoField
                label="Alternate Phone"
                value={employee.alternatePhone || "N/A"}
              />
              <InfoField label="Gender" value={employee.gender || "N/A"} />
              <InfoField
                label="Date of Birth"
                value={
                  employee.dateOfBirth
                    ? new Date(employee.dateOfBirth).toLocaleDateString()
                    : "N/A"
                }
              />
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">
              Professional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField
                label="Department"
                value={employee.department?.name || "N/A"}
              />
              <InfoField
                label="Designation"
                value={employee.designation?.title || "N/A"}
              />
              <InfoField
                label="Reporting Manager"
                value={employee.reportingManager?.name || "N/A"}
              />
              <InfoField
                label="Joining Date"
                value={
                  employee.joiningDate
                    ? new Date(employee.joiningDate).toLocaleDateString()
                    : "N/A"
                }
              />
              <InfoField
                label="Confirmation Date"
                value={
                  employee.confirmationDate
                    ? new Date(employee.confirmationDate).toLocaleDateString()
                    : "N/A"
                }
              />
              <InfoField
                label="Employment Type"
                value={employee.employmentType}
              />
              <InfoField
                label="Work Location"
                value={employee.workLocation || "N/A"}
              />
              <InfoField label="Work Shift" value={employee.workShift} />
              <InfoField
                label="Probation Period"
                value={
                  employee.probationPeriod
                    ? `${employee.probationPeriod} months`
                    : "N/A"
                }
              />
              <InfoField
                label="Status"
                value={
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      employee.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : employee.status === "On Leave"
                        ? "bg-blue-100 text-blue-800"
                        : employee.status === "On Probation"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {employee.status}
                  </span>
                }
              />
              {employee.ctc && (
                <InfoField
                  label="CTC"
                  value={`₹${employee.ctc.toLocaleString()}`}
                />
              )}
              {employee.basicSalary && (
                <InfoField
                  label="Basic Salary"
                  value={`₹${employee.basicSalary.toLocaleString()}`}
                />
              )}
            </div>
          </div>

          {/* Address Information */}
          {employee.address && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">
                Address Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <InfoField label="Street" value={employee.address.street} />
                <InfoField label="City" value={employee.address.city} />
                <InfoField label="State" value={employee.address.state} />
                <InfoField label="ZIP Code" value={employee.address.zipCode} />
                <InfoField
                  label="Country"
                  value={employee.address.country || "India"}
                />
              </div>
            </div>
          )}

          {/* Bank Details */}
          {employee.bankDetails && isAdmin && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">
                Bank Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <InfoField
                  label="Account Number"
                  value={employee.bankDetails.accountNumber || "N/A"}
                />
                <InfoField
                  label="Account Holder"
                  value={employee.bankDetails.accountHolderName || "N/A"}
                />
                <InfoField
                  label="Bank Name"
                  value={employee.bankDetails.bankName || "N/A"}
                />
                <InfoField
                  label="IFSC Code"
                  value={employee.bankDetails.ifscCode || "N/A"}
                />
                <InfoField
                  label="Branch"
                  value={employee.bankDetails.branch || "N/A"}
                />
                <InfoField
                  label="Account Type"
                  value={employee.bankDetails.accountType || "N/A"}
                />
              </div>
            </div>
          )}

          {/* Statutory Details */}
          {employee.statutoryDetails && isAdmin && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">
                Statutory Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <InfoField
                  label="PAN Number"
                  value={employee.statutoryDetails.panNumber || "N/A"}
                />
                <InfoField
                  label="Aadhar Number"
                  value={employee.statutoryDetails.aadharNumber || "N/A"}
                />
                <InfoField
                  label="UAN Number"
                  value={employee.statutoryDetails.uanNumber || "N/A"}
                />
                <InfoField
                  label="EPF Number"
                  value={employee.statutoryDetails.epfNumber || "N/A"}
                />
                <InfoField
                  label="ESI Number"
                  value={employee.statutoryDetails.esiNumber || "N/A"}
                />
                <InfoField
                  label="Passport Number"
                  value={employee.statutoryDetails.passportNumber || "N/A"}
                />
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          {employee.emergencyContact && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <InfoField
                  label="Name"
                  value={employee.emergencyContact.name}
                />
                <InfoField
                  label="Relationship"
                  value={employee.emergencyContact.relationship}
                />
                <InfoField
                  label="Phone"
                  value={employee.emergencyContact.phone}
                />
                <InfoField
                  label="Alternate Phone"
                  value={employee.emergencyContact.alternatePhone || "N/A"}
                />
                <InfoField
                  label="Address"
                  value={employee.emergencyContact.address}
                  className="md:col-span-2"
                />
              </div>
            </div>
          )}

          {/* Leave Balance */}
          {employee.leaveBalance && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">
                Leave Balance
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {employee.leaveBalance.casual}
                  </div>
                  <div className="text-xs text-gray-600">Casual</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-green-600">
                    {employee.leaveBalance.sick}
                  </div>
                  <div className="text-xs text-gray-600">Sick</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {employee.leaveBalance.earned}
                  </div>
                  <div className="text-xs text-gray-600">Earned</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-pink-600">
                    {employee.leaveBalance.maternity}
                  </div>
                  <div className="text-xs text-gray-600">Maternity</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {employee.leaveBalance.paternity}
                  </div>
                  <div className="text-xs text-gray-600">Paternity</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {employee.leaveBalance.compOff}
                  </div>
                  <div className="text-xs text-gray-600">Comp Off</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-red-600">
                    {employee.leaveBalance.lossOfPay}
                  </div>
                  <div className="text-xs text-gray-600">LOP</div>
                </div>
              </div>
            </div>
          )}

          {/* Performance */}
          {employee.performance && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">
                Performance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <InfoField
                  label="Current Rating"
                  value={
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-indigo-600">
                        {employee.performance.currentRating}/5
                      </span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <=
                              Math.floor(employee.performance.currentRating)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  }
                />
                <InfoField
                  label="Last Review"
                  value={
                    employee.performance.lastReviewDate
                      ? new Date(
                          employee.performance.lastReviewDate
                        ).toLocaleDateString()
                      : "N/A"
                  }
                />
                <InfoField
                  label="Next Review"
                  value={
                    employee.performance.nextReviewDate
                      ? new Date(
                          employee.performance.nextReviewDate
                        ).toLocaleDateString()
                      : "N/A"
                  }
                />
              </div>
            </div>
          )}

          {/* Education */}
          {employee.education && employee.education.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">
                Education
              </h3>
              <div className="space-y-3">
                {employee.education.map((edu, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {edu.degree}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {edu.institution}
                        </p>
                        {edu.specialization && (
                          <p className="text-sm text-gray-600">
                            Specialization: {edu.specialization}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{edu.yearOfPassing}</p>
                        <p>
                          {edu.percentage}% | {edu.grade}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {employee.workExperience && employee.workExperience.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">
                Work Experience
              </h3>
              <div className="space-y-3">
                {employee.workExperience.map((exp, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {exp.designation}
                        </h3>
                        <p className="text-sm text-gray-600">{exp.company}</p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>
                          {new Date(exp.from).toLocaleDateString()} -{" "}
                          {exp.isCurrent
                            ? "Present"
                            : new Date(exp.to).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {exp.responsibilities && (
                      <p className="text-sm text-gray-700 mt-2">
                        {exp.responsibilities}
                      </p>
                    )}
                    {exp.reasonForLeaving && !exp.isCurrent && (
                      <p className="text-xs text-gray-500 mt-1">
                        Reason for leaving: {exp.reasonForLeaving}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {employee.skills && employee.skills.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {employee.skills.map((skill, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      skill.level === "Expert"
                        ? "bg-green-100 text-green-800"
                        : skill.level === "Advanced"
                        ? "bg-blue-100 text-blue-800"
                        : skill.level === "Intermediate"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {skill.name} ({skill.level}) - {skill.yearsOfExperience} yrs
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {employee.documents && employee.documents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">
                Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employee.documents.map((doc, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {doc.type}
                        </h3>
                        <p className="text-sm text-gray-600">{doc.fileName}</p>
                        <p className="text-xs text-gray-500">
                          Uploaded:{" "}
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          doc.isVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {doc.isVerified ? "Verified" : "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {isAdmin && (
          <div className="flex space-x-3 pt-6 border-t">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Edit Employee
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeesPage;
