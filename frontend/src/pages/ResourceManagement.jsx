import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ResourceTable from "../components/resources/ResourceTable";
import ResourceModal from "../components/resources/ResourceModal";
import BulkAllocateModal from "../components/resources/BulkAllocateModal";
import StatusEditModal from "../components/resources/StatusEditModal";
import { resourcesAPI, sitesAPI } from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";

const ResourceManagement = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedResourceIds, setSelectedResourceIds] = useState([]);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editResource, setEditResource] = useState(null);
  const [showBulkAllocateModal, setShowBulkAllocateModal] = useState(false);
  const [showStatusEditModal, setShowStatusEditModal] = useState(false);
  const [statusEditResource, setStatusEditResource] = useState(null);
  const [filters, setFilters] = useState({ type: "", status: "", siteId: "" });

  useEffect(() => {
    fetchData();
    if (user.role === "OWNER") fetchSites();
    // eslint-disable-next-line
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { role: user.role };
      if (user.role === "SITE_INCHARGE") params.siteId = user.siteId;
      const res = await resourcesAPI.getResources(params);
      setResources(res.data);
    } catch (err) {
      setError("Failed to fetch resources");
    } finally {
      setLoading(false);
    }
  };
  const fetchSites = async () => {
    try {
      const res = await sitesAPI.getSites();
      setSites(res.data?.createdSites || res.data?.sites || []);
    } catch {}
  };
  const handleAdd = () => {
    setEditResource(null);
    setShowResourceModal(true);
  };
  const handleEdit = (resource) => {
    setEditResource(resource);
    setShowResourceModal(true);
  };
  const handleDelete = async (resource) => {
    if (!window.confirm(`Delete resource ${resource.name}?`)) return;
    try {
      await resourcesAPI.deleteResource(resource.id);
      fetchData();
    } catch {
      setError("Failed to delete resource");
    }
  };
  const handleBulkAllocate = () => setShowBulkAllocateModal(true);
  const handleEditStatus = (resource) => {
    setStatusEditResource(resource);
    setShowStatusEditModal(true);
  };
  const getSiteName = (siteId) =>
    sites.find((s) => s.id === siteId)?.name || "-";
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
  if (loading) return <LoadingSpinner size="lg" />;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Resource Management
        </h1>
        {user.role === "OWNER" && (
          <button className="btn-primary" onClick={handleAdd}>
            + Add Resource
          </button>
        )}
      </div>
      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          className="input-field"
          placeholder="Type"
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
        />
        <select
          className="input-field"
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value }))
          }
        >
          <option value="">All Statuses</option>
          <option value="WORKING">Working</option>
          <option value="BREAKDOWN">Breakdown</option>
          <option value="FREE">Free</option>
        </select>
        {user.role === "OWNER" && (
          <select
            className="input-field"
            value={filters.siteId}
            onChange={(e) =>
              setFilters((f) => ({ ...f, siteId: e.target.value }))
            }
          >
            <option value="">All Sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <button
          className="btn-secondary"
          onClick={() => setFilters({ type: "", status: "", siteId: "" })}
        >
          Clear
        </button>
      </div>
      <ResourceTable
        resources={filteredResources}
        onEdit={user.role === "OWNER" ? handleEdit : undefined}
        onDelete={user.role === "OWNER" ? handleDelete : undefined}
        onBulkAllocate={user.role === "OWNER" ? handleBulkAllocate : undefined}
        onEditStatus={
          user.role === "SITE_INCHARGE" ? handleEditStatus : undefined
        }
        selectedResourceIds={selectedResourceIds}
        setSelectedResourceIds={setSelectedResourceIds}
        showActions={user.role === "OWNER" || user.role === "SITE_INCHARGE"}
        enableMultiSelect={user.role === "OWNER"}
        sites={sites}
        getSiteName={getSiteName}
        showEditStatus={user.role === "SITE_INCHARGE"}
      />
      {/* Modals */}
      <ResourceModal
        isOpen={showResourceModal}
        onClose={() => setShowResourceModal(false)}
        resource={editResource}
        onSubmit={async (data) => {
          try {
            if (editResource) {
              await resourcesAPI.updateResource(editResource.id, data);
            } else {
              await resourcesAPI.createResource(data);
            }
            setShowResourceModal(false);
            fetchData();
          } catch {
            setError("Failed to save resource");
          }
        }}
        loading={false}
        sites={sites}
        mode={editResource ? "edit" : "add"}
      />
      <BulkAllocateModal
        isOpen={showBulkAllocateModal}
        onClose={() => setShowBulkAllocateModal(false)}
        resourceIds={selectedResourceIds}
        sites={sites}
        onSubmit={async (siteId, allocatedAt) => {
          try {
            await resourcesAPI.allocateResources({
              resourceIds: selectedResourceIds,
              siteId,
              allocatedAt,
            });
            setShowBulkAllocateModal(false);
            setSelectedResourceIds([]);
            fetchData();
          } catch {
            setError("Failed to allocate resources");
          }
        }}
      />
      <StatusEditModal
        isOpen={showStatusEditModal}
        onClose={() => setShowStatusEditModal(false)}
        resource={statusEditResource}
        onSubmit={async (status, dispatchDate) => {
          try {
            await resourcesAPI.updateResourceStatus(statusEditResource.id, {
              status,
              dispatchDate,
            });
            setShowStatusEditModal(false);
            fetchData();
          } catch {
            setError("Failed to update status");
          }
        }}
      />
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
};

export default ResourceManagement;
