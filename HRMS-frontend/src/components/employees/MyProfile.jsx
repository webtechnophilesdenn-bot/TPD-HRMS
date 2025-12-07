// src/components/profile/MyProfile.jsx
import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building,
  CreditCard,
  Edit,
  Save,
  X,
  Camera,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Award,
  Shield,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import { apiService } from "../../services/apiService";

const MyProfile = () => {
  const { user, refreshUser } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [activeTab, setActiveTab] = useState("personal");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Fetch employee profile
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyProfile();
      if (response.success) {
        setEmployeeData(response.data);
        setEditedData(response.data);
      }
    } catch (error) {
      showError("Failed to load profile");
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({ ...employeeData });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({ ...employeeData });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Only send editable fields
      const updateData = {
        phoneNumber: editedData.phoneNumber,
        emergencyContact: editedData.emergencyContact,
        address: editedData.address,
      };

      const response = await apiService.updateMyProfile(updateData);

      if (response.success) {
        setEmployeeData(response.data);
        setEditedData(response.data);
        setIsEditing(false);
        showSuccess("Profile updated successfully!");

        // Trigger employee update event
        window.dispatchEvent(new Event("employeeUpdated"));

        if (refreshUser) {
          await refreshUser();
        }
      }
    } catch (error) {
      showError(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showError("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError("Image size should be less than 5MB");
      return;
    }

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("profilePicture", file);

      const response = await apiService.uploadProfilePicture(formData);

      if (response.success) {
        setEmployeeData(response.data);
        setEditedData(response.data);
        showSuccess("Profile picture updated successfully!");

        // Trigger employee update event
        window.dispatchEvent(new Event("employeeUpdated"));

        if (refreshUser) {
          await refreshUser();
        }
      }
    } catch (error) {
      showError(error.message || "Failed to upload profile picture");
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load profile data</p>
        </div>
      </div>
    );
  }

  const displayData = isEditing ? editedData : employeeData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              My Profile
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              View and manage your profile information
            </p>
          </div>

          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Profile Picture */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold ring-4 ring-indigo-100">
              {displayData.profilePicture ? (
                <img
                  src={displayData.profilePicture}
                  alt={`${displayData.firstName} ${displayData.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {displayData.firstName?.charAt(0)}
                  {displayData.lastName?.charAt(0)}
                </span>
              )}
            </div>

            {/* Upload Photo Button */}
            <label
              htmlFor="profile-photo"
              className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full cursor-pointer hover:bg-indigo-700 transition-all shadow-lg"
            >
              {uploadingPhoto ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </label>
            <input
              id="profile-photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploadingPhoto}
            />
          </div>

          {/* Basic Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-900">
              {displayData.firstName} {displayData.lastName}
            </h2>
            <p className="text-lg text-gray-600 mt-1">
              {displayData.designation?.title || "Employee"}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CreditCard className="w-4 h-4" />
                <span className="font-medium">{displayData.employeeId}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building className="w-4 h-4" />
                <span>{displayData.department?.name || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    displayData.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {displayData.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200 px-4 sm:px-6">
          <div className="flex overflow-x-auto -mb-px">
            {[
              { id: "personal", label: "Personal Info", icon: User },
              { id: "employment", label: "Employment", icon: Briefcase },
              { id: "salary", label: "Salary", icon: DollarSign },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* Personal Information Tab */}
          {activeTab === "personal" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <InfoField
                  icon={User}
                  label="First Name"
                  value={displayData.firstName}
                  editable={false}
                />
                <InfoField
                  icon={User}
                  label="Last Name"
                  value={displayData.lastName}
                  editable={false}
                />
                <InfoField
                  icon={Mail}
                  label="Email"
                  value={displayData.email}
                  editable={false}
                />
                <InfoField
                  icon={Phone}
                  label="Phone Number"
                  value={displayData.phoneNumber}
                  isEditing={isEditing}
                  onChange={(value) => handleInputChange("phoneNumber", value)}
                />
                <InfoField
                  icon={Calendar}
                  label="Date of Birth"
                  value={
                    displayData.dateOfBirth
                      ? new Date(displayData.dateOfBirth).toLocaleDateString()
                      : "N/A"
                  }
                  editable={false}
                />
                <InfoField
                  icon={User}
                  label="Gender"
                  value={displayData.gender || "N/A"}
                  editable={false}
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Address Information
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  <InfoField
                    icon={MapPin}
                    label="Street Address"
                    value={displayData.address?.street}
                    isEditing={isEditing}
                    onChange={(value) =>
                      handleInputChange("address", {
                        ...displayData.address,
                        street: value,
                      })
                    }
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InfoField
                      icon={MapPin}
                      label="City"
                      value={displayData.address?.city}
                      isEditing={isEditing}
                      onChange={(value) =>
                        handleInputChange("address", {
                          ...displayData.address,
                          city: value,
                        })
                      }
                    />
                    <InfoField
                      icon={MapPin}
                      label="State"
                      value={displayData.address?.state}
                      isEditing={isEditing}
                      onChange={(value) =>
                        handleInputChange("address", {
                          ...displayData.address,
                          state: value,
                        })
                      }
                    />
                    <InfoField
                      icon={MapPin}
                      label="Postal Code"
                      value={displayData.address?.postalCode}
                      isEditing={isEditing}
                      onChange={(value) =>
                        handleInputChange("address", {
                          ...displayData.address,
                          postalCode: value,
                        })
                      }
                    />
                  </div>
                  <InfoField
                    icon={MapPin}
                    label="Country"
                    value={displayData.address?.country}
                    isEditing={isEditing}
                    onChange={(value) =>
                      handleInputChange("address", {
                        ...displayData.address,
                        country: value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <InfoField
                    icon={User}
                    label="Contact Name"
                    value={displayData.emergencyContact?.name}
                    isEditing={isEditing}
                    onChange={(value) =>
                      handleInputChange("emergencyContact", {
                        ...displayData.emergencyContact,
                        name: value,
                      })
                    }
                  />
                  <InfoField
                    icon={User}
                    label="Relationship"
                    value={displayData.emergencyContact?.relationship}
                    isEditing={isEditing}
                    onChange={(value) =>
                      handleInputChange("emergencyContact", {
                        ...displayData.emergencyContact,
                        relationship: value,
                      })
                    }
                  />
                  <InfoField
                    icon={Phone}
                    label="Contact Phone"
                    value={displayData.emergencyContact?.phone}
                    isEditing={isEditing}
                    onChange={(value) =>
                      handleInputChange("emergencyContact", {
                        ...displayData.emergencyContact,
                        phone: value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Employment Information Tab */}
          {activeTab === "employment" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <InfoField
                  icon={CreditCard}
                  label="Employee ID"
                  value={displayData.employeeId}
                  editable={false}
                />
                <InfoField
                  icon={Calendar}
                  label="Join Date"
                  value={
                    displayData.joiningDate
                      ? new Date(displayData.joiningDate).toLocaleDateString()
                      : "N/A"
                  }
                  editable={false}
                />
                <InfoField
                  icon={Building}
                  label="Department"
                  value={displayData.department?.name || "N/A"}
                  editable={false}
                />
                <InfoField
                  icon={Briefcase}
                  label="Designation"
                  value={displayData.designation?.title || "N/A"}
                  editable={false}
                />
                <InfoField
                  icon={User}
                  label="Reporting Manager"
                  value={
                    displayData.reportingManager
                      ? `${displayData.reportingManager.firstName} ${displayData.reportingManager.lastName}`
                      : "N/A"
                  }
                  editable={false}
                />
                <InfoField
                  icon={Briefcase}
                  label="Employment Type"
                  value={displayData.employmentType || "N/A"}
                  editable={false}
                />
                <InfoField
                  icon={CheckCircle}
                  label="Status"
                  value={displayData.status}
                  editable={false}
                  badge
                  badgeColor={
                    displayData.status === "Active" ? "green" : "red"
                  }
                />
                <InfoField
                  icon={Clock}
                  label="Work Schedule"
                  value={displayData.workSchedule || "N/A"}
                  editable={false}
                />
              </div>

              {displayData.probationEndDate && (
                <div className="pt-4 border-t border-gray-200">
                  <InfoField
                    icon={Calendar}
                    label="Probation End Date"
                    value={new Date(
                      displayData.probationEndDate
                    ).toLocaleDateString()}
                    editable={false}
                  />
                </div>
              )}
            </div>
          )}

          {/* Salary Information Tab */}
          {activeTab === "salary" && (
            <div className="space-y-6">
              {displayData.salary ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <InfoField
                      icon={DollarSign}
                      label="Basic Salary"
                      value={`₹${displayData.salary.basicSalary?.toLocaleString() || 0}`}
                      editable={false}
                    />
                    <InfoField
                      icon={DollarSign}
                      label="HRA"
                      value={`₹${displayData.salary.hra?.toLocaleString() || 0}`}
                      editable={false}
                    />
                    <InfoField
                      icon={Award}
                      label="Allowances"
                      value={`₹${displayData.salary.allowances?.toLocaleString() || 0}`}
                      editable={false}
                    />
                    <InfoField
                      icon={DollarSign}
                      label="Gross Salary"
                      value={`₹${displayData.salary.grossSalary?.toLocaleString() || 0}`}
                      editable={false}
                      highlight
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Deductions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <InfoField
                        icon={Shield}
                        label="PF"
                        value={`₹${displayData.salary.deductions?.pf?.toLocaleString() || 0}`}
                        editable={false}
                      />
                      <InfoField
                        icon={Shield}
                        label="ESI"
                        value={`₹${displayData.salary.deductions?.esi?.toLocaleString() || 0}`}
                        editable={false}
                      />
                      <InfoField
                        icon={Shield}
                        label="Tax"
                        value={`₹${displayData.salary.deductions?.tax?.toLocaleString() || 0}`}
                        editable={false}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <InfoField
                      icon={DollarSign}
                      label="Net Salary"
                      value={`₹${displayData.salary.netSalary?.toLocaleString() || 0}`}
                      editable={false}
                      highlight
                      large
                    />
                  </div>

                  {displayData.salary.bankDetails && (
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Bank Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <InfoField
                          icon={CreditCard}
                          label="Account Number"
                          value={displayData.salary.bankDetails.accountNumber}
                          editable={false}
                          sensitive
                        />
                        <InfoField
                          icon={Building}
                          label="Bank Name"
                          value={displayData.salary.bankDetails.bankName}
                          editable={false}
                        />
                        <InfoField
                          icon={CreditCard}
                          label="IFSC Code"
                          value={displayData.salary.bankDetails.ifscCode}
                          editable={false}
                        />
                        <InfoField
                          icon={Building}
                          label="Branch"
                          value={displayData.salary.bankDetails.branch}
                          editable={false}
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No salary information available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// InfoField Component
const InfoField = ({
  icon: Icon,
  label,
  value,
  isEditing,
  onChange,
  editable = true,
  badge = false,
  badgeColor = "gray",
  highlight = false,
  large = false,
  sensitive = false,
}) => {
  const [showSensitive, setShowSensitive] = useState(false);

  const badgeColors = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-700",
  };

  const displayValue = () => {
    if (sensitive && !showSensitive) {
      return "••••••••";
    }
    return value || "N/A";
  };

  return (
    <div className={`${highlight ? "bg-indigo-50 p-4 rounded-xl border border-indigo-100" : ""}`}>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </label>

      {isEditing && editable ? (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      ) : badge ? (
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${badgeColors[badgeColor]}`}>
          {value}
        </span>
      ) : (
        <div className="flex items-center gap-2">
          <p className={`text-gray-900 ${large ? "text-2xl font-bold" : "font-medium"}`}>
            {displayValue()}
          </p>
          {sensitive && (
            <button
              onClick={() => setShowSensitive(!showSensitive)}
              className="text-xs text-indigo-600 hover:text-indigo-700"
            >
              {showSensitive ? "Hide" : "Show"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MyProfile;
