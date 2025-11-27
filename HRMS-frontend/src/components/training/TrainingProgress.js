import React from 'react';

const TrainingProgress = ({ progress, enrollmentStatus }) => {
  const getStatusColor = (status) => {
    const colors = {
      'enrolled': 'bg-blue-500',
      'in-progress': 'bg-orange-500',
      'completed': 'bg-green-500',
      'dropped': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Progress</span>
        <span>{progress}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${getStatusColor(enrollmentStatus)} transition-all duration-300`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-500">
        <span className="capitalize">{enrollmentStatus.replace('-', ' ')}</span>
        {enrollmentStatus === 'completed' && (
          <span>Completed</span>
        )}
      </div>
    </div>
  );
};

export default TrainingProgress;