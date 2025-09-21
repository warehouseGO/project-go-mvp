import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import DeviceTable from "../components/common/DeviceTable";
import DeviceFilters from "../components/common/DeviceFilters";
import EnhancedDeviceModal from "../components/common/EnhancedDeviceModal";
import AttributesModal from "../components/common/AttributesModal";
import StatusBadge from "../components/common/StatusBadge";
import Pagination from "../components/common/Pagination";
import { JOB_STATUS } from "../utils/constants";
import {
  SiteInChargeDashboardProvider,
  useSiteInChargeDashboard,
} from "../context/SiteInChargeDashboardContext";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { isDelayed } from "../utils/dateUtils";

const DevicesContent = () => {
  const {
    devices,
    deviceTypes,
    users,
    loading,
    error,
    addDevice,
    bulkAddDevices,
    editDevice,
    deleteDevice,
    refetch,
    assignDevicesToSiteSupervisor,
    pagination,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { siteId } = useParams();

  // Read filters from URL
  const filters = useMemo(
    () => ({
      status: searchParams.get("status") || "",
      type: searchParams.get("type") || "",
      priority: searchParams.get("priority") || "",
      siteSupervisor: searchParams.get("siteSupervisor") || "",
      clusterSupervisor: searchParams.get("clusterSupervisor") || "",
      page: currentPage,
      limit: itemsPerPage,
    }),
    [searchParams, currentPage, itemsPerPage]
  );

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
    filters.priority,
  ]);

  // No need to fetch - data comes from context, just filter locally

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchParams({});
    setCurrentPage(1);
  };

  // Get all site supervisors and cluster supervisors for dropdowns
  const siteSupervisors =
    users?.filter((u) => u.role === "SITE_SUPERVISOR") || [];
  const clusterSupervisors =
    users?.filter((u) => u.role === "CLUSTER_SUPERVISOR") || [];

  // Frontend filtering and pagination
  const filteredDevices = useMemo(() => {
    if (!devices) return [];

    let filtered = devices;

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter((device) => device.status === filters.status);
    }
    if (filters.type) {
      filtered = filtered.filter((device) => device.type === filters.type);
    }
    if (filters.priority) {
      filtered = filtered.filter(
        (device) => device.priority === filters.priority
      );
    }
    if (filters.siteSupervisor) {
      filtered = filtered.filter(
        (device) => device.siteSupervisorId === parseInt(filters.siteSupervisor)
      );
    }
    if (filters.clusterSupervisor) {
      filtered = filtered.filter(
        (device) => device.assignedTo === parseInt(filters.clusterSupervisor)
      );
    }

    return filtered;
  }, [devices, filters]);

  // Pagination logic
  const totalDevices = filteredDevices.length;
  const totalPages = Math.ceil(totalDevices / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDevices = filteredDevices.slice(startIndex, endIndex);

  // Use paginated devices
  const filtered = paginatedDevices;

  // Device add/edit/delete handlers
  const handleAddDevice = async (deviceData, isBulkImport = false) => {
    setAddLoading(true);
    try {
      if (isBulkImport) {
        // Handle bulk import from Excel
        await bulkAddDevices(deviceData, site.id);
      } else {
        // Handle manual device creation
        await addDevice(deviceData);
      }
      setShowAddModal(false);
      refetch();
    } catch (error) {
      console.error("Error adding device(s):", error);
      // Optionally show error message to user
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

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalDevices}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        showItemsPerPage={true}
      />

      <EnhancedDeviceModal
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
      <EnhancedDeviceModal
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
