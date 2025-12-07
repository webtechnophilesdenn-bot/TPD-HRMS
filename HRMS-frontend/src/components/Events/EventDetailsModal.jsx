// src/components/Events/EventDetailsModal.jsx
import React from 'react';
import { X, MapPin, Clock, Users, Video, Calendar } from 'lucide-react';

const EventDetailsModal = ({ event, onClose, onRSVP, isAdmin }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      Scheduled: 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-green-100 text-green-800',
      Completed: 'bg-gray-100 text-gray-800',
      Cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                {event.status}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {event.type}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          {/* Description */}
          {event.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-gray-700">{event.description}</p>
            </div>
          )}

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Clock className="h-5 w-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Start Time</p>
                <p className="text-sm text-gray-600 mt-1">{formatDate(event.startDate)}</p>
              </div>
            </div>

            {/* End Date */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">End Time</p>
                <p className="text-sm text-gray-600 mt-1">{formatDate(event.endDate)}</p>
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-indigo-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Location</p>
                  <p className="text-sm text-gray-600 mt-1">{event.location}</p>
                </div>
              </div>
            )}

            {/* Attendees */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Users className="h-5 w-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Attendees</p>
                <p className="text-sm text-gray-600 mt-1">
                  {event.attendees?.length || 0} people registered
                </p>
              </div>
            </div>

            {/* Meeting Link */}
            {event.meetingLink && (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg col-span-full">
                <Video className="h-5 w-5 text-indigo-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Meeting Link</p>
                  <a
                    href={event.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline mt-1 inline-block"
                  >
                    {event.meetingLink}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Organizer */}
          {event.organizer && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Organized by</h3>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {event.organizer.firstName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {event.organizer.firstName} {event.organizer.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{event.organizer.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* RSVP Buttons (Employee only, not for admin) */}
          {!isAdmin && event.status === 'Scheduled' && (
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  onRSVP(event._id, 'Accepted');
                  onClose();
                }}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                ✓ Accept
              </button>
              <button
                onClick={() => {
                  onRSVP(event._id, 'Maybe');
                  onClose();
                }}
                className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
              >
                ? Maybe
              </button>
              <button
                onClick={() => {
                  onRSVP(event._id, 'Declined');
                  onClose();
                }}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                ✗ Decline
              </button>
            </div>
          )}

          {/* Close button for admin */}
          {isAdmin && (
            <div className="pt-4 border-t">
              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
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

export default EventDetailsModal;
