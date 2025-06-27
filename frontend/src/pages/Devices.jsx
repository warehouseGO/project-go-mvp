import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { devicesAPI, dashboardAPI } from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import DeviceTable from "../components/common/DeviceTable";
import DeviceFilters from "../components/common/DeviceFilters";
import DeviceModal from "../components/common/DeviceModal";
import AttributesModal from "../components/common/AttributesModal";
import StatusBadge from "../components/common/StatusBadge";
import { JOB_STATUS } from "../utils/constants";

const Devices = () => {
  const { user } = useAuth();
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [siteData, setSiteData] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSupervisorId, setAssignSupervisorId] = useState("");
  const [assignError, setAssignError] = useState("");

  // Filter states
  const [filters, setFilters] = useState({
    siteSupervisor: "",
    clusterSupervisor: "",
    deviceStatus: "",
    deviceType: "",
    deviceSubtype: "",
  });

  // Device management state
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedDeviceId, setExpandedDeviceId] = useState(null);
  const [showAttrModal, setShowAttrModal] = useState(false);
  const [attrModalData, setAttrModalData] = useState(null);
  const [editDevice, setEditDevice] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteDevice, setDeleteDevice] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (user?.siteId) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [devices, filters]);

  const fetchData = async () => {
    try {
      const siteResponse = await dashboardAPI.siteInChargeDashboard(
        user.siteId
      );
      setSiteData(siteResponse.data);
      setDevices(siteResponse.data.devices);
    } catch (err) {
      setError("Failed to fetch devices data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const getDeviceStatus = (device) => {
    if (!device.jobs || device.jobs.length === 0) {
      return "IN_PROGRESS";
    }

    const statuses = device.jobs.map((j) => j.status);

    if (statuses.every((s) => s === JOB_STATUS.COMPLETED)) {
      return JOB_STATUS.COMPLETED;
    }

    if (statuses.includes(JOB_STATUS.CONSTRAINT)) {
      return JOB_STATUS.CONSTRAINT;
    }

    if (statuses.includes(JOB_STATUS.IN_PROGRESS)) {
      return JOB_STATUS.IN_PROGRESS;
    }
    return "IN_PROGRESS";
  };

  // Get all site supervisors and cluster supervisors for dropdowns
  const siteSupervisors =
    siteData?.users.filter((u) => u.role === "SITE_SUPERVISOR") || [];
  const clusterSupervisors =
    siteData?.users.filter((u) => u.role === "CLUSTER_SUPERVISOR") || [];

  const applyFilters = () => {
    let filtered = [...devices];

    // If cluster supervisor is selected, filter by assignedTo
    if (filters.clusterSupervisor) {
      filtered = filtered.filter(
        (device) =>
          String(device.assignedTo) === String(filters.clusterSupervisor)
      );
    } else if (filters.siteSupervisor) {
      // If site supervisor is selected, get all cluster supervisors under that site supervisor
      const clusterIds = clusterSupervisors
        .filter(
          (cs) => String(cs.superiorId) === String(filters.siteSupervisor)
        )
        .map((cs) => cs.id);
      filtered = filtered.filter(
        (device) => device.assignedTo && clusterIds.includes(device.assignedTo)
      );
    }

    if (filters.deviceStatus) {
      filtered = filtered.filter((device) => {
        if (!device.jobs || device.jobs.length === 0)
          return filters.deviceStatus === "IN_PROGRESS";
        const statuses = device.jobs.map((j) => j.status);
        if (filters.deviceStatus === "COMPLETED") {
          return statuses.every((s) => s === "COMPLETED");
        } else if (filters.deviceStatus === "CONSTRAINT") {
          return statuses.includes("CONSTRAINT");
        } else if (filters.deviceStatus === "IN_PROGRESS") {
          return (
            statuses.includes("IN_PROGRESS") && !statuses.includes("CONSTRAINT")
          );
        }
        return true;
      });
    }

    if (filters.deviceType) {
      filtered = filtered.filter(
        (device) => device.type === filters.deviceType
      );
    }

    if (filters.deviceSubtype) {
      filtered = filtered.filter(
        (device) => device.subtype === filters.deviceSubtype
      );
    }

    setFilteredDevices(filtered);
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value,
      ...(filterKey === "siteSupervisor" ? { clusterSupervisor: "" } : {}),
      ...(filterKey === "clusterSupervisor" ? { siteSupervisor: "" } : {}),
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      siteSupervisor: "",
      clusterSupervisor: "",
      deviceStatus: "",
      deviceType: "",
      deviceSubtype: "",
    });
  };

  const handleShowAttributes = (attributes) => {
    setAttrModalData(attributes);
    setShowAttrModal(true);
  };

  const handleShowJobs = (deviceId) => {
    setExpandedDeviceId(expandedDeviceId === deviceId ? null : deviceId);
  };

  const handleAddDevice = async (deviceData) => {
    try {
      setAddLoading(true);
      await devicesAPI.createDevice({
        ...deviceData,
        siteId: user.siteId,
        createdBy: user.id,
      });
      setShowAddModal(false);
      fetchData(); // Refresh data
    } catch (err) {
      setError("Failed to create device");
      console.error(err);
    } finally {
      setAddLoading(false);
    }
  };

  const getAssignedUser = (device) => {
    if (!device.assignedTo || !siteData?.users) return "Unassigned";
    const assignedUser = siteData.users.find((u) => u.id === device.assignedTo);
    return assignedUser
      ? `${assignedUser.name} (${assignedUser.role})`
      : "Unassigned";
  };

  // Get unique device types and subtypes for filter options
  const deviceTypes = [...new Set(devices.map((d) => d.type))];
  const deviceSubtypes = [
    ...new Set(devices.map((d) => d.subtype).filter(Boolean)),
  ];

  // Bulk assign logic for Site In-Charge
  const handleBulkAssign = async (deviceIds, supervisorId) => {
    setAssignLoading(true);
    setAssignError("");

    try {
      await devicesAPI.assignDevicesToSiteSupervisor({
        deviceIds,
        siteSupervisorId: supervisorId,
      });
      fetchData();
    } catch (err) {
      setAssignError("Failed to assign devices.");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleEditDevice = (device) => {
    setEditDevice(device);
  };

  const handleEditDeviceSubmit = async (deviceData) => {
    setEditLoading(true);
    try {
      await devicesAPI.updateDevice(editDevice.id, deviceData);
      setEditDevice(null);
      fetchData();
    } catch (err) {
      setError("Failed to update device");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteDevice = (device) => {
    setDeleteDevice(device);
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await devicesAPI.deleteDevice(deleteDevice.id);
      setDeleteDevice(null);
      fetchData();
    } catch (err) {
      setDeleteError("Failed to delete device");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Devices Management
          </h1>
          <p className="text-gray-600">
            Manage and monitor all devices in your site
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            + Add New Device
          </button>
        </div>
      </div>

      {/* Filters */}
      <DeviceFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        deviceTypes={deviceTypes}
        deviceSubtypes={deviceSubtypes}
        siteSupervisors={siteSupervisors}
        clusterSupervisors={clusterSupervisors}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredDevices.length} of {devices.length} devices
        </p>
      </div>

      {/* Devices Table */}
      {filteredDevices.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            {devices.length === 0
              ? "No devices found."
              : "No devices match the current filters."}
          </p>
        </div>
      ) : (
        <div className="card">
          <DeviceTable
            devices={filteredDevices}
            onShowAttributes={handleShowAttributes}
            onShowJobs={handleShowJobs}
            expandedDeviceId={expandedDeviceId}
            showAssignedTo={true}
            getAssignedUser={getAssignedUser}
            showActions={true}
            enableMultiSelect={true}
            assignableUsers={siteSupervisors}
            onBulkAssign={handleBulkAssign}
            assignLabel="Assign to Site Supervisor"
            assignLoading={assignLoading}
            onEditDevice={handleEditDevice}
            onDeleteDevice={handleDeleteDevice}
          />
        </div>
      )}

      {/* Add Device Modal */}
      <DeviceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        mode="add"
        onSubmit={handleAddDevice}
        loading={addLoading}
        siteSupervisors={siteSupervisors}
      />

      {/* Attributes Modal */}
      <AttributesModal
        isOpen={showAttrModal}
        onClose={() => setShowAttrModal(false)}
        attributes={attrModalData}
      />

      {/* Edit Device Modal */}
      <DeviceModal
        isOpen={!!editDevice}
        onClose={() => setEditDevice(null)}
        mode="edit"
        device={editDevice}
        onSubmit={handleEditDeviceSubmit}
        loading={editLoading}
        siteSupervisors={siteSupervisors}
      />

      {/* Delete Device Confirmation Modal */}
      {deleteDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4 text-red-700">
              Delete Device
            </h2>
            <p className="mb-4">
              Are you sure you want to delete <b>{deleteDevice.name}</b> and all
              its jobs? This action cannot be undone.
            </p>
            {deleteError && (
              <div className="text-red-600 mb-2">{deleteError}</div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                className="btn-secondary"
                onClick={() => setDeleteDevice(null)}
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

export default Devices;
