import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Plus,
  Filter,
  Search,
  Pin,
  ThumbsUp,
  MessageCircle,
  Eye,
  CheckCircle,
  Calendar,
  Clock,
  Edit,
  Trash2,
  Heart,
  Award,
  TrendingUp,
  Sparkles,
  X,
  Send,
  PinOff,
  AlertCircle
} from "lucide-react";

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
    category: "",
    priority: "",
    search: "",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadAnnouncements();
  }, [filters, pagination.currentPage]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/announcements?${new URLSearchParams({
          ...filters,
          page: pagination.currentPage,
          limit: 10,
        })}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setAnnouncements(data.data.announcements || []);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Failed to load announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (announcementId, type) => {
    try {
      await fetch(
        `http://localhost:5000/api/v1/announcements/${announcementId}/react`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ type }),
        }
      );
      loadAnnouncements();
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  };

  const handleComment = async (announcementId) => {
    if (!commentText.trim()) return;
    try {
      await fetch(
        `http://localhost:5000/api/v1/announcements/${announcementId}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ content: commentText }),
        }
      );
      setCommentText("");
      loadAnnouncements();
      if (showDetailsModal) {
        loadAnnouncementDetails(announcementId);
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleAcknowledge = async (announcementId) => {
    try {
      await fetch(
        `http://localhost:5000/api/v1/announcements/${announcementId}/acknowledge`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      loadAnnouncements();
    } catch (error) {
      console.error("Failed to acknowledge:", error);
    }
  };

  const handleTogglePin = async (announcementId) => {
    try {
      await fetch(
        `http://localhost:5000/api/v1/announcements/${announcementId}/pin`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      loadAnnouncements();
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const handleDelete = async (announcementId) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await fetch(
        `http://localhost:5000/api/v1/announcements/${announcementId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      loadAnnouncements();
      setShowDetailsModal(false);
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const loadAnnouncementDetails = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/announcements/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setSelectedAnnouncement(data.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error("Failed to load announcement details:", error);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Low: "bg-gray-100 text-gray-800 border-gray-300",
      Normal: "bg-blue-100 text-blue-800 border-blue-300",
      High: "bg-orange-100 text-orange-800 border-orange-300",
      Urgent: "bg-red-100 text-red-800 border-red-300",
    };
    return colors[priority] || colors.Normal;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      General: Megaphone,
      Holiday: Calendar,
      Event: Sparkles,
      Achievement: Award,
      Emergency: AlertCircle,
      "Company News": TrendingUp,
    };
    return icons[category] || Megaphone;
  };

  const canManageAnnouncements = () => {
    return ["admin", "hr", "manager"].includes(user?.role);
  };

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "General",
    priority: "Normal",
    visibility: "All",
    acknowledgmentRequired: false,
    sendEmail: false,
  });

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/v1/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        setFormData({
          title: "",
          content: "",
          category: "General",
          priority: "Normal",
          visibility: "All",
          acknowledgmentRequired: false,
          sendEmail: false,
        });
        loadAnnouncements();
      }
    } catch (error) {
      console.error("Failed to create announcement:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Megaphone className="h-8 w-8 text-indigo-600" />
              Announcements
            </h1>
            <p className="text-gray-600 mt-1">
              Stay updated with the latest company news and updates
            </p>
          </div>
          {canManageAnnouncements() && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Announcement
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              <option value="General">General</option>
              <option value="Holiday">Holiday</option>
              <option value="Event">Event</option>
              <option value="Achievement">Achievement</option>
              <option value="Emergency">Emergency</option>
              <option value="Company News">Company News</option>
            </select>
            <select
              value={filters.priority}
              onChange={(e) =>
                setFilters({ ...filters, priority: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
            <button
              onClick={() => setFilters({ category: "", priority: "", search: "" })}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="max-w-7xl mx-auto space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Megaphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No announcements found
            </h3>
            <p className="text-gray-600">
              Check back later for updates and important news
            </p>
          </div>
        ) : (
          announcements.map((announcement) => {
            const CategoryIcon = getCategoryIcon(announcement.category);
            return (
              <div
                key={announcement._id}
                className={`bg-white rounded-xl shadow-sm border-l-4 transition-all hover:shadow-md ${
                  announcement.isPinned
                    ? "border-yellow-400 bg-yellow-50"
                    : announcement.priority === "Urgent"
                    ? "border-red-500"
                    : announcement.priority === "High"
                    ? "border-orange-500"
                    : "border-indigo-500"
                }`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`p-3 rounded-lg ${
                          announcement.isPinned
                            ? "bg-yellow-100"
                            : announcement.priority === "Urgent"
                            ? "bg-red-100"
                            : announcement.priority === "High"
                            ? "bg-orange-100"
                            : "bg-indigo-100"
                        }`}
                      >
                        <CategoryIcon
                          className={`h-6 w-6 ${
                            announcement.isPinned
                              ? "text-yellow-600"
                              : announcement.priority === "Urgent"
                              ? "text-red-600"
                              : announcement.priority === "High"
                              ? "text-orange-600"
                              : "text-indigo-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {announcement.isPinned && (
                            <Pin className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                          )}
                          <h3 className="text-xl font-semibold text-gray-900">
                            {announcement.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(announcement.publishDate).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{announcement.category}</span>
                          <span>•</span>
                          <span>
                            {announcement.createdBy?.firstName}{" "}
                            {announcement.createdBy?.lastName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(
                          announcement.priority
                        )}`}
                      >
                        {announcement.priority}
                      </span>
                      {canManageAnnouncements() && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleTogglePin(announcement._id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title={announcement.isPinned ? "Unpin" : "Pin"}
                          >
                            {announcement.isPinned ? (
                              <PinOff className="h-4 w-4 text-gray-600" />
                            ) : (
                              <Pin className="h-4 w-4 text-gray-600" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(announcement._id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {announcement.content}
                  </p>

                  {/* Engagement Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {announcement.totalViews || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {announcement.totalReactions || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {announcement.totalComments || 0}
                      </span>
                      {announcement.acknowledgmentRequired && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          {announcement.totalAcknowledgments || 0} acknowledged
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReaction(announcement._id, "like")}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors text-blue-600"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Like
                      </button>
                      <button
                        onClick={() => loadAnnouncementDetails(announcement._id)}
                        className="px-4 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Acknowledgment Required */}
                  {announcement.acknowledgmentRequired && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-800">
                          <AlertCircle className="h-5 w-5" />
                          <span className="font-medium">
                            Acknowledgment Required
                          </span>
                        </div>
                        <button
                          onClick={() => handleAcknowledge(announcement._id)}
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          Acknowledge
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() =>
                setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })
              }
              disabled={pagination.currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })
              }
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedAnnouncement.title}
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedAnnouncement.content}
                </p>
              </div>

              {/* Comments Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Comments ({selectedAnnouncement.totalComments || 0})
                </h3>
                <div className="space-y-4 mb-4">
                  {selectedAnnouncement.comments?.map((comment, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">
                            {comment.employee?.firstName?.[0]}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="font-medium text-sm text-gray-900">
                            {comment.employee?.firstName}{" "}
                            {comment.employee?.lastName}
                          </p>
                          <p className="text-gray-700 mt-1">{comment.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleComment(selectedAnnouncement._id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleComment(selectedAnnouncement._id)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Create Announcement</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="p-6 space-y-3">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter announcement title"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter announcement content"
                />
              </div>

              {/* Category and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="General">General</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Event">Event</option>
                    <option value="Policy Update">Policy Update</option>
                    <option value="Achievement">Achievement</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Work Anniversary">Work Anniversary</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Training">Training</option>
                    <option value="Company News">Company News</option>
                    <option value="System Update">System Update</option>
                    <option value="Celebration">Celebration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) =>
                    setFormData({ ...formData, visibility: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="All">All Employees</option>
                  <option value="Departments">Specific Departments</option>
                  <option value="Designations">Specific Designations</option>
                  <option value="Locations">Specific Locations</option>
                  <option value="Employees">Specific Employees</option>
                </select>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.acknowledgmentRequired}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        acknowledgmentRequired: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">
                    Require acknowledgment from employees
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.sendEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sendEmail: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">
                    Send email notification
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;