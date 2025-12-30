// src/pages/BirthdayCalendar.jsx - FORMAL & PROFESSIONAL VERSION
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Cake, 
  Gift, 
  Search, 
  User, 
  MessageCircle, 
  Send, 
  X, 
  Heart,
  Eye,
  Sparkles,
  Clock
} from 'lucide-react';
import { apiService } from '../services/apiService';

const BirthdayCalendar = () => {
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showWishModal, setShowWishModal] = useState(false);
  const [showWishesModal, setShowWishesModal] = useState(false);
  const [wishMessage, setWishMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingWishes, setLoadingWishes] = useState(false);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await apiService.request('/employees/my-profile');
        setCurrentUser(response.data?.data || response.data);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  const fetchBirthdays = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the new birthday calendar endpoint (accessible to all employees)
      const response = await apiService.getBirthdayCalendar();
      
      console.log('✅ Birthday calendar response:', response);
      
      const birthdaysData = response.data?.data?.birthdays || response.data?.birthdays || [];
      
      console.log('✅ Birthdays fetched:', birthdaysData.length);
      
      setBirthdays(birthdaysData);
    } catch (error) {
      console.error('❌ Error fetching birthdays:', error);
      setError('Failed to fetch birthdays. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const filteredBirthdays = birthdays.filter(emp => {
    const matchesSearch = 
      emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filter === 'today') return emp.isToday;
    if (filter === 'week') return emp.isThisWeek;
    if (filter === 'month') return emp.isThisMonth;
    return true;
  });

  // Get stats from response or calculate from local data
  const todayCount = birthdays.filter(b => b.isToday).length;
  const weekCount = birthdays.filter(b => b.isThisWeek).length;
  const monthCount = birthdays.filter(b => b.isThisMonth).length;

  // ==================== WISH FUNCTIONALITY ====================
  const openWishModal = (employee) => {
    setSelectedEmployee(employee);
    setWishMessage('');
    setShowWishModal(true);
  };

  const sendBirthdayWish = async () => {
    if (!wishMessage.trim()) {
      alert('Please enter a birthday message');
      return;
    }

    try {
      setSending(true);
      await apiService.request(`/employees/${selectedEmployee._id}/birthday-wish`, {
        method: 'POST',
        body: JSON.stringify({
          message: wishMessage.trim(),
          wisherId: currentUser?._id,
          wisherName: `${currentUser?.firstName} ${currentUser?.lastName}`
        })
      });
      
      alert('Birthday wish sent successfully! 🎉');
      setShowWishModal(false);
      setWishMessage('');
      fetchBirthdays(); // Refresh to show updated wishes
    } catch (error) {
      console.error('Error sending wish:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to send birthday wish';
      alert(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const viewWishes = async (employee) => {
    try {
      setLoadingWishes(true);
      const response = await apiService.request(`/employees/${employee._id}/birthday-wishes`);
      
      setSelectedEmployee({
        ...employee,
        wishes: response.data?.data?.wishes || response.data?.wishes || []
      });
      setShowWishesModal(true);
    } catch (error) {
      console.error('Error fetching wishes:', error);
      // Still show modal with cached wishes
      setSelectedEmployee(employee);
      setShowWishesModal(true);
    } finally {
      setLoadingWishes(false);
    }
  };

  const hasWished = (employee) => {
    if (!currentUser || !employee.birthdayWishes) return false;
    
    return employee.birthdayWishes.some(wish => 
      wish.wisherId?.toString() === currentUser._id?.toString() ||
      wish.wisherId === currentUser._id
    );
  };

  const quickWishes = [
    "Happy Birthday! Wishing you a wonderful day ahead.",
    "Warm birthday wishes to you. May this year bring you success and happiness.",
    "Wishing you a very happy birthday and a great year ahead.",
    "Happy Birthday! Hope your day is filled with joy and celebration.",
    "Many happy returns of the day. Best wishes for the year ahead.",
  ];

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', { 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Birthday Calendar</h1>
                <p className="text-sm text-gray-600">Employee birthdays and celebrations</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setFilter('today')}
              className={`p-4 rounded-lg border transition-all ${
                filter === 'today' 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Today</p>
                  <p className="text-2xl font-semibold text-gray-900">{todayCount}</p>
                </div>
                <Cake className={`w-6 h-6 ${filter === 'today' ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
            </button>

            <button
              onClick={() => setFilter('week')}
              className={`p-4 rounded-lg border transition-all ${
                filter === 'week' 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">This Week</p>
                  <p className="text-2xl font-semibold text-gray-900">{weekCount}</p>
                </div>
                <Clock className={`w-6 h-6 ${filter === 'week' ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
            </button>

            <button
              onClick={() => setFilter('month')}
              className={`p-4 rounded-lg border transition-all ${
                filter === 'month' 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">This Month</p>
                  <p className="text-2xl font-semibold text-gray-900">{monthCount}</p>
                </div>
                <Calendar className={`w-6 h-6 ${filter === 'month' ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Birthday List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading birthdays...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredBirthdays.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Cake className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-base">
              {searchTerm ? 'No birthdays found matching your search' : 'No birthdays found for the selected filter'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBirthdays.map((employee) => (
              <div
                key={employee._id}
                className={`bg-white rounded-lg shadow-sm border transition-all hover:shadow-md ${
                  employee.isToday ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'
                }`}
              >
                {/* Card Header */}
                {employee.isToday && (
                  <div className="bg-blue-600 px-4 py-2 flex items-center justify-center gap-2">
                    <Cake className="w-4 h-4 text-white" />
                    <span className="text-white text-sm font-medium">Birthday Today</span>
                  </div>
                )}

                {/* Profile */}
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative flex-shrink-0">
                      {employee.profilePicture ? (
                        <img
                          src={employee.profilePicture}
                          alt={`${employee.firstName} ${employee.lastName}`}
                          className="w-16 h-16 rounded-full border-2 border-gray-200 object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-600 text-lg font-medium">
                            {employee.firstName?.[0]}{employee.lastName?.[0]}
                          </span>
                        </div>
                      )}
                      {employee.isToday && (
                        <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-1">
                          <Cake className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {employee.employeeId}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {employee.department?.name || employee.department || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Birthday Date */}
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(employee.dateOfBirth)}</span>
                      {employee.isToday && (
                        <span className="ml-auto text-blue-600 font-medium">
                          Turning {employee.age}
                        </span>
                      )}
                    </div>
                    {!employee.isToday && (
                      <p className="text-xs text-gray-500 mt-2">
                        {employee.daysUntil === 1 ? 'Tomorrow' : `In ${employee.daysUntil} days`}
                      </p>
                    )}
                  </div>

                  {/* Wishes Count */}
                  {employee.birthdayWishes && employee.birthdayWishes.length > 0 && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>{employee.birthdayWishes.length} birthday {employee.birthdayWishes.length === 1 ? 'wish' : 'wishes'}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {!hasWished(employee) && employee._id !== currentUser?._id ? (
                      <button
                        onClick={() => openWishModal(employee)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <Send className="w-4 h-4" />
                        Send Wish
                      </button>
                    ) : employee._id !== currentUser?._id ? (
                      <button
                        disabled
                        className="flex-1 bg-gray-100 text-gray-500 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium cursor-not-allowed"
                      >
                        <Heart className="w-4 h-4" />
                        Wished
                      </button>
                    ) : null}
                    
                    {employee.birthdayWishes && employee.birthdayWishes.length > 0 && (
                      <button
                        onClick={() => viewWishes(employee)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        {employee.birthdayWishes.length}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        {!loading && filteredBirthdays.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-sm text-gray-600">
              Showing {filteredBirthdays.length} of {birthdays.length} employees with birthdays
            </p>
          </div>
        )}
      </div>

      {/* Send Wish Modal */}
      {showWishModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Send Birthday Wish</h3>
                  <p className="text-sm text-gray-600">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWishModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <textarea
                value={wishMessage}
                onChange={(e) => setWishMessage(e.target.value)}
                placeholder="Write a birthday message..."
                rows={4}
                maxLength={500}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {wishMessage.length}/500 characters
              </p>
            </div>

            {/* Quick Wishes */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-2">Quick wishes:</p>
              <div className="space-y-2">
                {quickWishes.map((wish, index) => (
                  <button
                    key={index}
                    onClick={() => setWishMessage(wish)}
                    className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors border border-gray-200"
                  >
                    {wish}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWishModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={sendBirthdayWish}
                disabled={sending || !wishMessage.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 text-sm"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Wish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Wishes Modal */}
      {showWishesModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Birthday Wishes</h3>
                  <p className="text-sm text-gray-600">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWishesModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingWishes ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading wishes...</p>
              </div>
            ) : selectedEmployee.birthdayWishes && selectedEmployee.birthdayWishes.length > 0 ? (
              <div className="space-y-3">
                {selectedEmployee.birthdayWishes.map((wish, index) => (
                  <div
                    key={wish._id || index}
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start gap-3">
                      {wish.wisher?.profilePicture ? (
                        <img
                          src={wish.wisher.profilePicture}
                          alt={wish.wisherName}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 text-sm">
                            {wish.wisherName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(wish.wishedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{wish.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-base">No wishes yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Be the first to send a birthday wish!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BirthdayCalendar;
