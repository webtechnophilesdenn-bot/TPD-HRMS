import React from 'react';
import { BookOpen, Users, Clock, Calendar, Star } from 'lucide-react';

const TrainingCard = ({ training, onEnroll, isEnrolled }) => {
  const getStatusColor = (status) => {
    const colors = {
      'published': 'bg-green-100 text-green-800',
      'upcoming': 'bg-blue-100 text-blue-800',
      'ongoing': 'bg-orange-100 text-orange-800',
      'completed': 'bg-gray-100 text-gray-800',
      'draft': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="bg-indigo-100 p-3 rounded-lg">
          <BookOpen className="h-6 w-6 text-indigo-600" />
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(training.status)}`}>
            {training.status}
          </span>
          {training.averageRating > 0 && (
            <div className="flex items-center text-sm text-gray-600">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="ml-1">{training.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {training.title}
      </h3>
      
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {training.description}
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{training.duration}hrs</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{training.totalEnrollments} enrolled</span>
          </div>
        </div>
        
        {training.startDate && (
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{new Date(training.startDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 capitalize">{training.type}</span>
        
        {isEnrolled ? (
          <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
            Continue
          </button>
        ) : (
          <button 
            onClick={() => onEnroll(training._id)}
            disabled={training.status !== 'published' && training.status !== 'upcoming'}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Enroll Now
          </button>
        )}
      </div>
    </div>
  );
};

export default TrainingCard;