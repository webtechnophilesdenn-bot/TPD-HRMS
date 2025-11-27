import React from "react";
import { TrendingUp } from "lucide-react";

const StatCard = ({
  icon: Icon,
  label,
  value,
  change,
  changeType,
  bgColor,
}) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p
          className={`text-sm mt-2 ${
            changeType === "increase"
              ? "text-green-600"
              : changeType === "decrease"
              ? "text-red-600"
              : "text-gray-600"
          }`}
        >
          {changeType === "increase" && (
            <TrendingUp className="inline h-4 w-4 mr-1" />
          )}
          {change}
        </p>
      </div>
      <div className={`${bgColor} p-4 rounded-xl`}>
        <Icon className="h-8 w-8 text-white" />
      </div>
    </div>
  </div>
);

export default StatCard;
