import React, { useState, useEffect } from 'react';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Link as LinkIcon,
  Copy,
  Check,
  Edit,
  Trash2,
  ExternalLink,
  Filter,
  Search,
  RefreshCw,
  VideoOff,
  AlertCircle
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import CreateMeetingModal from './CreateMeetingModal';

const MeetingsPage = ({ onJoinMeeting }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
  });

  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    loadMeetings();
  }, [activeTab]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadMeetings();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [filters.search, filters.type, filters.status]);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      
      const filterParams = {
        type: filters.type || '',
        search: filters.search || '',
      };

      if (activeTab === 'upcoming') {
        filterParams.status = 'Scheduled';
      } else if (activeTab === 'past') {
        filterParams.status = 'Completed';
      } else if (filters.status) {
        filterParams.status = filters.status;
      }

      console.log('Loading meetings with filters:', filterParams);

      const response = await apiService.getAllMeetings(filterParams);
      
      console.log('API Response:', response);
      
      const meetingsData = response.data?.meetings || response.data || [];
      setMeetings(Array.isArray(meetingsData) ? meetingsData : []);
      
    } catch (error) {
      console.error('Load meetings error:', error);
      showError('Failed to load meetings');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (meetingLink, meetingId) => {
    navigator.clipboard.writeText(meetingLink);
    setCopiedId(meetingId);
    showSuccess('Meeting link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleJoinMeetingClick = (meetingId) => {
    if (onJoinMeeting) {
      onJoinMeeting(meetingId);
    }
  };

  const handleEditMeeting = (meeting) => {
    setSelectedMeeting(meeting);
    setShowCreateModal(true);
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        await apiService.deleteMeeting(meetingId);
        showSuccess('Meeting deleted successfully');
        loadMeetings();
      } catch (error) {
        showError('Failed to delete meeting');
      }
    }
  };

  const handleCancelMeeting = async (meetingId) => {
    if (window.confirm('Are you sure you want to cancel this meeting?')) {
      try {
        await apiService.cancelMeeting(meetingId);
        showSuccess('Meeting cancelled successfully');
        loadMeetings();
      } catch (error) {
        showError('Failed to cancel meeting');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Scheduled': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-green-100 text-green-800',
      'Completed': 'bg-gray-100 text-gray-800',
      'Cancelled': 'bg-red-100 text-red-800',
    };
    return statusConfig[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      'Interview': 'bg-purple-100 text-purple-800',
      'Team Meeting': 'bg-indigo-100 text-indigo-800',
      'Training': 'bg-yellow-100 text-yellow-800',
      'One-on-One': 'bg-pink-100 text-pink-800',
      'Client Meeting': 'bg-teal-100 text-teal-800',
    };
    return typeConfig[type] || 'bg-gray-100 text-gray-800';
  };

  const isUpcoming = (startTime) => {
    return new Date(startTime) > new Date();
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600 mt-1">Schedule and manage your meetings</p>
        </div>
        <button
          onClick={() => {
            setSelectedMeeting(null);
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>New Meeting</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium ${
              activeTab === 'upcoming'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium ${
              activeTab === 'past'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Past
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Meetings
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search meetings..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            <option value="Interview">Interview</option>
            <option value="Team Meeting">Team Meeting</option>
            <option value="Training">Training</option>
            <option value="One-on-One">One-on-One</option>
            <option value="Client Meeting">Client Meeting</option>
          </select>

          {activeTab === 'all' && (
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          )}

          <button
            onClick={loadMeetings}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <VideoOff className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No meetings found</h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'upcoming' 
                ? "You don't have any upcoming meetings"
                : activeTab === 'past'
                ? "You don't have any past meetings"
                : "No meetings match your filters"}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Schedule New Meeting</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((meeting) => (
            <div
              key={meeting._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {meeting.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(meeting.status)}`}>
                        {meeting.status}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeBadge(meeting.type)}`}>
                        {meeting.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meeting Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(meeting.startTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>
                      {new Date(meeting.startTime).toLocaleTimeString()} - {meeting.duration} min
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{meeting.participants?.length || 0} participants</span>
                  </div>

                  {/* Organizer */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 text-sm font-medium">
                        {meeting.organizer?.firstName?.[0]}
                        {meeting.organizer?.lastName?.[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {meeting.organizer?.firstName} {meeting.organizer?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">Organizer</p>
                    </div>
                  </div>
                </div>

                {/* Meeting Link */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <LinkIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600 truncate">
                        {meeting.meetingLink}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyLink(meeting.meetingLink, meeting._id)}
                      className="ml-2 p-1 hover:bg-gray-200 rounded"
                      title="Copy link"
                    >
                      {copiedId === meeting._id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {meeting.status === 'Scheduled' && isUpcoming(meeting.startTime) && (
                    <>
                      <button
                        onClick={() => handleJoinMeetingClick(meeting.meetingId)}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2"
                      >
                        <Video className="h-4 w-4" />
                        <span>Join</span>
                      </button>
                      <button
                        onClick={() => handleEditMeeting(meeting)}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleCancelMeeting(meeting._id)}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        title="Cancel"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </>
                  )}

                  {meeting.status === 'In Progress' && (
                    <button
                      onClick={() => handleJoinMeetingClick(meeting.meetingId)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                    >
                      <Video className="h-4 w-4 animate-pulse" />
                      <span>Join Now</span>
                    </button>
                  )}

                  {meeting.status === 'Completed' && (
                    <div className="flex-1 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-center">
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                  )}

                  {meeting.status === 'Cancelled' && (
                    <div className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-center">
                      <span className="text-sm font-medium">Cancelled</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Meeting Modal */}
      {showCreateModal && (
        <CreateMeetingModal
          meeting={selectedMeeting}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedMeeting(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setSelectedMeeting(null);
            loadMeetings();
          }}
        />
      )}
    </div>
  );
};

export default MeetingsPage;
