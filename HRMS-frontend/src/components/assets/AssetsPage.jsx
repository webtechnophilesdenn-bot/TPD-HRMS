import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Laptop,
  Smartphone,
  Monitor,
  Headphones,
  Printer,
  Server,
  Tablet,
  Keyboard,
  Mouse,
  HardDrive,
  Network
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import { apiService } from "../../services/apiService";

const AssetsPage = () => {
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    search: ""
  });

  const [newAsset, setNewAsset] = useState({
    name: "",
    assetId: "",
    category: "Electronics",
    type: "Laptop",
    brand: "",
    model: "",
    serialNumber: "",
    purchaseDate: "",
    purchasePrice: "",
    status: "Available",
    condition: "Excellent",
    location: "",
    specifications: {
      processor: "",
      ram: "",
      storage: "",
      os: ""
    },
    notes: ""
  });

  // Asset categories and types
  const assetCategories = {
    Electronics: ["Laptop", "Desktop", "Mobile", "Tablet", "Monitor", "Printer", "Server", "Keyboard", "Mouse", "Headphones"],
    Furniture: ["Chair", "Desk", "Cabinet", "Table", "Shelf"],
    Equipment: ["Projector", "Scanner", "Camera", "Phone", "Router"]
  };

  const statusOptions = ["Available", "Assigned", "Under Maintenance", "Damaged", "Retired"];
  const conditionOptions = ["Excellent", "Good", "Fair", "Poor", "Damaged"];

  useEffect(() => {
    loadAssets();
  }, [filters]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllAssets(filters);
      const assetsData = response.data?.assets || response.assets || response.data || [];
      setAssets(assetsData);
    } catch (error) {
      showError("Failed to load assets");
      console.error("Assets loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      await apiService.createAsset(newAsset);
      showSuccess("Asset created successfully!");
      setShowCreateModal(false);
      setNewAsset({
        name: "",
        assetId: "",
        category: "Electronics",
        type: "Laptop",
        brand: "",
        model: "",
        serialNumber: "",
        purchaseDate: "",
        purchasePrice: "",
        status: "Available",
        condition: "Excellent",
        location: "",
        specifications: {
          processor: "",
          ram: "",
          storage: "",
          os: ""
        },
        notes: ""
      });
      loadAssets();
    } catch (error) {
      showError(error.message || "Failed to create asset");
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    
    try {
      await apiService.deleteAsset(assetId);
      showSuccess("Asset deleted successfully!");
      loadAssets();
    } catch (error) {
      showError("Failed to delete asset");
    }
  };

  const getAssetIcon = (type) => {
    const icons = {
      Laptop: <Laptop className="h-5 w-5" />,
      Desktop: <Monitor className="h-5 w-5" />,
      Mobile: <Smartphone className="h-5 w-5" />,
      Tablet: <Tablet className="h-5 w-5" />,
      Monitor: <Monitor className="h-5 w-5" />,
      Printer: <Printer className="h-5 w-5" />,
      Server: <Server className="h-5 w-5" />,
      Keyboard: <Keyboard className="h-5 w-5" />,
      Mouse: <Mouse className="h-5 w-5" />,
      Headphones: <Headphones className="h-5 w-5" />,
      Router: <Network className="h-5 w-5" />,
      Projector: <HardDrive className="h-5 w-5" />,
      Chair: <div className="h-5 w-5 bg-gray-300 rounded"></div>,
      Desk: <div className="h-5 w-5 bg-gray-400 rounded"></div>,
      Default: <HardDrive className="h-5 w-5" />
    };
    return icons[type] || icons.Default;
  };

  const getStatusColor = (status) => {
    const colors = {
      Available: "bg-green-100 text-green-800 border-green-200",
      Assigned: "bg-blue-100 text-blue-800 border-blue-200",
      "Under Maintenance": "bg-yellow-100 text-yellow-800 border-yellow-200",
      Damaged: "bg-red-100 text-red-800 border-red-200",
      Retired: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[status] || colors.Available;
  };

  const getConditionColor = (condition) => {
    const colors = {
      Excellent: "text-green-600",
      Good: "text-blue-600",
      Fair: "text-yellow-600",
      Poor: "text-orange-600",
      Damaged: "text-red-600"
    };
    return colors[condition] || colors.Good;
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: "", category: "", search: "" });
  };

  // Calculate statistics
  const stats = {
    total: assets.length,
    available: assets.filter(a => a.status === "Available").length,
    assigned: assets.filter(a => a.status === "Assigned").length,
    maintenance: assets.filter(a => a.status === "Under Maintenance").length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
              <p className="text-gray-600 mt-1">Manage company assets and equipment</p>
            </div>
            <div className="flex space-x-3">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Import</span>
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Asset</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <HardDrive className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">{stats.available}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-gray-900">{stats.assigned}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-gray-900">{stats.maintenance}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Assets Inventory</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search assets..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
                  />
                </div>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Status</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Categories</option>
                  {Object.keys(assetCategories).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Assets Table */}
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <HardDrive className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
                        <p className="text-gray-600 mb-4">Get started by adding your first asset.</p>
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Asset</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-lg">
                            {getAssetIcon(asset.type)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                            <div className="text-sm text-gray-500">{asset.assetId}</div>
                            <div className="text-xs text-gray-400">{asset.brand} {asset.model}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{asset.category}</div>
                        <div className="text-sm text-gray-500">{asset.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(asset.status)}`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getConditionColor(asset.condition)}`}>
                          {asset.condition}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {asset.location || "Not specified"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
                              setShowDetailModal(true);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-gray-400 hover:text-gray-600">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(asset._id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Asset Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Add New Asset</h2>
            </div>
            
            <form onSubmit={handleCreateAsset} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Asset Name *</label>
                  <input
                    type="text"
                    required
                    value={newAsset.name}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Dell Latitude 5520"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Asset ID</label>
                  <input
                    type="text"
                    value={newAsset.assetId}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, assetId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., AST-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    required
                    value={newAsset.category}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, category: e.target.value, type: assetCategories[e.target.value][0] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {Object.keys(assetCategories).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    required
                    value={newAsset.type}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {assetCategories[newAsset.category]?.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                  <input
                    type="text"
                    value={newAsset.brand}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Dell"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                  <input
                    type="text"
                    value={newAsset.model}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Latitude 5520"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
                  <input
                    type="text"
                    value={newAsset.serialNumber}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, serialNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Unique serial number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
                  <input
                    type="date"
                    value={newAsset.purchaseDate}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price</label>
                  <input
                    type="number"
                    value={newAsset.purchasePrice}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, purchasePrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={newAsset.status}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                  <select
                    value={newAsset.condition}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, condition: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {conditionOptions.map(condition => (
                      <option key={condition} value={condition}>{condition}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={newAsset.location}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Floor 3, Room 302"
                  />
                </div>

                {/* Specifications for Electronics */}
                {newAsset.category === "Electronics" && (
                  <>
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Processor</label>
                      <input
                        type="text"
                        value={newAsset.specifications.processor}
                        onChange={(e) => setNewAsset(prev => ({
                          ...prev,
                          specifications: { ...prev.specifications, processor: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Intel i5 11th Gen"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">RAM</label>
                      <input
                        type="text"
                        value={newAsset.specifications.ram}
                        onChange={(e) => setNewAsset(prev => ({
                          ...prev,
                          specifications: { ...prev.specifications, ram: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., 16GB"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Storage</label>
                      <input
                        type="text"
                        value={newAsset.specifications.storage}
                        onChange={(e) => setNewAsset(prev => ({
                          ...prev,
                          specifications: { ...prev.specifications, storage: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., 512GB SSD"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">OS</label>
                      <input
                        type="text"
                        value={newAsset.specifications.os}
                        onChange={(e) => setNewAsset(prev => ({
                          ...prev,
                          specifications: { ...prev.specifications, os: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Windows 11 Pro"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    rows="3"
                    value={newAsset.notes}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Additional notes about the asset..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Asset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Detail Modal */}
      {showDetailModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedAsset.name}</h2>
                  <p className="text-gray-600">{selectedAsset.assetId}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Category</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedAsset.category}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Type</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedAsset.type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedAsset.status)}`}>
                    {selectedAsset.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Condition</h3>
                  <span className={`mt-1 text-sm font-medium ${getConditionColor(selectedAsset.condition)}`}>
                    {selectedAsset.condition}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Brand</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedAsset.brand || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Model</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedAsset.model || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Serial Number</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedAsset.serialNumber || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Purchase Date</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedAsset.purchaseDate ? new Date(selectedAsset.purchaseDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">Location</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedAsset.location || "Not specified"}</p>
                </div>
              </div>

              {selectedAsset.specifications && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedAsset.specifications).map(([key, value]) => 
                      value && (
                        <div key={key}>
                          <h4 className="text-sm font-medium text-gray-500 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          <p className="mt-1 text-sm text-gray-900">{value}</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {selectedAsset.notes && (
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedAsset.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsPage;