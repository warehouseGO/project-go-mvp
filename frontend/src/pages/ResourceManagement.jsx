import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ResourceTable from "../components/resources/ResourceTable";
import ResourceModal from "../components/resources/ResourceModal";
import BulkAllocateModal from "../components/resources/BulkAllocateModal";
import StatusEditModal from "../components/resources/StatusEditModal";
import LoadingSpinner from "../components/common/LoadingSpinner";
import {
  SiteInChargeDashboardProvider,
  useSiteInChargeDashboard,
} from "../context/SiteInChargeDashboardContext";
import {
  OwnerResourceManagementProvider,
  useOwnerResourceManagement,
} from "../context/OwnerResourceManagementContext";
import { useSearchParams } from "react-router-dom";

const ResourceManagementInChargeContent = () => {
  const { user } = useAuth();
  const {
    site,
    loading,
    error,
    addResource,
    editResource,
    deleteResource,
    allocateResources,
    updateResourceStatus,
    refetch,
  } = useSiteInChargeDashboard();
  const [selectedResourceIds, setSelectedResourceIds] = useState([]);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editResourceData, setEditResourceData] = useState(null);
  const [showBulkAllocateModal, setShowBulkAllocateModal] = useState(false);
  const [showStatusEditModal, setShowStatusEditModal] = useState(false);
  const [statusEditResource, setStatusEditResource] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  // Resources and sites from context
  const resources = site?.resources || [];
  const sites = [site];

  // URL param-based filters
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = {
    type: searchParams.get("type") || "",
    status: searchParams.get("status") || "",
    siteId: searchParams.get("siteId") || "",
  };
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  // Filtering logic (client-side for now)
  const filteredResources = resources.filter((r) => {
    if (
      filters.type &&
      r.type.replace(/\s+/g, "").toLowerCase() !==
        filters.type.replace(/\s+/g, "").toLowerCase()
    )
      return false;
    if (filters.status && r.status !== filters.status) return false;
    if (filters.siteId && String(r.siteId) !== String(filters.siteId))
      return false;
    return true;
  });

  const handleAdd = () => {
    setEditResourceData(null);
    setShowResourceModal(true);
  };
  const handleEdit = (resource) => {
    setEditResourceData(resource);
    setShowResourceModal(true);
  };
  const handleDelete = async (resource) => {
    if (!window.confirm(`Delete resource ${resource.name}?`)) return;
    setActionLoading(true);
    setActionError("");
    try {
      await deleteResource(resource.id);
      refetch();
    } catch {
      setActionError("Failed to delete resource");
    } finally {
      setActionLoading(false);
    }
  };
  const handleBulkAllocate = () => setShowBulkAllocateModal(true);
  const handleEditStatus = (resource) => {
    setStatusEditResource(resource);
    setShowStatusEditModal(true);
  };
  const getSiteName = (siteId) =>
    sites.find((s) => s.id === siteId)?.name || "-";

  if (loading) return <LoadingSpinner size="lg" />;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Resource Management
        </h1>
      </div>
      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          className="input-field"
          placeholder="Type"
          value={filters.type}
          onChange={(e) => updateFilter("type", e.target.value)}
        />
        <select
          className="input-field"
          value={filters.status}
          onChange={(e) => updateFilter("status", e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="WORKING">Working</option>
          <option value="BREAKDOWN">Breakdown</option>
          <option value="FREE">Free</option>
        </select>
        <button className="btn-secondary" onClick={() => setSearchParams({})}>
          Clear
        </button>
      </div>
      <ResourceTable
        resources={filteredResources}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkAllocate={undefined}
        onEditStatus={handleEditStatus}
        selectedResourceIds={selectedResourceIds}
        setSelectedResourceIds={setSelectedResourceIds}
        showActions={true}
        enableMultiSelect={false}
        sites={sites}
        getSiteName={getSiteName}
        showEditStatus={true}
      />
      {/* Modals */}
      <ResourceModal
        isOpen={showResourceModal}
        onClose={() => setShowResourceModal(false)}
        resource={editResourceData}
        onSubmit={async (data) => {
          setActionLoading(true);
          setActionError("");
          try {
            if (editResourceData) {
              await editResource(editResourceData.id, data);
            } else {
              await addResource(data);
            }
            setShowResourceModal(false);
            refetch();
          } catch {
            setActionError("Failed to save resource");
          } finally {
            setActionLoading(false);
          }
        }}
        loading={actionLoading}
        sites={sites}
        mode={editResourceData ? "edit" : "add"}
      />
      <StatusEditModal
        isOpen={showStatusEditModal}
        onClose={() => setShowStatusEditModal(false)}
        resource={statusEditResource}
        onSubmit={async (status, dispatchDate) => {
          setActionLoading(true);
          setActionError("");
          try {
            await updateResourceStatus(statusEditResource.id, {
              status,
              dispatchDate,
            });
            setShowStatusEditModal(false);
            refetch();
          } catch {
            setActionError("Failed to update status");
          } finally {
            setActionLoading(false);
          }
        }}
      />
      {actionError && <div className="text-red-600 mt-2">{actionError}</div>}
    </div>
  );
};

const ResourceManagementOwnerContent = () => {
  const {
    resources,
    sites,
    loading,
    error,
    addResource,
    editResource,
    deleteResource,
    allocateResources,
    updateResourceStatus,
    refetch,
  } = useOwnerResourceManagement();
  const [selectedResourceIds, setSelectedResourceIds] = useState([]);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editResourceData, setEditResourceData] = useState(null);
  const [showBulkAllocateModal, setShowBulkAllocateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  // URL param-based filters
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = {
    type: searchParams.get("type") || "",
    status: searchParams.get("status") || "",
    siteId: searchParams.get("siteId") || "",
  };
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  // Filtering logic (cross-site, free/unassigned)
  const filteredResources = resources.filter((r) => {
    if (
      filters.type &&
      r.type.replace(/\s+/g, "").toLowerCase() !==
        filters.type.replace(/\s+/g, "").toLowerCase()
    )
      return false;
    if (filters.status && r.status !== filters.status) return false;
    if (filters.siteId && String(r.siteId) !== String(filters.siteId))
      return false;
    return true;
  });

  const handleAdd = () => {
    setEditResourceData(null);
    setShowResourceModal(true);
  };
  const handleEdit = (resource) => {
    setEditResourceData(resource);
    setShowResourceModal(true);
  };
  const handleDelete = async (resource) => {
    if (!window.confirm(`Delete resource ${resource.name}?`)) return;
    setActionLoading(true);
    setActionError("");
    try {
      await deleteResource(resource.id);
      refetch();
    } catch {
      setActionError("Failed to delete resource");
    } finally {
      setActionLoading(false);
    }
  };
  const handleBulkAllocate = () => setShowBulkAllocateModal(true);
  const getSiteName = (siteId) =>
    sites.find((s) => s.id === siteId)?.name || "-";

  if (loading) return <LoadingSpinner size="lg" />;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Resource Management
        </h1>
        <button className="btn-primary" onClick={handleAdd}>
          + Add Resource
        </button>
      </div>
      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          className="input-field"
          placeholder="Type"
          value={filters.type}
          onChange={(e) => updateFilter("type", e.target.value)}
        />
        <select
          className="input-field"
          value={filters.status}
          onChange={(e) => updateFilter("status", e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="WORKING">Working</option>
          <option value="BREAKDOWN">Breakdown</option>
          <option value="FREE">Free</option>
        </select>
        <select
          className="input-field"
          value={filters.siteId}
          onChange={(e) => updateFilter("siteId", e.target.value)}
        >
          <option value="">All Sites</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button className="btn-secondary" onClick={() => setSearchParams({})}>
          Clear
        </button>
      </div>
      <ResourceTable
        resources={filteredResources}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkAllocate={handleBulkAllocate}
        onEditStatus={undefined}
        selectedResourceIds={selectedResourceIds}
        setSelectedResourceIds={setSelectedResourceIds}
        showActions={true}
        enableMultiSelect={true}
        sites={sites}
        getSiteName={getSiteName}
        showEditStatus={false}
      />
      {/* Modals */}
      <ResourceModal
        isOpen={showResourceModal}
        onClose={() => setShowResourceModal(false)}
        resource={editResourceData}
        onSubmit={async (data) => {
          setActionLoading(true);
          setActionError("");
          try {
            if (editResourceData) {
              await editResource(editResourceData.id, data);
            } else {
              await addResource(data);
            }
            setShowResourceModal(false);
            refetch();
          } catch {
            setActionError("Failed to save resource");
          } finally {
            setActionLoading(false);
          }
        }}
        loading={actionLoading}
        sites={sites}
        mode={editResourceData ? "edit" : "add"}
      />
      <BulkAllocateModal
        isOpen={showBulkAllocateModal}
        onClose={() => setShowBulkAllocateModal(false)}
        resourceIds={selectedResourceIds}
        sites={sites}
        onSubmit={async (siteId, allocatedAt) => {
          setActionLoading(true);
          setActionError("");
          try {
            await allocateResources({
              resourceIds: selectedResourceIds,
              siteId,
              allocatedAt,
            });
            setShowBulkAllocateModal(false);
            setSelectedResourceIds([]);
            refetch();
          } catch {
            setActionError("Failed to allocate resources");
          } finally {
            setActionLoading(false);
          }
        }}
      />
      {actionError && <div className="text-red-600 mt-2">{actionError}</div>}
    </div>
  );
};

const ResourceManagement = () => {
  const { user } = useAuth();
  if (user.role === "SITE_INCHARGE") {
    return (
      <SiteInChargeDashboardProvider siteId={user.siteId}>
        <ResourceManagementInChargeContent />
      </SiteInChargeDashboardProvider>
    );
  }
  if (user.role === "OWNER") {
    return (
      <OwnerResourceManagementProvider>
        <ResourceManagementOwnerContent />
      </OwnerResourceManagementProvider>
    );
  }
  return <div className="p-8">Access Denied</div>;
};

export default ResourceManagement;
