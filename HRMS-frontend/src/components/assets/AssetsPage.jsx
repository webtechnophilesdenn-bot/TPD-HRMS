// AssetsPage.jsx - Fixed version
import React, { useState, useEffect, useMemo } from "react";
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
  Network,
  QrCode,
  Tag,
  Shield,
  Wrench,
  Truck,
  MapPin,
  DollarSign,
  Calendar,
  BarChart3,
  FileText,
  Scan,
  Users,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  PieChart,
  Home,
  Building,
  CheckSquare,
  XSquare,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import { apiService } from "../../services/apiService";
import { hasPermission } from "../../utils/permissionUtils";
import { exportToExcel, exportToPDF } from "../../utils/exportUtils";

const AssetsPage = () => {
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inventory");

  // Simplified modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const [requests, setRequests] = useState([]);
  const [requestPagination, setRequestPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
  });

  const [filters, setFilters] = useState({
    status: "",
    category: "",
    department: "",
    location: "",
    search: "",
    warrantyExpiring: false,
    maintenanceDue: false,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1,
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
    location: {
      building: "",
      floor: "",
      room: "",
    },
    specifications: {
      processor: "",
      ram: "",
      storage: "",
      os: "",
    },
    notes: "",
  });

  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    allocated: 0,
    underMaintenance: 0,
    damaged: 0,
    disposed: 0,
  });

  // Asset categories and types
  const assetCategories = {
    Electronics: [
      "Laptop",
      "Desktop",
      "Mobile",
      "Tablet",
      "Monitor",
      "Printer",
      "Server",
      "Keyboard",
      "Mouse",
      "Headphones",
      "Router",
      "Projector",
    ],
    Furniture: ["Chair", "Desk", "Cabinet", "Table", "Shelf"],
    Equipment: [
      "Projector",
      "Scanner",
      "Camera",
      "Phone",
      "Router",
      "Generator",
    ],
    Vehicle: ["Car", "Bike", "Truck", "Van"],
    Software: ["Operating System", "Application", "Database", "Security"],
  };

  const statusOptions = [
    "Available",
    "Assigned",
    "In Use",
    "Under Maintenance",
    "Damaged",
    "Disposed",
    "Lost",
    "Stolen",
    "Retired",
  ];

  const conditionOptions = [
    "Excellent",
    "Good",
    "Fair",
    "Poor",
    "Damaged",
    "Non-Functional",
  ];

  // ✅ RBAC Permissions - FIXED
  const permissions = useMemo(() => {
    const role = user?.role || "employee";
    return {
      canViewAll: true,
      canCreate: ["admin", "hr"].includes(role),
      canEdit: ["admin", "hr"].includes(role),
      canDelete: role === "admin",
      canAllocate: ["admin", "hr"].includes(role),
      canReturn: true,
      canMaintenance: ["admin", "hr"].includes(role),
      canAudit: ["admin", "hr"].includes(role),
      canDispose: role === "admin",
      canExport: ["admin", "hr"].includes(role),
      canImport: ["admin", "hr"].includes(role),
      canViewReports: true,
      canViewAnalytics: true,
      canScan: ["admin", "hr"].includes(role),
      canApprove: ["admin", "hr"].includes(role),
      canRequest: true, // ✅ All employees can request
    };
  }, [user?.role]);

  useEffect(() => {
    loadAssets();
    loadStats();
  }, [filters, pagination.page]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      console.log("🔄 Loading assets...");
      const response = await apiService.getAllAssets(filters);
      const assetsData =
        response.data?.assets || response.assets || response.data || [];
      console.log("✅ Assets loaded:", assetsData.length);
      setAssets(assetsData);

      // Calculate basic stats
      const stats = {
        total: assetsData.length,
        available: assetsData.filter((a) => a.status === "Available").length,
        allocated: assetsData.filter(
          (a) => a.status === "Assigned" || a.status === "In Use"
        ).length,
        underMaintenance: assetsData.filter(
          (a) => a.status === "Under Maintenance"
        ).length,
        damaged: assetsData.filter((a) => a.status === "Damaged").length,
        disposed: assetsData.filter((a) => a.status === "Disposed").length,
      };
      setStats(stats);
    } catch (error) {
      showError("Failed to load assets");
      console.error("Assets loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const stats = {
      total: assets.length,
      available: assets.filter((a) => a.status === "Available").length,
      allocated: assets.filter(
        (a) => a.status === "Assigned" || a.status === "In Use"
      ).length,
      underMaintenance: assets.filter((a) => a.status === "Under Maintenance")
        .length,
      damaged: assets.filter((a) => a.status === "Damaged").length,
      disposed: assets.filter((a) => a.status === "Disposed").length,
    };
    setStats(stats);
  };

  const loadRequests = async (filters = {}) => {
    try {
      setLoading(true);
      const safeFilters = { page: 1, limit: 50, status: 'pending', ...filters };
      const response = await apiService.getAssetRequests(safeFilters);
      
      if (response.success) {
        setRequests(response.data.requests || []);
        setRequestPagination(response.data.pagination || {});
      }
    } catch (error) {
      console.error('Requests load error:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'requests') {
      loadRequests();
    }
  }, [activeTab]);

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      console.log("🆕 Creating asset:", newAsset);
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
        location: {
          building: "",
          floor: "",
          room: "",
        },
        specifications: {
          processor: "",
          ram: "",
          storage: "",
          os: "",
        },
        notes: "",
      });
      // ✅ IMMEDIATE REFRESH
      await loadAssets();
    } catch (error) {
      showError(error.message || "Failed to create asset");
    }
  };

  const handleUpdateAsset = async (assetId, updates) => {
    try {
      await apiService.updateAsset(assetId, updates);
      showSuccess("Asset updated successfully!");
      loadAssets();
    } catch (error) {
      showError("Failed to update asset");
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

  const handleRequestAsset = async (asset) => {
  if (!window.confirm(`Request asset ${asset.name}?`)) return;
  
  try {
    const requestData = {
      assetId: asset._id,
      purpose: "Work requirement",
      expectedReturnDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: `Request for ${asset.name}`,
      projectCode: "GENERAL"
    };
    
    console.log('🔄 Requesting asset allocation:', requestData);
    const response = await apiService.requestAssetAllocation(asset._id, requestData);
    
    if (response.success) {
      showSuccess(`${asset.name} requested! Await HR approval.`);
      loadRequests(); // Refresh requests tab
    } else {
      showError(response.message || 'Request failed');
    }
  } catch (error) {
    console.error('Request error:', error);
    showError('Failed to request asset');
  }
};


  const handleAllocateAsset = async (allocationData) => {
    try {
      console.log("Allocating asset:", allocationData);
      showSuccess("Asset allocation requested!");
      setShowAllocateModal(false);
      loadAssets();
    } catch (error) {
      showError(error.message || "Failed to allocate asset");
    }
  };

  const handleExportAssets = async (format) => {
    try {
      const data = assets.map((asset) => ({
        "Asset ID": asset.assetId,
        Name: asset.name,
        Category: asset.category,
        Type: asset.type,
        Status: asset.status,
        Condition: asset.condition,
        Location: asset.location?.building || "N/A",
        "Purchase Date": asset.purchaseDate,
        "Purchase Price": asset.purchasePrice,
        "Serial Number": asset.serialNumber,
      }));

      if (format === "excel") {
        exportToExcel(data, `assets_export_${Date.now()}.xlsx`);
      } else if (format === "pdf") {
        exportToPDF(data, `assets_export_${Date.now()}.pdf`);
      }
      showSuccess(`Assets exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      showError("Failed to export assets");
    }
  };

  const getAssetIcon = (category, type) => {
    const iconMap = {
      Electronics: {
        Laptop: <Laptop className="h-5 w-5" />,
        Desktop: <Monitor className="h-5 w-5" />,
        Mobile: <Smartphone className="h-5 w-5" />,
        Tablet: <Tablet className="h-5 w-5" />,
        Server: <Server className="h-5 w-5" />,
        Printer: <Printer className="h-5 w-5" />,
        Monitor: <Monitor className="h-5 w-5" />,
        Keyboard: <Keyboard className="h-5 w-5" />,
        Mouse: <Mouse className="h-5 w-5" />,
        Headphones: <Headphones className="h-5 w-5" />,
        Router: <Network className="h-5 w-5" />,
        Projector: <HardDrive className="h-5 w-5" />,
        default: <HardDrive className="h-5 w-5" />,
      },
      Furniture: {
        Chair: (
          <div className="h-5 w-5 bg-yellow-100 rounded flex items-center justify-center text-yellow-800 text-xs">
            C
          </div>
        ),
        Desk: (
          <div className="h-5 w-5 bg-blue-100 rounded flex items-center justify-center text-blue-800 text-xs">
            D
          </div>
        ),
        Cabinet: (
          <div className="h-5 w-5 bg-green-100 rounded flex items-center justify-center text-green-800 text-xs">
            B
          </div>
        ),
        Table: (
          <div className="h-5 w-5 bg-purple-100 rounded flex items-center justify-center text-purple-800 text-xs">
            T
          </div>
        ),
        Shelf: (
          <div className="h-5 w-5 bg-pink-100 rounded flex items-center justify-center text-pink-800 text-xs">
            S
          </div>
        ),
        default: <div className="h-5 w-5 bg-gray-100 rounded"></div>,
      },
      Vehicle: {
        Car: <Truck className="h-5 w-5" />,
        Bike: <Truck className="h-5 w-5" />,
        Truck: <Truck className="h-5 w-5" />,
        Van: <Truck className="h-5 w-5" />,
        default: <Truck className="h-5 w-5" />,
      },
      Equipment: {
        default: <Wrench className="h-5 w-5" />,
      },
      Software: {
        default: <Tag className="h-5 w-5" />,
      },
      default: <HardDrive className="h-5 w-5" />,
    };

    const categoryIcons = iconMap[category] || iconMap.default;
    return categoryIcons[type] || categoryIcons.default || iconMap.default;
  };

  const getStatusColor = (status) => {
    const colors = {
      Available: "bg-green-100 text-green-800 border-green-200",
      Assigned: "bg-blue-100 text-blue-800 border-blue-200",
      "In Use": "bg-indigo-100 text-indigo-800 border-indigo-200",
      "Under Maintenance": "bg-yellow-100 text-yellow-800 border-yellow-200",
      Damaged: "bg-red-100 text-red-800 border-red-200",
      Disposed: "bg-gray-100 text-gray-800 border-gray-200",
      Lost: "bg-red-100 text-red-800 border-red-200",
      Stolen: "bg-red-100 text-red-800 border-red-200",
      Retired: "bg-gray-100 text-gray-800 border-gray-200",
      default: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[status] || colors.default;
  };

  const getConditionColor = (condition) => {
    const colors = {
      Excellent: "text-green-600 bg-green-50",
      Good: "text-blue-600 bg-blue-50",
      Fair: "text-yellow-600 bg-yellow-50",
      Poor: "text-orange-600 bg-orange-50",
      Damaged: "text-red-600 bg-red-50",
      "Non-Functional": "text-red-700 bg-red-100",
    };
    return colors[condition] || colors.Good;
  };

  const getQuickActions = (asset) => {
    const actions = [];

    // ✅ REQUEST - Available for ALL employees
    if (asset.status === "Available" && permissions.canRequest) {
      actions.push({
        label: "Request",
        icon: Users,
        onClick: () => handleRequestAsset(asset),
        color: "text-green-600 hover:bg-green-50",
      });
    }

    if (permissions.canEdit) {
      actions.push({
        label: "Edit",
        icon: Edit,
        onClick: () => handleEditAsset(asset),
        color: "text-blue-600 hover:bg-blue-50",
      });
    }

    if (asset.status === "Available" && permissions.canAllocate) {
      actions.push({
        label: "Allocate",
        icon: Users,
        onClick: () => {
          setSelectedAsset(asset);
          setShowAllocateModal(true);
        },
        color: "text-green-600 hover:bg-green-50",
      });
    }

    if (
      (asset.status === "Assigned" || asset.status === "In Use") &&
      permissions.canReturn
    ) {
      actions.push({
        label: "Return",
        icon: RefreshCw,
        onClick: () => handleReturnAssetPrompt(asset),
        color: "text-purple-600 hover:bg-purple-50",
      });
    }

    if (permissions.canMaintenance) {
      actions.push({
        label: "Maintenance",
        icon: Wrench,
        onClick: () => {
          setSelectedAsset(asset);
          setShowMaintenanceModal(true);
        },
        color: "text-yellow-600 hover:bg-yellow-50",
      });
    }

    if (permissions.canAudit) {
      actions.push({
        label: "Audit",
        icon: Shield,
        onClick: () => handleAuditAsset(asset),
        color: "text-indigo-600 hover:bg-indigo-50",
      });
    }

    if (permissions.canDispose && asset.status !== "Disposed") {
      actions.push({
        label: "Dispose",
        icon: Trash2,
        onClick: () => handleDisposePrompt(asset),
        color: "text-red-600 hover:bg-red-50",
      });
    }

    return actions;
  };

  const handleEditAsset = (asset) => {
    setSelectedAsset(asset);
    setNewAsset({
      name: asset.name,
      assetId: asset.assetId,
      category: asset.category,
      type: asset.type,
      brand: asset.brand || "",
      model: asset.model || "",
      serialNumber: asset.serialNumber || "",
      purchaseDate: asset.purchaseDate || "",
      purchasePrice: asset.purchasePrice || "",
      status: asset.status,
      condition: asset.condition,
      location: asset.location || { building: "", floor: "", room: "" },
      specifications: asset.specifications || {
        processor: "",
        ram: "",
        storage: "",
        os: "",
      },
      notes: asset.notes || "",
    });
    setShowCreateModal(true);
  };

  const handleReturnAssetPrompt = (asset) => {
    if (window.confirm(`Return asset ${asset.name}?`)) {
      const updates = {
        ...asset,
        status: "Available",
        allocatedTo: null,
        allocationDate: null,
      };
      handleUpdateAsset(asset._id, updates);
    }
  };

  const handleDisposePrompt = (asset) => {
    if (
      window.confirm(
        `Dispose asset ${asset.name}? This action cannot be undone.`
      )
    ) {
      const updates = {
        ...asset,
        status: "Disposed",
        disposal: {
          date: new Date().toISOString().split("T")[0],
          method: "Sold",
          disposalValue: asset.currentValue || asset.purchasePrice,
          notes: "Disposed by user",
        },
        isActive: false,
      };
      handleUpdateAsset(asset._id, updates);
    }
  };

  const handleAuditAsset = (asset) => {
    const updates = {
      ...asset,
      lastAudited: new Date().toISOString().split("T")[0],
      auditStatus: "Compliant",
      complianceNotes: "Audit completed",
    };
    handleUpdateAsset(asset._id, updates);
  };

  if (loading && !assets.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Calculate statistics
  const calculatedStats = {
    total: assets.length,
    available: assets.filter((a) => a.status === "Available").length,
    allocated: assets.filter(
      (a) => a.status === "Assigned" || a.status === "In Use"
    ).length,
    underMaintenance: assets.filter((a) => a.status === "Under Maintenance")
      .length,
    damaged: assets.filter((a) => a.status === "Damaged").length,
    disposed: assets.filter((a) => a.status === "Disposed").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Asset Management
              </h1>
              <p className="text-gray-600 mt-1">
                Enterprise asset tracking and management system
              </p>
            </div>
            <div className="flex space-x-3">
              {permissions.canScan && (
                <button
                  onClick={() => showSuccess("Scan functionality coming soon!")}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Scan className="h-4 w-4" />
                  <span>Scan</span>
                </button>
              )}

              {permissions.canImport && (
                <label className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span>Import</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={() =>
                      showSuccess("Import functionality coming soon!")
                    }
                  />
                </label>
              )}

              {permissions.canExport && (
                <div className="relative group">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                    <button
                      onClick={() => handleExportAssets("excel")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export as Excel
                    </button>
                    <button
                      onClick={() => handleExportAssets("pdf")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export as PDF
                    </button>
                  </div>
                </div>
              )}

              {permissions.canViewAnalytics && (
                <button
                  onClick={() =>
                    showSuccess("Analytics dashboard coming soon!")
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </button>
              )}

              {permissions.canViewReports && (
                <button
                  onClick={() => showSuccess("Reports coming soon!")}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Reports</span>
                </button>
              )}

              {permissions.canCreate && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Asset</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "inventory"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Inventory
            </button>

            <button
              onClick={() => setActiveTab("requests")}
              className={
                activeTab === "requests"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : ""
              }
            >
              Requests ({requestPagination.total || 0})
            </button>
            <button
              onClick={() => setActiveTab("allocations")}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "allocations"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Allocations
            </button>
            <button
              onClick={() => setActiveTab("maintenance")}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "maintenance"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Maintenance
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "audit"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Audit Trail
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Assets
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {calculatedStats.total}
                </p>
                <p className="text-xs text-gray-500">
                  ${(calculatedStats.total * 1000).toLocaleString()}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {calculatedStats.available}
                </p>
                <p className="text-xs text-green-600">
                  {calculatedStats.total > 0
                    ? `${(
                        (calculatedStats.available / calculatedStats.total) *
                        100
                      ).toFixed(1)}% availability`
                    : "0% availability"}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Allocated</p>
                <p className="text-2xl font-bold text-gray-900">
                  {calculatedStats.allocated}
                </p>
                <p className="text-xs text-blue-600">
                  {calculatedStats.total > 0
                    ? `${(
                        (calculatedStats.allocated / calculatedStats.total) *
                        100
                      ).toFixed(1)}% utilization`
                    : "0% utilization"}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {calculatedStats.underMaintenance}
                </p>
                <p className="text-xs text-yellow-600">
                  {calculatedStats.total > 0
                    ? `${(
                        (calculatedStats.underMaintenance /
                          calculatedStats.total) *
                        100
                      ).toFixed(1)}% downtime`
                    : "0% downtime"}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Wrench className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Damaged</p>
                <p className="text-2xl font-bold text-gray-900">
                  {calculatedStats.damaged}
                </p>
                <p className="text-xs text-red-600">
                  {calculatedStats.total > 0
                    ? `${(
                        (calculatedStats.damaged / calculatedStats.total) *
                        100
                      ).toFixed(1)}% damage rate`
                    : "0% damage rate"}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Disposed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {calculatedStats.disposed}
                </p>
                <p className="text-xs text-gray-600">
                  {calculatedStats.total > 0
                    ? `${(
                        (calculatedStats.disposed / calculatedStats.total) *
                        100
                      ).toFixed(1)}% disposal rate`
                    : "0% disposal rate"}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Trash2 className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Assets Inventory
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search assets..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
                  />
                </div>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Status</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Categories</option>
                  {Object.keys(assetCategories).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.warrantyExpiring}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          warrantyExpiring: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">
                      Warranty Expiring
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.maintenanceDue}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          maintenanceDue: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">
                      Maintenance Due
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Assets Table */}
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <HardDrive className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No assets found
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Get started by adding your first asset.
                        </p>
                        {permissions.canCreate && (
                          <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add Asset</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-lg relative">
                            {getAssetIcon(asset.category, asset.type)}
                            {asset.serialNumber && (
                              <div className="absolute -top-1 -right-1">
                                <Tag className="h-3 w-3 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {asset.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {asset.assetId}
                            </div>
                            <div className="text-xs text-gray-400">
                              {asset.brand} {asset.model}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {asset.category}
                        </div>
                        <div className="text-sm text-gray-500">
                          {asset.type}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                            asset.status
                          )}`}
                        >
                          {asset.status}
                        </span>
                        {asset.allocatedTo && (
                          <div className="text-xs text-gray-500 mt-1">
                            Allocated to: {asset.allocatedTo?.firstName}{" "}
                            {asset.allocatedTo?.lastName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConditionColor(
                            asset.condition
                          )}`}
                        >
                          {asset.condition}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span>
                              {asset.location?.building || "Not specified"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {asset.location?.floor &&
                              `Floor ${asset.location.floor}`}
                            {asset.location?.room &&
                              `, Room ${asset.location.room}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          $
                          {asset.currentValue?.toLocaleString() ||
                            asset.purchasePrice?.toLocaleString() ||
                            "0"}
                        </div>
                        <div className="text-xs text-gray-500">
                          <div className="flex items-center">
                            {asset.currentValue < asset.purchasePrice ? (
                              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                            ) : (
                              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                            )}
                            ${asset.purchasePrice?.toLocaleString() || "0"}{" "}
                            purchase
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
                              setShowDetailModal(true);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {getQuickActions(asset).map((action, index) => (
                            <button
                              key={index}
                              onClick={action.onClick}
                              className={`${action.color} hover:bg-opacity-20`}
                              title={action.label}
                            >
                              <action.icon className="h-4 w-4" />
                            </button>
                          ))}

                          {permissions.canDelete &&
                            asset.status !== "Disposed" && (
                              <button
                                onClick={() => handleDeleteAsset(asset._id)}
                                className="text-gray-400 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {activeTab === 'requests' && (
  <div className="mt-8">
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Asset Requests</h3>
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map(request => (
              <tr key={request._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>{request.requestedBy?.firstName} {request.requestedBy?.lastName}</div>
                  <div className="text-sm text-gray-500">{request.requestedBy?.employeeId}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{request.assetId?.name}</div>
                  <div className="text-sm text-gray-500">{request.assetId?.assetId}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{request.purpose}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(request.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button 
                    onClick={async () => {
                      await apiService.updateAssetRequest(request._id, { requestStatus: 'approved' });
                      showSuccess('Request approved!');
                      loadRequests();
                    }}
                    className="text-green-600 hover:text-green-900"
                  >
                    ✓ Approve
                  </button>
                  <button 
                    onClick={async () => {
                      await apiService.updateAssetRequest(request._id, { requestStatus: 'rejected' });
                      showSuccess('Request rejected!');
                      loadRequests();
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    ✗ Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

        </div>
      </div>

      {/* Create/Edit Asset Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedAsset ? "Edit Asset" : "Add New Asset"}
              </h2>
            </div>

            <form onSubmit={handleCreateAsset} className="p-6 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Basic Information
                  </h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAsset.name}
                    onChange={(e) =>
                      setNewAsset((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Dell Latitude 5520"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset ID
                  </label>
                  <input
                    type="text"
                    value={newAsset.assetId}
                    onChange={(e) =>
                      setNewAsset((prev) => ({
                        ...prev,
                        assetId: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., AST-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={newAsset.category}
                    onChange={(e) =>
                      setNewAsset((prev) => ({
                        ...prev,
                        category: e.target.value,
                        type: assetCategories[e.target.value]?.[0] || "",
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {Object.keys(assetCategories).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    required
                    value={newAsset.type}
                    onChange={(e) =>
                      setNewAsset((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {assetCategories[newAsset.category]?.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={newAsset.brand}
                    onChange={(e) =>
                      setNewAsset((prev) => ({
                        ...prev,
                        brand: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Dell"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    value={newAsset.model}
                    onChange={(e) =>
                      setNewAsset((prev) => ({
                        ...prev,
                        model: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Latitude 5520"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={newAsset.serialNumber}
                    onChange={(e) =>
                      setNewAsset((prev) => ({
                        ...prev,
                        serialNumber: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Unique serial number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={newAsset.purchaseDate}
                    onChange={(e) =>
                      setNewAsset((prev) => ({
                        ...prev,
                        purchaseDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    value={newAsset.purchasePrice}
                    onChange={(e) =>
                      setNewAsset((prev) => ({
                        ...prev,
                        purchasePrice: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={newAsset.status}
                    onChange={(e) =>
                      setNewAsset((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition
                  </label>
                  <select
                    value={newAsset.condition}
                    onChange={(e) =>
                      setNewAsset((prev) => ({
                        ...prev,
                        condition: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {conditionOptions.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location Information */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Location Information
                  </h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Building
                  </label>
                  <input
                    type="text"
                    value={newAsset.location.building}
                    onChange={(e) =>
                      setNewAsset((prev) => ({
                        ...prev,
                        location: {
                          ...prev.location,
                          building: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Main Building"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Floor
                  </label>
                  <input
                    type="text"
                    value={newAsset.location.floor}
                    onChange={(e) =>
                      setNewAsset((prev) => ({
                        ...prev,
                        location: { ...prev.location, floor: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 3"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room/Desk
                  </label>
                  <input
                    type="text"
                    value={newAsset.location.room}
                    onChange={(e) =>
                      setNewAsset((prev) => ({
                        ...prev,
                        location: { ...prev.location, room: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Room 302 or Desk A1"
                  />
                </div>

                {/* Specifications for Electronics */}
                {newAsset.category === "Electronics" && (
                  <>
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Specifications
                      </h3>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Processor
                      </label>
                      <input
                        type="text"
                        value={newAsset.specifications.processor}
                        onChange={(e) =>
                          setNewAsset((prev) => ({
                            ...prev,
                            specifications: {
                              ...prev.specifications,
                              processor: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Intel i5 11th Gen"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        RAM
                      </label>
                      <input
                        type="text"
                        value={newAsset.specifications.ram}
                        onChange={(e) =>
                          setNewAsset((prev) => ({
                            ...prev,
                            specifications: {
                              ...prev.specifications,
                              ram: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., 16GB"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Storage
                      </label>
                      <input
                        type="text"
                        value={newAsset.specifications.storage}
                        onChange={(e) =>
                          setNewAsset((prev) => ({
                            ...prev,
                            specifications: {
                              ...prev.specifications,
                              storage: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., 512GB SSD"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OS
                      </label>
                      <input
                        type="text"
                        value={newAsset.specifications.os}
                        onChange={(e) =>
                          setNewAsset((prev) => ({
                            ...prev,
                            specifications: {
                              ...prev.specifications,
                              os: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Windows 11 Pro"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    rows="3"
                    value={newAsset.notes}
                    onChange={(e) =>
                      setNewAsset((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Additional notes about the asset..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedAsset(null);
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
                      location: {
                        building: "",
                        floor: "",
                        room: "",
                      },
                      specifications: {
                        processor: "",
                        ram: "",
                        storage: "",
                        os: "",
                      },
                      notes: "",
                    });
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>{selectedAsset ? "Update Asset" : "Create Asset"}</span>
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
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedAsset.name}
                  </h2>
                  <p className="text-gray-600">{selectedAsset.assetId}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        selectedAsset.status
                      )}`}
                    >
                      {selectedAsset.status}
                    </span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConditionColor(
                        selectedAsset.condition
                      )}`}
                    >
                      {selectedAsset.condition}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Category
                  </h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedAsset.category}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Type</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedAsset.type}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Brand</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedAsset.brand || "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Model</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedAsset.model || "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Serial Number
                  </h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedAsset.serialNumber || "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Purchase Date
                  </h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedAsset.purchaseDate
                      ? new Date(
                          selectedAsset.purchaseDate
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Purchase Price
                  </h3>
                  <p className="mt-1 text-sm text-gray-900">
                    ${selectedAsset.purchasePrice?.toLocaleString() || "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Current Value
                  </h3>
                  <p className="mt-1 text-sm text-gray-900">
                    $
                    {selectedAsset.currentValue?.toLocaleString() ||
                      selectedAsset.purchasePrice?.toLocaleString() ||
                      "N/A"}
                  </p>
                </div>
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">
                    Location
                  </h3>
                  <div className="mt-1">
                    <p className="text-sm text-gray-900">
                      {selectedAsset.location?.building || "Not specified"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedAsset.location?.floor &&
                        `Floor ${selectedAsset.location.floor}`}
                      {selectedAsset.location?.room &&
                        `, ${selectedAsset.location.room}`}
                    </p>
                  </div>
                </div>
              </div>

              {selectedAsset.specifications && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Specifications
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedAsset.specifications).map(
                      ([key, value]) =>
                        value && (
                          <div key={key}>
                            <h4 className="text-sm font-medium text-gray-500 capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </h4>
                            <p className="mt-1 text-sm text-gray-900">
                              {value}
                            </p>
                          </div>
                        )
                    )}
                  </div>
                </div>
              )}

              {selectedAsset.notes && (
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedAsset.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Asset Allocation Modal */}
      {showAllocateModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Allocate Asset
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedAsset.name} ({selectedAsset.assetId})
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Employee
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Select an employee</option>
                    <option value="1">John Doe (EMP001)</option>
                    <option value="2">Jane Smith (EMP002)</option>
                    <option value="3">Bob Johnson (EMP003)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allocation Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="permanent">Permanent</option>
                    <option value="temporary">Temporary</option>
                    <option value="project">Project-Based</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Return Date (if temporary)
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose
                  </label>
                  <textarea
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Purpose of allocation..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
                <button
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    showSuccess("Asset allocated successfully!");
                    setShowAllocateModal(false);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Allocate Asset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Schedule Maintenance
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedAsset.name} ({selectedAsset.assetId})
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maintenance Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="preventive">Preventive</option>
                    <option value="corrective">Corrective</option>
                    <option value="predictive">Predictive</option>
                    <option value="repair">Repair</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Cost
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Describe the maintenance required..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
                <button
                  onClick={() => setShowMaintenanceModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    showSuccess("Maintenance scheduled successfully!");
                    setShowMaintenanceModal(false);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Schedule Maintenance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsPage;
