import React, { useState, useEffect } from "react";
import { BookOpen, Search, Filter, Plus, BarChart3 } from "lucide-react";
import { useNotification } from "../../hooks/useNotification";
import { apiService } from "../../services/apiService";
import TrainingCard from "./TrainingCard";
import TrainingProgress from "./TrainingProgress";
import CreateTrainingForm from "./CreateTrainingModal"; // Add this import

const TrainingPage = () => {
  const { showSuccess, showError } = useNotification();
  const [trainings, setTrainings] = useState([]);
  const [myTrainings, setMyTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false); // Add this state
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    type: '',
    status: ''
  });

  useEffect(() => {
    loadTrainings();
    loadMyTrainings();
  }, [filters]);

  const loadTrainings = async () => {
    try {
      const response = await apiService.getAllTrainings(filters);
      setTrainings(response.data.docs || []);
      setLoading(false);
    } catch (error) {
      showError("Failed to load trainings");
      setLoading(false);
    }
  };

  const loadMyTrainings = async () => {
    try {
      const response = await apiService.getMyTrainings();
      setMyTrainings(response.data || []);
    } catch (error) {
      console.error("Failed to load my trainings:", error);
    }
  };

  const handleEnroll = async (programId) => {
    try {
      await apiService.enrollInTraining(programId);
      showSuccess("Enrolled successfully!");
      loadTrainings();
      loadMyTrainings();
    } catch (error) {
      showError(error.message || "Failed to enroll");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCreateTraining = () => {
    setShowCreateForm(true);
  };

  const handleTrainingCreated = () => {
    loadTrainings();
    loadMyTrainings();
  };

  const filteredTrainings = activeTab === 'my-trainings' ? myTrainings : trainings;

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-3">
      {/* Add the form modal */}
      {showCreateForm && (
        <CreateTrainingForm 
          onClose={() => setShowCreateForm(false)}
          onTrainingCreated={handleTrainingCreated}
        />
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Training & LMS</h1>
        <div className="flex space-x-3">
          <button 
            onClick={handleCreateTraining} // Add onClick handler
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Training
          </button>
          <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </button>
        </div>
      </div>

      {/* Rest of your existing code remains exactly the same */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['all', 'my-trainings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search trainings..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            <option value="technical">Technical</option>
            <option value="soft-skills">Soft Skills</option>
            <option value="leadership">Leadership</option>
            <option value="compliance">Compliance</option>
          </select>

          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Types</option>
            <option value="Online">Online</option>
            <option value="Instructor-Led">Instructor-Led</option>
            <option value="Workshop">Workshop</option>
            <option value="Webinar">Webinar</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
          </select>
        </div>
      </div>

      {activeTab === 'my-trainings' && myTrainings.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Learning Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTrainings.map(training => (
              <div key={training._id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{training.title}</h3>
                <TrainingProgress 
                  progress={training.progress} 
                  enrollmentStatus={training.enrollmentStatus}
                />
                {training.completedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Completed on {new Date(training.completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrainings.map((training) => (
          <TrainingCard
            key={training._id}
            training={training}
            onEnroll={handleEnroll}
            isEnrolled={myTrainings.some(t => t._id === training._id)}
          />
        ))}
      </div>

      {filteredTrainings.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trainings found</h3>
          <p className="text-gray-500">
            {activeTab === 'my-trainings' 
              ? "You haven't enrolled in any trainings yet."
              : "No trainings match your filters."
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TrainingPage;