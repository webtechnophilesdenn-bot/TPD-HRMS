import React, { useState, useEffect } from "react";
import { Cake, Gift, Send, Calendar } from "lucide-react";
import { useNotification } from "../../context/NotificationContext";
import { apiService } from "../../services/apiService";

const BirthdayCalendar = () => {
  const { showSuccess, showError } = useNotification();

  const [birthdays, setBirthdays] = useState([]);
  const [todaysBirthdays, setTodaysBirthdays] = useState([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showWishModal, setShowWishModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [wishMessage, setWishMessage] = useState("");

  useEffect(() => {
    loadBirthdayCalendar();
    loadTodaysBirthdays();
  }, [selectedMonth]);

  const loadBirthdayCalendar = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBirthdayCalendar({
        month: selectedMonth,
        year: new Date().getFullYear(),
      });
      setBirthdays(response.data?.allBirthdays || []);
      setUpcomingBirthdays(response.data?.upcomingBirthdays || []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load birthday calendar", error);
      showError("Failed to load birthday calendar");
      setLoading(false);
    }
  };

  const loadTodaysBirthdays = async () => {
    try {
      const response = await apiService.getTodaysBirthdays();
      setTodaysBirthdays(response.data?.todaysBirthdays || []);
    } catch (error) {
      console.error("Failed to load today's birthdays", error);
    }
  };

  const handleSendWish = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      await apiService.sendBirthdayWish(selectedEmployee._id, wishMessage);
      showSuccess("Birthday wish sent successfully!");
      setShowWishModal(false);
      setWishMessage("");
      setSelectedEmployee(null);
    } catch (error) {
      showError(error.message || "Failed to send birthday wish");
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Cake className="w-8 h-8 mr-2 text-pink-500" />
          Birthday Calendar
        </h1>
        <p className="text-gray-600 mt-1">Celebrate your team's special days!</p>
      </div>

      {/* Today's Birthdays */}
      {todaysBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-6 mb-6 text-white">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Gift className="w-6 h-6 mr-2" />
            Today's Birthdays 🎉
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaysBirthdays.map((birthday) => (
              <div key={birthday._id} className="bg-white/20 backdrop-blur rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎂</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{birthday.fullName}</p>
                    <p className="text-sm opacity-90">{birthday.department}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEmployee(birthday);
                      setShowWishModal(true);
                    }}
                    className="bg-white text-pink-600 px-3 py-1 rounded-lg hover:bg-pink-50 flex items-center"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Wish
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <label className="block text-sm font-medium mb-2">Select Month</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="px-4 py-2 border rounded-lg w-full md:w-64"
        >
          {monthNames.map((month, index) => (
            <option key={index + 1} value={index + 1}>
              {month}
            </option>
          ))}
        </select>
      </div>

      {/* Upcoming Birthdays */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Upcoming Birthdays (Next 30 Days)</h3>
        </div>
        <div className="p-6">
          {upcomingBirthdays.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming birthdays in the next 30 days</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingBirthdays.map((birthday) => (
                <div key={birthday._id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <Cake className="w-5 h-5 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{birthday.fullName}</p>
                      <p className="text-sm text-gray-600">{birthday.employeeId}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{birthday.department}</p>
                  <p className="text-sm font-medium text-pink-600">
                    {new Date(birthday.birthdayThisYear).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All Birthdays in Selected Month */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">
            All Birthdays in {monthNames[selectedMonth - 1]}
          </h3>
        </div>
        <div className="p-6">
          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading birthdays...</p>
          ) : birthdays.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No birthdays in {monthNames[selectedMonth - 1]}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {birthdays.map((birthday) => (
                <div key={birthday._id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl text-white font-bold">{birthday.birthDay}</span>
                    </div>
                    <p className="font-semibold text-gray-900">{birthday.fullName}</p>
                    <p className="text-sm text-gray-600">{birthday.employeeId}</p>
                    <p className="text-sm text-gray-500 mt-1">{birthday.department}</p>
                    <button
                      onClick={() => {
                        setSelectedEmployee(birthday);
                        setShowWishModal(true);
                      }}
                      className="mt-3 w-full bg-pink-600 text-white px-3 py-2 rounded-lg hover:bg-pink-700 flex items-center justify-center"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Wish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Send Wish Modal */}
      {showWishModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Gift className="w-6 h-6 mr-2 text-pink-600" />
              Send Birthday Wish
            </h2>
            <form onSubmit={handleSendWish}>
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  To: <span className="font-semibold">{selectedEmployee.fullName}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Department: {selectedEmployee.department}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Your Message *</label>
                <textarea
                  required
                  value={wishMessage}
                  onChange={(e) => setWishMessage(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows="4"
                  placeholder="Write your birthday wishes here..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowWishModal(false);
                    setWishMessage("");
                    setSelectedEmployee(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 flex items-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Wish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BirthdayCalendar;
