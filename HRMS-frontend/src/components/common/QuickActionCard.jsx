import React from 'react';

const QuickActionCard = ({ icon: Icon, label, color }) => (
  <button className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
    <div className={`${color} p-3 rounded-lg inline-flex mb-3`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <p className="text-sm font-medium text-gray-900">{label}</p>
  </button>
);

export default QuickActionCard;