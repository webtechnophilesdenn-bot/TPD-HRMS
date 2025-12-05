import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Link, Lock, Video, Plus, Trash2 } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const CreateMeetingModal = ({ meeting, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // ✅ FIXED: Complete formData initialization with all new fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Team Meeting',
    startTime: '',
    endTime: '',
    duration: 60,
    participants: [],
    privacy: 'Custom',
    visibleToDepartments: [],
    visibleToTeams: [],
    visibleToRoles: [],
    requiresPassword: false,
    password: '',
    waitingRoom: false,
    allowGuestJoin: true,
    recordingEnabled: false,
    agenda: [],
    actionItems: [], // ✅ Initialize as empty array
    requiresApproval: false,
    approvers: [],
    resources: [],
  });

  const [agendaItem, setAgendaItem] = useState('');

  useEffect(() => {
    loadEmployees();
    loadDepartments();
    
    if (meeting) {
      setFormData({
        title: meeting.title || '',
        description: meeting.description || '',
        type: meeting.type || 'Team Meeting',
        startTime: meeting.startTime ? new Date(meeting.startTime).toISOString().slice(0, 16) : '',
        endTime: meeting.endTime ? new Date(meeting.endTime).toISOString().slice(0, 16) : '',
        duration: meeting.duration || 60,
        participants: meeting.participants?.map(p => p.employee?._id || p.employee) || [],
        privacy: meeting.privacy || 'Custom',
        visibleToDepartments: meeting.visibleToDepartments?.map(d => d._id || d) || [],
        visibleToTeams: meeting.visibleToTeams || [],
        visibleToRoles: meeting.visibleToRoles || [],
        requiresPassword: meeting.requiresPassword || false,
        password: meeting.password || '',
        waitingRoom: meeting.waitingRoom || false,
        allowGuestJoin: meeting.allowGuestJoin !== undefined ? meeting.allowGuestJoin : true,
        recordingEnabled: meeting.recordingEnabled || false,
        agenda: meeting.agenda || [],
        actionItems: meeting.actionItems || [],
        requiresApproval: meeting.requiresApproval || false,
        approvers: meeting.approvers?.map(a => a.employee?._id || a.employee) || [],
        resources: meeting.resources || [],
      });
    } else {
      // Set default start time to 30 minutes from now
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);
      setFormData(prev => ({
        ...prev,
        startTime: now.toISOString().slice(0, 16),
      }));
    }
  }, [meeting]);

  useEffect(() => {
    if (formData.startTime && formData.duration) {
      const start = new Date(formData.startTime);
      const end = new Date(start.getTime() + formData.duration * 60000);
      setFormData(prev => ({
        ...prev,
        endTime: end.toISOString().slice(0, 16),
      }));
    }
  }, [formData.startTime, formData.duration]);

  const loadEmployees = async () => {
    try {
      const response = await apiService.getAllEmployees();
      const employeeData = response.data?.employees || response.data || [];
      setEmployees(Array.isArray(employeeData) ? employeeData : []);
    } catch (error) {
      console.error('Failed to load employees:', error);
      setEmployees([]);
      showError('Failed to load employees');
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await apiService.getAllDepartments();
      const deptData = response.data?.departments || response.data || [];
      setDepartments(Array.isArray(deptData) ? deptData : []);
    } catch (error) {
      console.error('Failed to load departments:', error);
      setDepartments([]);
    }
  };

  const handleAddAgenda = () => {
    if (agendaItem.trim()) {
      setFormData(prev => ({
        ...prev,
        agenda: [...prev.agenda, agendaItem.trim()],
      }));
      setAgendaItem('');
    }
  };

  const handleRemoveAgenda = (index) => {
    setFormData(prev => ({
      ...prev,
      agenda: prev.agenda.filter((_, i) => i !== index),
    }));
  };

  const handleAddActionItem = () => {
    setFormData(prev => ({
      ...prev,
      actionItems: [
        ...prev.actionItems,
        { title: '', description: '', assignedTo: '', dueDate: '', priority: 'Medium' },
      ],
    }));
  };

  const handleRemoveActionItem = (index) => {
    setFormData(prev => ({
      ...prev,
      actionItems: prev.actionItems.filter((_, i) => i !== index),
    }));
  };

  const handleActionItemChange = (index, field, value) => {
    setFormData(prev => {
      const newActionItems = [...prev.actionItems];
      newActionItems[index] = { ...newActionItems[index], [field]: value };
      return { ...prev, actionItems: newActionItems };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showError('Please enter meeting title');
      return;
    }

    if (!formData.startTime) {
      showError('Please select start time');
      return;
    }

    // Validate action items
    const invalidActionItems = formData.actionItems.filter(
      item => item.title.trim() && !item.assignedTo
    );
    if (invalidActionItems.length > 0) {
      showError('Please assign all action items to someone');
      return;
    }

    try {
      setLoading(true);

      const meetingData = {
        ...formData,
        participants: formData.participants.map(empId => ({
          employee: empId,
          status: 'Invited',
          isRequired: true,
        })),
        // Filter out empty action items
        actionItems: formData.actionItems.filter(item => item.title.trim()),
      };

      if (meeting) {
        await apiService.updateMeeting(meeting._id, meetingData);
        showSuccess('Meeting updated successfully');
      } else {
        await apiService.createMeeting(meetingData);
        showSuccess('Meeting created successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('Submit error:', error);
      showError(error.message || 'Failed to save meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {meeting ? 'Edit Meeting' : 'Create New Meeting'}
              </h2>
              <p className="text-sm text-gray-500">
                {meeting ? 'Update meeting details' : 'Schedule a new meeting'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Weekly Team Standup"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add meeting description..."
              />
            </div>

            {/* Meeting Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Team Meeting">Team Meeting</option>
                <option value="Interview">Interview</option>
                <option value="Training">Training</option>
                <option value="One-on-One">One-on-One</option>
                <option value="Client Meeting">Client Meeting</option>
                <option value="All Hands">All Hands</option>
                <option value="Performance Review">Performance Review</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Privacy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Privacy
              </label>
              <select
                value={formData.privacy}
                onChange={(e) => setFormData(prev => ({ ...prev, privacy: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Custom">Custom (Selected Participants)</option>
                <option value="Public">Public (All Employees)</option>
                <option value="Department">Department-wide</option>
                <option value="Team">Team-wide</option>
                <option value="Private">Private (Invite Only)</option>
              </select>
            </div>

            {/* Department Selection (if Department privacy selected) */}
            {formData.privacy === 'Department' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Departments
                </label>
                <select
                  multiple
                  value={formData.visibleToDepartments}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData(prev => ({ ...prev, visibleToDepartments: selected }));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  size={4}
                >
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Hold Ctrl/Cmd to select multiple departments
                </p>
              </div>
            )}

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="15"
                step="15"
              />
            </div>

            {/* Participants (Only show for Custom/Private privacy) */}
            {(formData.privacy === 'Custom' || formData.privacy === 'Private') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Participants
                </label>
                <select
                  multiple
                  value={formData.participants}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData(prev => ({ ...prev, participants: selected }));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  size={5}
                >
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} - {emp.email}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Hold Ctrl/Cmd to select multiple participants
                </p>
              </div>
            )}
          </div>

          {/* Agenda Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agenda Items
            </label>
            <div className="space-y-2">
              {formData.agenda.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAgenda(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={agendaItem}
                  onChange={(e) => setAgendaItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAgenda())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add agenda item..."
                />
                <button
                  type="button"
                  onClick={handleAddAgenda}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Items
            </label>
            <div className="space-y-3">
              {formData.actionItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Action item title *"
                      value={item.title}
                      onChange={(e) => handleActionItemChange(index, 'title', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveActionItem(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <textarea
                    placeholder="Description (optional)"
                    value={item.description}
                    onChange={(e) => handleActionItemChange(index, 'description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                      value={item.assignedTo}
                      onChange={(e) => handleActionItemChange(index, 'assignedTo', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Assign to *</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={item.dueDate}
                      onChange={(e) => handleActionItemChange(index, 'dueDate', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Due date"
                    />
                    <select
                      value={item.priority}
                      onChange={(e) => handleActionItemChange(index, 'priority', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddActionItem}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Add Action Item
              </button>
            </div>
          </div>

          {/* Meeting Settings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Meeting Settings</h3>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="requiresPassword"
                checked={formData.requiresPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, requiresPassword: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="requiresPassword" className="text-sm text-gray-700">
                <Lock className="w-4 h-4 inline mr-1" />
                Require password to join
              </label>
            </div>

            {formData.requiresPassword && (
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter meeting password"
              />
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="waitingRoom"
                checked={formData.waitingRoom}
                onChange={(e) => setFormData(prev => ({ ...prev, waitingRoom: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="waitingRoom" className="text-sm text-gray-700">
                Enable waiting room
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowGuestJoin"
                checked={formData.allowGuestJoin}
                onChange={(e) => setFormData(prev => ({ ...prev, allowGuestJoin: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="allowGuestJoin" className="text-sm text-gray-700">
                Allow guest participants
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="recordingEnabled"
                checked={formData.recordingEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, recordingEnabled: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="recordingEnabled" className="text-sm text-gray-700">
                Enable recording
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : meeting ? 'Update Meeting' : 'Create Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeetingModal;
