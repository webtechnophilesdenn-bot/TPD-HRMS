import React, { useState, useEffect } from "react";
import { Plus, Calendar as CalendarIcon, List, RefreshCw } from "lucide-react";
import EventCalendar from "./EventCalendar";
import EventModal from "./EventModal";
import EventDetailsModal from "./EventDetailsModal";
import { apiService } from "../../services/apiService";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";

const EventsPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [view, setView] = useState("calendar"); // 'calendar' or 'list'
  const [events, setEvents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [optimisticEvents, setOptimisticEvents] = useState([]); // New: for instant UI updates
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const isAdminOrHR = user?.role === "admin" || user?.role === "hr";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setOptimisticEvents([]); // Clear optimistic events on refresh
      await Promise.all([loadEvents(), loadMeetings()]);
    } catch (error) {
      console.error("Failed to load data:", error);
      showError("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const response = await apiService.getAllEvents({});
      // eventController.getAllEvents => { success, message, data: { events, pagination } }
      const payload =
        response?.data?.data || // { events, pagination }
        response?.data || // fallback
        {};

      const eventsData = Array.isArray(payload.events)
        ? payload.events
        : Array.isArray(payload)
        ? payload
        : [];

      console.log('Events loaded:', eventsData); // Debug log
      setEvents(eventsData);
    } catch (error) {
      console.error("Failed to load events:", error);
      setEvents([]);
    }
  };

  const loadMeetings = async () => {
    try {
      // Dashboard/calendar: fetch all meetings visible to this user
      const response = await apiService.getAllMeetings({});
      // meetingController.getAllMeetings => { success, message, data: { meetings, pagination } }
      const payload =
        response?.data?.data || // { meetings, pagination }
        response?.data || // fallback
        {};

      const meetingsData = Array.isArray(payload.meetings)
        ? payload.meetings
        : Array.isArray(payload)
        ? payload
        : [];

      setMeetings(meetingsData);
    } catch (error) {
      console.error("Failed to load meetings:", error);
      setMeetings([]);
    }
  };

  // Combine optimistic events, events, and meetings for calendar (optimistic first)
  const calendarItems = [
    ...optimisticEvents.map((event) => ({
      ...event,
      type: "event",
      itemType: event.type || "Other",
      start: event.startDate,
      end: event.endDate || event.startDate,
      title: event.title,
      description: event.description,
    })),
    ...events.map((event) => ({
      ...event,
      type: "event",
      itemType: event.type || "Other",
      start: event.startDate,
      end: event.endDate || event.startDate,
      title: event.title,
      description: event.description,
    })),
    ...meetings.map((meeting) => ({
      ...meeting,
      type: "meeting",
      itemType: "Meeting",
      start: meeting.startTime,
      end: meeting.endTime || meeting.startTime,
      title: meeting.title,
      description: meeting.description,
    })),
  ];

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (item) => {
    if (item.type === "event") {
      setSelectedEvent(item);
      setShowDetailsModal(true);
    } else if (item.type === "meeting") {
      showSuccess(
        `Meeting: ${item.title} at ${new Date(item.start).toLocaleString()}`
      );
    }
  };

  // Updated: Accepts event data from EventModal and shows instantly
  const handleEventSuccess = (newEventData = null) => {
    setShowEventModal(false);
    
    // Optimistic update - immediately show the new event
    if (newEventData && selectedEvent === null) { // New event (not edit)
      setOptimisticEvents(prev => [newEventData, ...prev]);
      showSuccess("Event created successfully!");
    } else {
      showSuccess("Event updated successfully!");
    }
    
    // Refresh from server after brief delay to sync with backend
    setTimeout(() => {
      loadData();
    }, 500);
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Events & Meetings Calendar
          </h1>
          <p className="text-gray-600 mt-1">
            Manage company events and meetings
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex">
            <button
              onClick={() => setView("calendar")}
              className={`px-3 py-2 rounded-md flex items-center space-x-2 text-sm font-medium ${
                view === "calendar"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-2 rounded-md flex items-center space-x-2 text-sm font-medium ${
                view === "list"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <List className="h-4 w-4" />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={loadData}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>

          {isAdminOrHR && (
            <button
              onClick={handleCreateEvent}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>New Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {events.length + optimisticEvents.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Meetings</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {meetings.length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {
                  calendarItems.filter((item) => {
                    const itemDate = new Date(item.start);
                    const now = new Date();
                    return (
                      itemDate.getMonth() === now.getMonth() &&
                      itemDate.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {view === "calendar" && (
        <EventCalendar events={calendarItems} onEventClick={handleEventClick} />
      )}

      {/* List View */}
      {view === "list" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Upcoming Events & Meetings
            </h2>
            {calendarItems.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No events or meetings scheduled</p>
              </div>
            ) : (
              <div className="space-y-4">
                {calendarItems
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(a.start).getTime() - new Date(b.start).getTime()
                  )
                  .map((item) => (
                    <div
                      key={`${item.type}-${item._id || 'optimistic' + Math.random()}`}
                      onClick={() => handleEventClick(item)}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900">
                            {item.title}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              item.type === "meeting"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-indigo-100 text-indigo-800"
                            }`}
                          >
                            {item.type === "meeting"
                              ? "Meeting"
                              : item.itemType}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>
                            📅 {new Date(item.start).toLocaleDateString()}
                          </span>
                          <span>
                            🕐{" "}
                            {new Date(item.start).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(item.end).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showEventModal && (
        <EventModal
          event={selectedEvent}
          onClose={() => setShowEventModal(false)}
          onSubmit={handleEventSuccess}
        />
      )}

      {showDetailsModal && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setShowDetailsModal(false)}
          onEdit={() => {
            setShowDetailsModal(false);
            setShowEventModal(true);
          }}
          onDelete={() => {
            setShowDetailsModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

export default EventsPage;
