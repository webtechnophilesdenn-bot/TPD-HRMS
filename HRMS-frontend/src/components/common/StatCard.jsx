// src/components/common/StatCard.jsx
import React from 'react';

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  change, 
  changeType, 
  bgColor, 
  textColor = 'text-white' 
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-red-400';
      case 'decrease':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase':
        return '↗';
      case 'decrease':
        return '↘';
      default:
        return '→';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div 
          className="p-3 rounded-xl"
          style={{ backgroundColor: bgColor + '20' }}
        >
          <Icon className="h-6 w-6" style={{ color: bgColor }} />
        </div>
        <span className={`text-sm font-medium ${getChangeColor()}`}>
          {getChangeIcon()} {change}
        </span>
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
        <p className="text-gray-600 text-sm">{label}</p>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div 
          className="h-1 rounded-full"
          style={{ backgroundColor: bgColor + '40' }}
        >
          <div 
            className="h-1 rounded-full transition-all duration-1000"
            style={{ 
              backgroundColor: bgColor,
              width: changeType === 'increase' ? '75%' : changeType === 'decrease' ? '45%' : '60%'
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;