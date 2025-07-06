import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import DeviceTable from "../components/common/DeviceTable";
import DeviceFilters from "../components/common/DeviceFilters";
import DeviceModal from "../components/common/DeviceModal";
import AttributesModal from "../components/common/AttributesModal";
import StatusBadge from "../components/common/StatusBadge";
import { JOB_STATUS } from "../utils/constants";
import {
  SiteInChargeDashboardProvider,
  useSiteInChargeDashboard,
} from "../context/SiteInChargeDashboardContext";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";

const DevicesContent = () => {
  const {
    devices,
    users,
    deviceTypes,
    deviceSubtypes,
    loading,
    error,
    addDevice,
    editDevice,
    deleteDevice,
    refetch,
    assignDevicesToSiteSupervisor,
  } = useSiteInChargeDashboard();
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [expandedDeviceId, setExpandedDeviceId] = useState(null);
  const [showAttrModal, setShowAttrModal] = useState(false);
  const [attrModalData, setAttrModalData] = useState(null);
  const [editDeviceData, setEditDeviceData] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteDeviceData, setDeleteDeviceData] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { siteId } = useParams();

  // Read filters from URL
  const filters = {
    status: searchParams.get("status") || "",
    type: searchParams.get("type") || "",
    subtype: searchParams.get("subtype") || "",
    siteSupervisor: searchParams.get("siteSupervisor") || "",
    clusterSupervisor: searchParams.get("clusterSupervisor") || "",
  };

  // Update filters in URL
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  // Reset selection on filter change
  useEffect(() => {
    setSelectedDeviceIds([]);
  }, [
    filters.siteSupervisor,
    filters.clusterSupervisor,
    filters.status,
    filters.type,
    filters.subtype,
  ]);

  // Get all site supervisors and cluster supervisors for dropdowns
  const siteSupervisors =
    users?.filter((u) => u.role === "SITE_SUPERVISOR") || [];
  const clusterSupervisors =
    users?.filter((u) => u.role === "CLUSTER_SUPERVISOR") || [];

  // Filtering logic
  let filtered = [...(devices || [])];
  if (filters.siteSupervisor) {
    filtered = filtered.filter(
      (device) =>
        String(device.siteSupervisorId) === String(filters.siteSupervisor)
    );
  }
  if (filters.clusterSupervisor) {
    filtered = filtered.filter(
      (device) =>
        String(device.assignedTo) === String(filters.clusterSupervisor)
    );
  }
  if (filters.status) {
    filtered = filtered.filter((device) => {
      if (!device.jobs || device.jobs.length === 0)
        return filters.status === "IN_PROGRESS";
      const statuses = device.jobs.map((j) => j.status);
      if (filters.status === "COMPLETED") {
        return statuses.every((s) => s === "COMPLETED");
      } else if (filters.status === "CONSTRAINT") {
        return statuses.includes("CONSTRAINT");
      } else if (filters.status === "IN_PROGRESS") {
        return (
          statuses.includes("IN_PROGRESS") && !statuses.includes("CONSTRAINT")
        );
      }
      return true;
    });
  }
  if (filters.type) {
    filtered = filtered.filter((device) => device.type === filters.type);
  }
  if (filters.subtype) {
    filtered = filtered.filter((device) => device.subtype === filters.subtype);
  }

  // Device add/edit/delete handlers
  const handleAddDevice = async (deviceData) => {
    setAddLoading(true);
    try {
      await addDevice(deviceData);
      setShowAddModal(false);
      refetch();
    } catch {
      // Optionally show error
    } finally {
      setAddLoading(false);
    }
  };
  const handleEditDevice = (device) => {
    setEditDeviceData(device);
  };
  const handleEditDeviceSubmit = async (deviceData) => {
    setEditLoading(true);
    try {
      await editDevice(editDeviceData.id, deviceData);
      setEditDeviceData(null);
      refetch();
    } catch {
      // Optionally show error
    } finally {
      setEditLoading(false);
    }
  };
  const handleDeleteDevice = (device) => {
    setDeleteDeviceData(device);
    setDeleteError("");
  };
  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteDevice(deleteDeviceData.id);
      setDeleteDeviceData(null);
      refetch();
    } catch {
      setDeleteError("Failed to delete device");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Bulk assign handler
  const handleBulkAssign = async (deviceIds, siteSupervisorId) => {
    setAssignLoading(true);
    try {
      await assignDevicesToSiteSupervisor({ deviceIds, siteSupervisorId });
      refetch();
    } catch {
      // Optionally show error
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Device
        </button>
      </div>
      <DeviceFilters
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={() => setSearchParams({})}
        deviceTypes={deviceTypes}
        deviceSubtypes={deviceSubtypes}
        siteSupervisors={siteSupervisors}
        clusterSupervisors={clusterSupervisors}
      />
      <DeviceTable
        devices={filtered}
        onShowAttributes={(attributes) => {
          setAttrModalData(attributes);
          setShowAttrModal(true);
        }}
        onShowJobs={(deviceId) =>
          setExpandedDeviceId(expandedDeviceId === deviceId ? null : deviceId)
        }
        expandedDeviceId={expandedDeviceId}
        showAssignedTo={true}
        getAssignedUser={(device) => {
          if (!device.assignedTo || !users) return "Unassigned";
          const assignedUser = users.find((u) => u.id === device.assignedTo);
          return assignedUser
            ? `${assignedUser.name} (${assignedUser.role})`
            : "Unassigned";
        }}
        showActions={true}
        enableMultiSelect={true}
        assignableUsers={siteSupervisors}
        onEditDevice={handleEditDevice}
        onDeleteDevice={handleDeleteDevice}
        onBulkAssign={handleBulkAssign}
        assignLabel="Assign to Site Supervisor"
        assignLoading={assignLoading}
        selectedDeviceIds={selectedDeviceIds}
        setSelectedDeviceIds={setSelectedDeviceIds}
      />
      <DeviceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        mode="add"
        onSubmit={handleAddDevice}
        loading={addLoading}
        siteSupervisors={siteSupervisors}
      />
      <AttributesModal
        isOpen={showAttrModal}
        onClose={() => setShowAttrModal(false)}
        attributes={attrModalData}
      />
      <DeviceModal
        isOpen={!!editDeviceData}
        onClose={() => setEditDeviceData(null)}
        mode="edit"
        device={editDeviceData}
        onSubmit={handleEditDeviceSubmit}
        loading={editLoading}
        siteSupervisors={siteSupervisors}
      />
      {/* Delete Device Confirmation Modal */}
      {deleteDeviceData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4 text-red-700">
              Delete Device
            </h2>
            <p className="mb-4">
              Are you sure you want to delete <b>{deleteDeviceData.name}</b> and
              all its jobs? This action cannot be undone.
            </p>
            {deleteError && (
              <div className="text-red-600 mb-2">{deleteError}</div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                className="btn-secondary"
                onClick={() => setDeleteDeviceData(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Devices = () => {
  const { user } = useAuth();
  if (!user?.siteId)
    return <div className="text-gray-500">No site assigned</div>;
  return (
    <SiteInChargeDashboardProvider siteId={user.siteId}>
      <DevicesContent />
    </SiteInChargeDashboardProvider>
  );
};

export default Devices;
