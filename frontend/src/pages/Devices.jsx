import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { devicesAPI, dashboardAPI } from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import DeviceTable from "../components/common/DeviceTable";
import DeviceFilters from "../components/common/DeviceFilters";
import AddDeviceModal from "../components/common/AddDeviceModal";
import AttributesModal from "../components/common/AttributesModal";

const Devices = () => {
  const { user } = useAuth();
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [siteData, setSiteData] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

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
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + Add New Device
        </button>
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
          />
        </div>
      )}

      {/* Add Device Modal */}
      <AddDeviceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddDevice}
        loading={addLoading}
      />

      {/* Attributes Modal */}
      <AttributesModal
        isOpen={showAttrModal}
        onClose={() => setShowAttrModal(false)}
        attributes={attrModalData}
      />
    </div>
  );
};

export default Devices;
