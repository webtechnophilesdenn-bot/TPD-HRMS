import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { useNotification } from '../../context/NotificationContext';

const LeaveCalendarView = ({ filters, setFilters }) => {
  const { showError } = useNotification();
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadCalendarData();
  }, [currentMonth, currentYear]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getLeaveCalendar({
        year: currentYear,
        month: currentMonth
      });
      setCalendarData(response.data?.events || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load calendar data', error);
      showError('Failed to load leave calendar');
      setLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getDaysInMonth = () => {
    return new Date(currentYear, currentMonth, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    return new Date(currentYear, currentMonth - 1, 1).getDay();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getLeavesForDay = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarData.filter(event => {
      const start = new Date(event.start).toISOString().split('T')[0];
      const end = new Date(event.end).toISOString().split('T')[0];
      return dateStr >= start && dateStr <= end;
    });
  };

  if (loading) {
    return <div className="text-center py-12">Loading calendar...</div>;
  }

  const daysInMonth = getDaysInMonth();
  const firstDay = getFirstDayOfMonth();
  const days = [];

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="bg-gray-50"></div>);
  }

  // Actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const leavesOnDay = getLeavesForDay(day);
    days.push(
      <div key={day} className="min-h-24 border border-gray-200 p-2 bg-white hover:bg-gray-50">
        <div className="font-semibold text-sm text-gray-900 mb-1">{day}</div>
        <div className="space-y-1">
          {leavesOnDay.slice(0, 3).map((leave, idx) => (
            <div
              key={idx}
              className="text-xs px-2 py-1 rounded truncate"
              style={{ backgroundColor: leave.color + '20', color: leave.color }}
              title={`${leave.employeeName} - ${leave.leaveType}`}
            >
              {leave.employeeName.split(' ')[0]} - {leave.leaveType.substring(0, 4)}
            </div>
          ))}
          {leavesOnDay.length > 3 && (
            <div className="text-xs text-gray-500 px-2">
              +{leavesOnDay.length - 3} more
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Calendar Header */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {monthNames[currentMonth - 1]} {currentYear}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setCurrentMonth(new Date().getMonth() + 1);
                setCurrentYear(new Date().getFullYear());
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Today
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center font-semibold text-gray-700 bg-gray-50">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Leave Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3B82F6' }}></div>
            <span className="text-sm text-gray-700">Casual Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF4444' }}></div>
            <span className="text-sm text-gray-700">Sick Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10B981' }}></div>
            <span className="text-sm text-gray-700">Earned Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F59E0B' }}></div>
            <span className="text-sm text-gray-700">Maternity Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8B5CF6' }}></div>
            <span className="text-sm text-gray-700">Paternity Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6B7280' }}></div>
            <span className="text-sm text-gray-700">Unpaid Leave</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveCalendarView;
