import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dashboardAPI } from "../utils/api";
import DeviceTable from "../components/common/DeviceTable";
import DeviceFilters from "../components/common/DeviceFilters";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { DEVICE_TYPES, DEVICE_SUBTYPES } from "../utils/constants";
import AttributesModal from "../components/common/AttributesModal";

const SiteDetails = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [siteDetails, setSiteDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deviceFilters, setDeviceFilters] = useState({});
  const [attributesModalOpen, setAttributesModalOpen] = useState(false);
  const [selectedDeviceAttributes, setSelectedDeviceAttributes] =
    useState(null);
  const [jobsModalOpen, setJobsModalOpen] = useState(false);
  const [selectedDeviceJobs, setSelectedDeviceJobs] = useState(null);
  const [expandedDeviceId, setExpandedDeviceId] = useState(null);

  useEffect(() => {
    fetchSiteDetails();
    // eslint-disable-next-line
  }, [siteId]);

  const fetchSiteDetails = async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.siteInChargeDashboard(siteId);
      setSiteDetails(res.data);
    } catch (err) {
      setSiteDetails(null);
    }
    setLoading(false);
  };

  // Filtering logic
  const getFilteredDevices = () => {
    if (!siteDetails) return [];
    let filtered = siteDetails.devices;
    if (deviceFilters.siteSupervisor) {
      filtered = filtered.filter(
        (d) =>
          d.siteSupervisorId &&
          d.siteSupervisorId.toString() === deviceFilters.siteSupervisor
      );
    }
    if (deviceFilters.clusterSupervisor) {
      filtered = filtered.filter(
        (d) =>
          d.assignedTo &&
          d.assignedTo.toString() === deviceFilters.clusterSupervisor
      );
    }
    if (deviceFilters.deviceStatus) {
      filtered = filtered.filter((d) => {
        const statuses = d.jobs.map((j) => j.status);
        if (deviceFilters.deviceStatus === "COMPLETED") {
          return (
            statuses.length > 0 && statuses.every((s) => s === "COMPLETED")
          );
        }
        if (deviceFilters.deviceStatus === "CONSTRAINT") {
          return statuses.includes("CONSTRAINT");
        }
        if (deviceFilters.deviceStatus === "IN_PROGRESS") {
          return statuses.includes("IN_PROGRESS");
        }
        return true;
      });
    }
    if (deviceFilters.deviceType) {
      filtered = filtered.filter((d) => d.type === deviceFilters.deviceType);
    }
    if (deviceFilters.deviceSubtype) {
      filtered = filtered.filter(
        (d) => d.subtype === deviceFilters.deviceSubtype
      );
    }
    return filtered;
  };

  // Get unique site supervisors and cluster supervisors for dropdowns
  const siteSupervisors =
    siteDetails?.users?.filter((u) => u.role === "SITE_SUPERVISOR") || [];
  const clusterSupervisors =
    siteDetails?.users?.filter((u) => u.role === "CLUSTER_SUPERVISOR") || [];

  const handleFilterChange = (key, value) => {
    setDeviceFilters((prev) => ({ ...prev, [key]: value }));
  };
  const handleClearFilters = () => setDeviceFilters({});

  const handleShowAttributes = (device) => {
    setSelectedDeviceAttributes(device || {});
    setAttributesModalOpen(true);
  };
  const handleShowJobs = (deviceId) => {
    setExpandedDeviceId((prev) => (prev === deviceId ? null : deviceId));
  };
  const closeAttributesModal = () => setAttributesModalOpen(false);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {siteDetails?.name
            ? `${siteDetails.name} - Site Details`
            : "Site Details"}
        </h1>
        <button
          className="btn-secondary"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
      {loading ? (
        <LoadingSpinner size="lg" />
      ) : siteDetails ? (
        <>
          <DeviceFilters
            filters={deviceFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            deviceTypes={DEVICE_TYPES}
            deviceSubtypes={DEVICE_SUBTYPES}
            siteSupervisors={siteSupervisors}
            clusterSupervisors={clusterSupervisors}
          />
          <DeviceTable
            devices={getFilteredDevices()}
            showActions={true}
            showAssignedTo={true}
            onShowAttributes={handleShowAttributes}
            onShowJobs={handleShowJobs}
            expandedDeviceId={expandedDeviceId}
          />

          <AttributesModal
            isOpen={attributesModalOpen}
            attributes={selectedDeviceAttributes}
            onClose={closeAttributesModal}
          />
        </>
      ) : (
        <div className="text-gray-500">No site details found.</div>
      )}
    </div>
  );
};

export default SiteDetails;
