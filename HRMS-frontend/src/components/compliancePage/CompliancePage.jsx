import React, { useState, useEffect } from 'react';
import { apiService } from "../../services/apiService";
import { 
  Shield, 
  FileText, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  ExternalLink,
  Eye,
  Download,
  Filter,
  Search
} from 'lucide-react';

const CompliancePage = () => {
  const [activeTab, setActiveTab] = useState('policies');
  const [policies, setPolicies] = useState([]);
  const [pendingAcknowledgments, setPendingAcknowledgments] = useState([]);
  const [complianceDocuments, setComplianceDocuments] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateDocModal, setShowCreateDocModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const user = apiService.getProfile();
  const isAdmin = user?.role === 'admin' || user?.role === 'hr';

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'policies') {
        await loadPolicies();
      } else if (activeTab === 'acknowledgments') {
        await loadPendingAcknowledgments();
      } else if (activeTab === 'documents') {
        await loadComplianceDocuments();
      } else if (activeTab === 'dashboard') {
        await loadDashboard();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPolicies = async () => {
    try {
      const filters = {
        page: 1,
        limit: 50
      };
      
      if (statusFilter) {
        filters.status = statusFilter;
      }

      const response = await apiService.getAllPolicies(filters);
      setPolicies(response.data.policies || []);
    } catch (error) {
      console.error('Error loading policies:', error);
      setPolicies([]);
    }
  };

  const loadPendingAcknowledgments = async () => {
    try {
      const response = await apiService.getMyPendingAcknowledgments();
      setPendingAcknowledgments(response.data || []);
    } catch (error) {
      console.error('Error loading acknowledgments:', error);
      setPendingAcknowledgments([]);
    }
  };

  const loadComplianceDocuments = async () => {
    try {
      const response = await apiService.getAllComplianceDocuments({
        page: 1,
        limit: 50
      });
      setComplianceDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      setComplianceDocuments([]);
    }
  };

  const loadDashboard = async () => {
    try {
      const response = await apiService.getComplianceDashboard();
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setDashboardStats(null);
    }
  };

  const handleAcknowledgePolicy = async (policyId) => {
    try {
      const acknowledgmentData = {
        employeeComments: '',
        readingTime: 120,
        scrollProgress: 100,
        ipAddress: '0.0.0.0',
        userAgent: navigator.userAgent
      };

      await apiService.acknowledgePolicy(policyId, acknowledgmentData);
      alert('Policy acknowledged successfully!');
      loadPendingAcknowledgments();
      if (activeTab === 'dashboard') loadDashboard();
    } catch (error) {
      console.error('Error acknowledging policy:', error);
      alert('Failed to acknowledge policy: ' + error.message);
    }
  };

  const handlePublishPolicy = async (policyId) => {
    if (!window.confirm('Are you sure you want to publish this policy? This will create acknowledgment tasks for all active employees.')) return;

    try {
      await apiService.publishPolicy(policyId);
      alert('Policy published successfully! Acknowledgment tasks have been created for all employees.');
      loadPolicies();
      if (activeTab === 'dashboard') loadDashboard();
    } catch (error) {
      console.error('Error publishing policy:', error);
      alert('Failed to publish policy: ' + error.message);
    }
  };

  const handleCreatePolicy = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const policyData = {
        title: formData.get('title'),
        policyId: formData.get('policyId'),
        category: formData.get('category'),
        description: formData.get('description'),
        documentUrl: formData.get('documentUrl'),
        effectiveDate: formData.get('effectiveDate'),
        expiryDate: formData.get('expiryDate') || null,
        requiresAcknowledgment: true,
        applicableTo: 'All Employees'
      };

      await apiService.createPolicy(policyData);
      alert('Policy created successfully!');
      setShowCreateModal(false);
      e.target.reset();
      loadPolicies();
      if (activeTab === 'dashboard') loadDashboard();
    } catch (error) {
      console.error('Error creating policy:', error);
      alert('Failed to create policy: ' + error.message);
    }
  };

  const handleCreateComplianceDocument = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const documentData = {
        employee: formData.get('employee'),
        documentType: formData.get('documentType'),
        documentName: formData.get('documentName'),
        documentNumber: formData.get('documentNumber'),
        issueDate: formData.get('issueDate'),
        expiryDate: formData.get('expiryDate') || null,
        issuingAuthority: formData.get('issuingAuthority'),
        documentUrl: formData.get('documentUrl'),
        status: 'Active'
      };

      await apiService.createComplianceDocument(documentData);
      alert('Compliance document created successfully!');
      setShowCreateDocModal(false);
      e.target.reset();
      loadComplianceDocuments();
      if (activeTab === 'dashboard') loadDashboard();
    } catch (error) {
      console.error('Error creating compliance document:', error);
      alert('Failed to create compliance document: ' + error.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-indigo-600" />
            Compliance & Policy Management
          </h1>
          <p className="text-gray-600 mt-2">Manage policies, acknowledgments, and compliance documents</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {activeTab === 'documents' && (
              <button 
                onClick={() => setShowCreateDocModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <Plus className="h-5 w-5" />
                Add Document
              </button>
            )}
            {activeTab === 'policies' && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus className="h-5 w-5" />
                Create Policy
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('policies')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'policies'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Policies
            </div>
          </button>
          <button
            onClick={() => setActiveTab('acknowledgments')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'acknowledgments'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              My Acknowledgments
            </div>
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('documents')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'documents'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents
                </div>
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Dashboard
                </div>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {/* Policies Tab */}
          {activeTab === 'policies' && (
            <>
              {/* Filter Buttons */}
              <div className="mb-6 flex gap-2">
                <button
                  onClick={() => setStatusFilter('')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !statusFilter 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('Draft')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === 'Draft' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Draft
                </button>
                <button
                  onClick={() => setStatusFilter('Active')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === 'Active' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active
                </button>
              </div>

              {policies.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No policies found</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {statusFilter 
                      ? `No ${statusFilter.toLowerCase()} policies available`
                      : 'Create your first policy to get started'
                    }
                  </p>
                  {isAdmin && !statusFilter && (
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Create Policy
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {policies.map((policy) => (
                    <div key={policy._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{policy.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
                          policy.status === 'Active' 
                            ? 'bg-green-100 text-green-800'
                            : policy.status === 'Draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {policy.status}
                        </span>
                      </div>
                      <p className="text-sm text-indigo-600 font-medium mb-2">{policy.category}</p>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{policy.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(policy.effectiveDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a 
                          href={policy.documentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </a>
                        {isAdmin && policy.status === 'Draft' && (
                          <button 
                            onClick={() => handlePublishPolicy(policy._id)}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                          >
                            Publish
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Acknowledgments Tab */}
          {activeTab === 'acknowledgments' && (
            <div className="space-y-4">
              {pendingAcknowledgments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No pending acknowledgments</p>
                  <p className="text-gray-500 text-sm mt-2">You're all caught up!</p>
                </div>
              ) : (
                pendingAcknowledgments.map((ack) => (
                  <div key={ack._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{ack.policy?.title}</h3>
                        <p className="text-gray-600 mb-4">{ack.policy?.description}</p>
                        {ack.policy?.acknowledgmentDeadline && (
                          <div className="flex items-center gap-2 text-red-600 text-sm mb-4">
                            <Clock className="h-4 w-4" />
                            Deadline: {new Date(ack.policy.acknowledgmentDeadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <AlertTriangle className="h-6 w-6 text-yellow-500 ml-4 flex-shrink-0" />
                    </div>
                    <div className="flex gap-3 mt-4">
                      <a 
                        href={ack.policy?.documentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Read Policy
                      </a>
                      <button 
                        onClick={() => handleAcknowledgePolicy(ack.policy._id)}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Acknowledge
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Documents Tab (Admin Only) */}
          {activeTab === 'documents' && isAdmin && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {complianceDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No compliance documents found</p>
                  <p className="text-gray-500 text-sm mt-2 mb-4">
                    Start tracking employee certifications, licenses, and other compliance documents
                  </p>
                  <button 
                    onClick={() => setShowCreateDocModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add First Document
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {complianceDocuments.map((doc) => (
                        <tr key={doc._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.documentType}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{doc.documentName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {doc.employee?.firstName} {doc.employee?.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {doc.issueDate ? new Date(doc.issueDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              doc.status === 'Active' 
                                ? 'bg-green-100 text-green-800'
                                : doc.status === 'Expired'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {doc.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Dashboard Tab (Admin Only) */}
          {activeTab === 'dashboard' && isAdmin && (
            <div>
              {dashboardStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Total Policies</h3>
                      <FileText className="h-8 w-8 text-indigo-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{dashboardStats.policies.total}</p>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Pending Acknowledgments</h3>
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{dashboardStats.policies.pending}</p>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Completion Rate</h3>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{dashboardStats.policies.completionRate}%</p>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Expired Documents</h3>
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{dashboardStats.documents.expired}</p>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Expiring Soon</h3>
                      <Clock className="h-8 w-8 text-orange-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{dashboardStats.documents.expiringSoon}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No dashboard data available</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Create Policy Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Policy</h2>
            <form onSubmit={handleCreatePolicy} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input 
                  type="text" 
                  name="title" 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Policy ID *</label>
                <input 
                  type="text" 
                  name="policyId" 
                  required 
                  placeholder="e.g., POL-2025-001" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select 
                  name="category" 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="">Select a category</option>
                  <option value="HR Policy">HR Policy</option>
                  <option value="IT Security">IT Security</option>
                  <option value="Code of Conduct">Code of Conduct</option>
                  <option value="Leave Policy">Leave Policy</option>
                  <option value="Remote Work">Remote Work</option>
                  <option value="Data Protection">Data Protection</option>
                  <option value="Safety & Health">Safety & Health</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea 
                  name="description" 
                  required 
                  rows="4" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document URL *</label>
                <input 
                  type="url" 
                  name="documentUrl" 
                  required 
                  placeholder="https://example.com/policy.pdf" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date *</label>
                  <input 
                    type="date" 
                    name="effectiveDate" 
                    required 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input 
                    type="date" 
                    name="expiryDate" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Create Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Compliance Document Modal */}
      {showCreateDocModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateDocModal(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Compliance Document</h2>
            <form onSubmit={handleCreateComplianceDocument} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                <input 
                  type="text" 
                  name="employee" 
                  required 
                  placeholder="MongoDB ObjectId of employee"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" 
                />
                <p className="text-xs text-gray-500 mt-1">Enter the employee's MongoDB ObjectId</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
                <select 
                  name="documentType" 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="">Select type</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Professional License">Professional License</option>
                  <option value="Certification">Certification</option>
                  <option value="Background Verification">Background Verification</option>
                  <option value="Medical Certificate">Medical Certificate</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
                <input 
                  type="text" 
                  name="documentName" 
                  required 
                  placeholder="e.g., PAN Card - John Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Number</label>
                <input 
                  type="text" 
                  name="documentNumber" 
                  placeholder="e.g., ABCDE1234F"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Authority</label>
                <input 
                  type="text" 
                  name="issuingAuthority" 
                  placeholder="e.g., Income Tax Department"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document URL</label>
                <input 
                  type="url" 
                  name="documentUrl" 
                  placeholder="https://example.com/document.pdf"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                  <input 
                    type="date" 
                    name="issueDate" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input 
                    type="date" 
                    name="expiryDate" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowCreateDocModal(false)} 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Add Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompliancePage;
