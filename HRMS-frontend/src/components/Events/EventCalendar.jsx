import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";

const EventCalendar = ({ events, onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month"); // 'month', 'week', 'day'

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getEventsForDay = (day) => {
    return events.filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const checkDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );

      return (
        eventStart.toDateString() === checkDate.toDateString() ||
        eventEnd.toDateString() === checkDate.toDateString() ||
        (eventStart <= checkDate && eventEnd >= checkDate)
      );
    });
  };

  const getEventColor = (event) => {
    // ✅ Special color for meetings
    if (event.type === "meeting") {
      return "bg-purple-100 border-purple-500 text-purple-900";
    }

    // Original event colors
    const colors = {
      "Company Meeting": "bg-blue-100 border-blue-500 text-blue-900",
      Training: "bg-green-100 border-green-500 text-green-900",
      Holiday: "bg-red-100 border-red-500 text-red-900",
      "Team Building": "bg-yellow-100 border-yellow-500 text-yellow-900",
      Birthday: "bg-pink-100 border-pink-500 text-pink-900",
      Anniversary: "bg-purple-100 border-purple-500 text-purple-900",
      "Town Hall": "bg-indigo-100 border-indigo-500 text-indigo-900",
      Workshop: "bg-teal-100 border-teal-500 text-teal-900",
      Conference: "bg-orange-100 border-orange-500 text-orange-900",
      Other: "bg-gray-100 border-gray-500 text-gray-900",
    };
    return (
      colors[event.itemType] || "bg-gray-100 border-gray-500 text-gray-900"
    );
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const firstDay = firstDayOfMonth(currentDate);
    const today = new Date();

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[120px] bg-gray-50 p-2"></div>
      );
    }

    // Calendar days
    for (let day = 1; day <= totalDays; day++) {
      const dayEvents = getEventsForDay(day);
      const isToday =
        today.getDate() === day &&
        today.getMonth() === currentDate.getMonth() &&
        today.getFullYear() === currentDate.getFullYear();

      days.push(
        <div
          key={day}
          className={`min-h-[120px] border border-gray-200 p-2 ${
            isToday ? "bg-indigo-50 ring-2 ring-indigo-500" : "bg-white"
          } hover:bg-gray-50 transition-colors`}
        >
          <div
            className={`text-sm font-semibold mb-2 ${
              isToday ? "text-indigo-600" : "text-gray-700"
            }`}
          >
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event, idx) => (
              <div
                key={`${event.type}-${event._id || "optimistic" + idx}-${idx}`}
                onClick={() => onEventClick && onEventClick(event)}
                className={`text-xs p-1 rounded border-l-2 cursor-pointer hover:shadow-sm transition-shadow truncate ${getEventColor(
                  event
                )}`}
                title={event.title}
              >
                <div className="font-medium truncate">{event.title}</div>
                <div className="text-[10px] opacity-75 flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {new Date(event.start).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500 pl-1">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>Today</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="font-medium text-gray-700">Legend:</span>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-gray-600">Meeting</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600">Company Event</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Training</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">Holiday</span>
          </div>
        </div>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 bg-gray-100 border-b border-gray-200">
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-semibold text-gray-700"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">{renderCalendar()}</div>
    </div>
  );
};

export default EventCalendar;
