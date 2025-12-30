import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  Calendar,
  FileText,
  Filter,
} from "lucide-react";
import { apiService } from "../services/apiService";

const ExpenseApproval = () => {
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    status: "",
    comments: "",
    modifiedAmount: "",
  });

  const fetchPendingExpenses = async () => {
    try {
      setLoading(true);
      const response = await apiService.request('/expenses/pending/list');
      const data = response.data?.data || response.data;
      setPendingExpenses(data?.expenses || []);
      console.log('✅ Pending expenses:', data?.expenses?.length);
    } catch (error) {
      console.error('❌ Error fetching pending:', error);
      setPendingExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllExpenses = async () => {
    try {
      setLoading(true);
      const response = await apiService.request('/expenses/all/expenses');
      const data = response.data?.data || response.data;
      setAllExpenses(data?.expenses || []);
      console.log('✅ All expenses:', data?.expenses?.length);
    } catch (error) {
      console.error('❌ Error fetching all:', error);
      setAllExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "pending") {
      fetchPendingExpenses();
    } else {
      fetchAllExpenses();
    }
  }, [activeTab]);

  const handleApprove = (expense, status) => {
    setSelectedExpense(expense);
    setApprovalData({
      status,
      comments: "",
      modifiedAmount: expense.amount,
    });
    setShowApprovalModal(true);
  };

  const submitApproval = async () => {
    try {
      await apiService.request(`/expenses/${selectedExpense._id}/status`, {
        method: "PATCH",
        body: JSON.stringify(approvalData),
      });

      alert(`Expense ${approvalData.status} successfully!`);
      setShowApprovalModal(false);
      setSelectedExpense(null);
      fetchPendingExpenses();
      fetchAllExpenses();
    } catch (error) {
      console.error('❌ Approval error:', error);
      alert(error.response?.data?.message || 'Failed to update expense');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: "bg-yellow-100 text-yellow-800",
      Approved: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
      "Auto-Approved": "bg-blue-100 text-blue-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  const expenses = activeTab === "pending" ? pendingExpenses : allExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Expense Approval</h1>
        <p className="text-gray-600 mt-1">Review and approve expense claims</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">
                {pendingExpenses.length}
              </p>
            </div>
            <Clock className="text-yellow-600" size={32} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{pendingExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="text-indigo-600" size={32} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">All Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {allExpenses.length}
              </p>
            </div>
            <FileText className="text-gray-600" size={32} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-3 font-medium ${
              activeTab === "pending"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Pending ({pendingExpenses.length})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-3 font-medium ${
              activeTab === "all"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All Expenses ({allExpenses.length})
          </button>
        </div>

        {/* Expense List */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No expenses found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Spent On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    {activeTab === "pending" && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User size={16} className="text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {expense.employee?.firstName} {expense.employee?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {expense.employee?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.expenseType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{expense.amount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {expense.spentOn}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(expense.requestDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                            expense.status
                          )}`}
                        >
                          {expense.status}
                        </span>
                      </td>
                      {activeTab === "pending" && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(expense, "Approved")}
                              className="text-green-600 hover:text-green-900 flex items-center gap-1"
                            >
                              <CheckCircle size={16} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleApprove(expense, "Rejected")}
                              className="text-red-600 hover:text-red-900 flex items-center gap-1"
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {approvalData.status} Expense
              </h2>
              
              {/* Expense Details */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600">Employee</p>
                <p className="font-medium">
                  {selectedExpense.employee?.firstName} {selectedExpense.employee?.lastName}
                </p>
                <p className="text-sm text-gray-500">{selectedExpense.employee?.email}</p>
                
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-medium">{selectedExpense.expenseType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-medium">₹{selectedExpense.amount}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-sm text-gray-600">Purpose</p>
                  <p className="text-sm">{selectedExpense.purpose}</p>
                </div>
              </div>

              {/* Approval Form */}
              <div className="space-y-4">
                {approvalData.status === "Approved" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Approved Amount
                    </label>
                    <input
                      type="number"
                      value={approvalData.modifiedAmount}
                      onChange={(e) =>
                        setApprovalData({ ...approvalData, modifiedAmount: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comments {approvalData.status === "Rejected" && "*"}
                  </label>
                  <textarea
                    value={approvalData.comments}
                    onChange={(e) =>
                      setApprovalData({ ...approvalData, comments: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    rows="3"
                    placeholder="Add comments..."
                    required={approvalData.status === "Rejected"}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApprovalModal(false);
                      setSelectedExpense(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitApproval}
                    className={`flex-1 px-4 py-2 text-white rounded-lg ${
                      approvalData.status === "Approved"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    Confirm {approvalData.status}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseApproval;
