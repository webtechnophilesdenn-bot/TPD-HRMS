import React from "react";
import { Info, Calendar } from "lucide-react";

const LeaveBalanceCard = ({
  label,
  balance,
  total,
  color,
  description,
  isPaid,
}) => {
  const percentage = total ? (balance / total) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          <Info className="h-6 w-6 text-white" />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-2xl font-bold text-gray-900">{balance}</span>
            {total && <span className="text-sm text-gray-500">of {total}</span>}
          </div>
          {total && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${color.replace("bg-", "bg-")}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span
            className={`inline-flex items-center space-x-1 ${
              isPaid ? "text-green-600" : "text-orange-600"
            }`}
          >
            <span>{isPaid ? "Paid Leave" : "Unpaid Leave"}</span>
          </span>
          {total && balance < total * 0.2 && (
            <span className="text-red-600 font-semibold">Low Balance</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveBalanceCard;
