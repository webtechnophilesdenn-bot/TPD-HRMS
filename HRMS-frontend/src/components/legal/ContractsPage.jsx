// src/pages/legal/ContractsPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  FileSignature,
  Plus,
  Send,
  Filter,
  Eye,
  Archive,
  Loader2,
} from 'lucide-react';
import CONTRACT_API from '../../services/contractAPI';

const ContractsPage = ({ isAdmin = true }) => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    contractType: '',
    status: '',
    employeeId: '',
  });
  const [selectedContract, setSelectedContract] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    contractType: 'Employment',
    employeeId: '',
    fileUrl: '',
  });
  const [sendingId, setSendingId] = useState(null);
  const [archivingId, setArchivingId] = useState(null);

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      let resp;
      if (isAdmin) {
        resp = await CONTRACT_API.getContracts({
          contractType: filters.contractType,
          status: filters.status,
          employeeId: filters.employeeId,
        });
        setContracts(resp.data.contracts || []);
      } else {
        resp = await CONTRACT_API.getMyContracts();
        setContracts(resp.data.contracts || []);
      }
    } catch (err) {
      console.error('Error fetching contracts:', err);
      alert(err.message || 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  }, [filters.contractType, filters.status, filters.employeeId, isAdmin]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (!createForm.title || !createForm.fileUrl) {
        alert('Title and File URL are required');
        return;
      }
      const payload = {
        title: createForm.title,
        contractType: createForm.contractType,
        employeeId: createForm.employeeId || undefined,
        file: {
          url: createForm.fileUrl,
        },
      };
      const resp = await CONTRACT_API.createContract(payload);
      alert('Contract created');
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        contractType: 'Employment',
        employeeId: '',
        fileUrl: '',
      });
      // Optimistic update
      setContracts((prev) => [resp.data.contract, ...prev]);
    } catch (err) {
      console.error('Error creating contract:', err);
      alert(err.message || 'Failed to create contract');
    }
  };

  const handleSendForSignature = async (contract) => {
    if (!window.confirm('Send this contract for e-signature?')) return;
    try {
      setSendingId(contract._id);
      const payload = {
        provider: 'ZohoSign', // or your chosen provider
      };
      await CONTRACT_API.sendForSignature(contract._id, payload);
      alert('Signature request created');
      fetchContracts();
    } catch (err) {
      console.error('Error sending for signature:', err);
      alert(err.message || 'Failed to send for signature');
    } finally {
      setSendingId(null);
    }
  };

  const handleArchive = async (contract) => {
    if (!window.confirm('Archive this contract?')) return;
    try {
      setArchivingId(contract._id);
      await CONTRACT_API.archiveContract(contract._id);
      alert('Contract archived');
      setContracts((prev) => prev.filter((c) => c._id !== contract._id));
    } catch (err) {
      console.error('Error archiving contract:', err);
      alert(err.message || 'Failed to archive contract');
    } finally {
      setArchivingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      Draft: 'bg-gray-100 text-gray-700',
      InReview: 'bg-yellow-100 text-yellow-800',
      SentForSignature: 'bg-blue-100 text-blue-800',
      PartiallySigned: 'bg-indigo-100 text-indigo-800',
      Signed: 'bg-green-100 text-green-800',
      Declined: 'bg-red-100 text-red-800',
      Expired: 'bg-orange-100 text-orange-800',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-3  px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-indigo-600" />
            Legal & Contracts
          </h1>
          <p className="text-gray-500 text-sm">
            Digital signature and contract lifecycle management inside your HRMS.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Contract
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center mb-3 text-gray-700">
          <Filter className="h-4 w-4 mr-2" />
          <span className="font-medium text-sm">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Contract Type
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={filters.contractType}
              onChange={(e) =>
                setFilters((f) => ({ ...f, contractType: e.target.value }))
              }
            >
              <option value="">All</option>
              <option value="Employment">Employment</option>
              <option value="Offer Letter">Offer Letter</option>
              <option value="NDA">NDA</option>
              <option value="Consulting">Consulting</option>
              <option value="Vendor">Vendor</option>
              <option value="Policy">Policy</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Status
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value }))
              }
            >
              <option value="">All</option>
              <option value="Draft">Draft</option>
              <option value="In Review">In Review</option>
              <option value="SentForSignature">Sent for Signature</option>
              <option value="PartiallySigned">Partially Signed</option>
              <option value="Signed">Signed</option>
              <option value="Declined">Declined</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          {isAdmin && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="EMP-0001"
                value={filters.employeeId}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, employeeId: e.target.value }))
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Contracts table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">
            {isAdmin ? 'All Contracts' : 'My Contracts'}
          </h2>
          <button
            onClick={fetchContracts}
            className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800"
          >
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            Loading contracts...
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            No contracts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border-b text-left">Title</th>
                  <th className="px-4 py-2 border-b text-left">Type</th>
                  <th className="px-4 py-2 border-b text-left">Employee</th>
                  <th className="px-4 py-2 border-b text-left">Status</th>
                  <th className="px-4 py-2 border-b text-left">File</th>
                  <th className="px-4 py-2 border-b text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-b">
                      <button
                        className="text-indigo-600 hover:underline"
                        onClick={() => setSelectedContract(c)}
                      >
                        {c.title}
                      </button>
                    </td>
                    <td className="px-4 py-2 border-b">
                      {c.contractType || '—'}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {c.employee
                        ? `${c.employee.firstName} ${c.employee.lastName} (${c.employee.employeeId})`
                        : '—'}
                    </td>
                    <td className="px-4 py-2 border-b">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                          c.status
                        )}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-b">
                      {c.signedFile?.url ? (
                        <a
                          href={c.signedFile.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-green-600 text-xs hover:underline"
                        >
                          View signed
                        </a>
                      ) : c.file?.url ? (
                        <a
                          href={c.file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 text-xs hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">No file</span>
                      )}
                    </td>
                    <td className="px-4 py-2 border-b text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800"
                          onClick={() => setSelectedContract(c)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </button>
                        {isAdmin && c.status === 'Draft' && (
                          <button
                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                            onClick={() => handleSendForSignature(c)}
                            disabled={sendingId === c._id}
                          >
                            {sendingId === c._id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3 mr-1" />
                            )}
                            Send
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700"
                            onClick={() => handleArchive(c)}
                            disabled={archivingId === c._id}
                          >
                            {archivingId === c._id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Archive className="h-3 w-3 mr-1" />
                            )}
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contract detail modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedContract.title}
              </h3>
              <button
                onClick={() => setSelectedContract(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p>
                <span className="font-medium text-gray-600">Type: </span>
                {selectedContract.contractType}
              </p>
              <p>
                <span className="font-medium text-gray-600">Status: </span>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                    selectedContract.status
                  )}`}
                >
                  {selectedContract.status}
                </span>
              </p>
              {selectedContract.employee && (
                <p>
                  <span className="font-medium text-gray-600">Employee: </span>
                  {selectedContract.employee.firstName}{' '}
                  {selectedContract.employee.lastName} (
                  {selectedContract.employee.employeeId})
                </p>
              )}
              {selectedContract.signatureRequest && (
                <p>
                  <span className="font-medium text-gray-600">
                    Signature Status:{' '}
                  </span>
                  {selectedContract.signatureRequest.status}
                </p>
              )}
              {selectedContract.file?.url && (
                <p>
                  <span className="font-medium text-gray-600">File: </span>
                  <a
                    href={selectedContract.file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    Open contract
                  </a>
                </p>
              )}
              {selectedContract.signedFile?.url && (
                <p>
                  <span className="font-medium text-gray-600">
                    Signed Document:{' '}
                  </span>
                  <a
                    href={selectedContract.signedFile.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-600 hover:underline"
                  >
                    View signed contract
                  </a>
                </p>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedContract(null)}
                className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create contract modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                New Contract
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Contract Type
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={createForm.contractType}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      contractType: e.target.value,
                    }))
                  }
                >
                  <option value="Employment">Employment</option>
                  <option value="Offer Letter">Offer Letter</option>
                  <option value="NDA">NDA</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Policy">Policy</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Employee ID (optional)
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Employee Mongo _id"
                  value={createForm.employeeId}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      employeeId: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Contract File URL
                </label>
                <input
                  type="url"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="https://..."
                  value={createForm.fileUrl}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, fileUrl: e.target.value }))
                  }
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Upload the PDF to your storage (e.g., Cloudinary/S3) and paste the URL here.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsPage;
