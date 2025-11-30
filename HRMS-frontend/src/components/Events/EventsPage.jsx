// src/components/Events/EventsPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Users,
  Video,
  Filter,
  Search,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import { apiService } from '../../services/apiService';
import EventCalendar from './EventCalendar';
import EventModal from './EventModal';
import EventDetailsModal from './EventDetailsModal';

const EventsPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState('calendar'); // 'calendar' or 'list'
  
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, filters]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllEvents({
        limit: 100,
      });
      setEvents(response.data?.events || []);
    } catch (error) {
      showError('Failed to load events');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          event.description?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter((event) => event.type === filters.type);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((event) => event.status === filters.status);
    }

    setFilteredEvents(filtered);
  };

  const handleCreateEvent = async (eventData) => {
    try {
      await apiService.createEvent(eventData);
      showSuccess('Event created successfully');
      setShowCreateModal(false);
      loadEvents();
    } catch (error) {
      showError('Failed to create event');
      console.error(error);
    }
  };

  const handleUpdateEvent = async (eventId, updates) => {
    try {
      await apiService.updateEvent(eventId, updates);
      showSuccess('Event updated successfully');
      loadEvents();
    } catch (error) {
      showError('Failed to update event');
      console.error(error);
    }
  };

  const handleRSVP = async (eventId, status) => {
    try {
      await apiService.rsvpToEvent(eventId, status);
      showSuccess(`RSVP ${status.toLowerCase()} successfully`);
      loadEvents();
    } catch (error) {
      showError('Failed to update RSVP');
      console.error(error);
    }
  };

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  const eventTypes = [
    'Company Meeting',
    'Training',
    'Holiday',
    'Team Building',
    'Birthday',
    'Anniversary',
    'Town Hall',
    'Workshop',
    'Conference',
    'Other',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events Calendar</h1>
          <p className="text-gray-600 mt-1">Manage and track company events</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Event
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setView('calendar')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'calendar'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {view === 'calendar' ? (
        <EventCalendar
          events={filteredEvents}
          onEventClick={handleViewDetails}
          onEventUpdate={handleUpdateEvent}
        />
      ) : (
        <EventList
          events={filteredEvents}
          onEventClick={handleViewDetails}
          onRSVP={handleRSVP}
          isAdmin={isAdmin}
        />
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <EventModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateEvent}
        />
      )}

      {/* Event Details Modal */}
      {showDetailsModal && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedEvent(null);
          }}
          onRSVP={handleRSVP}
          onUpdate={handleUpdateEvent}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

// Event List Component
const EventList = ({ events, onEventClick, onRSVP, isAdmin }) => {
  const getStatusColor = (status) => {
    const colors = {
      Scheduled: 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-green-100 text-green-800',
      Completed: 'bg-gray-100 text-gray-800',
      Cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">No events found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div
          key={event._id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onEventClick(event)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                  {event.status}
                </span>
              </div>

              <p className="text-gray-600 mb-4">{event.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{formatDate(event.startDate)}</span>
                </div>

                {event.location && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{event.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-700">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>{event.attendees?.length || 0} Attendees</span>
                </div>
              </div>
            </div>

            {!isAdmin && event.status === 'Scheduled' && (
              <div className="flex gap-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRSVP(event._id, 'Accepted');
                  }}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Accept
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRSVP(event._id, 'Declined');
                  }}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventsPage;
