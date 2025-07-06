import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  dashboardAPI,
  devicesAPI,
  jobsAPI,
  resourcesAPI,
  sitesAPI,
} from "../utils/api";

const SiteInChargeDashboardContext = createContext();

export const useSiteInChargeDashboard = () => {
  const ctx = useContext(SiteInChargeDashboardContext);
  if (!ctx)
    throw new Error(
      "useSiteInChargeDashboard must be used within a SiteInChargeDashboardProvider"
    );
  return ctx;
};

export const SiteInChargeDashboardProvider = ({ siteId, children }) => {
  const [data, setData] = useState({
    devices: [],
    users: [],
    deviceTypes: [],
    deviceSubtypes: [],
    site: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await dashboardAPI.siteInChargeDashboard(siteId);

      setData({
        devices: res.data.devices || [],
        users: res.data.users || [],
        deviceTypes: res.data.deviceTypes || [],
        deviceSubtypes: res.data.deviceSubtypes || [],
        site: res.data,
      });
    } catch (err) {
      setError("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    if (siteId) fetchDashboard();
  }, [siteId, fetchDashboard]);

  // Device mutations
  const addDevice = async (deviceData) => {
    await devicesAPI.createDevice(deviceData);
    await fetchDashboard();
  };
  const editDevice = async (deviceId, deviceData) => {
    await devicesAPI.updateDevice(deviceId, deviceData);
    await fetchDashboard();
  };
  const deleteDevice = async (deviceId) => {
    await devicesAPI.deleteDevice(deviceId);
    await fetchDashboard();
  };
  // Job mutations
  const addJob = async (jobData) => {
    await jobsAPI.createJobs(jobData);
    await fetchDashboard();
  };
  const updateJobStatus = async (jobId, statusData) => {
    await jobsAPI.updateJobStatus(jobId, statusData);
    await fetchDashboard();
  };
  // Resource mutations
  const addResource = async (resourceData) => {
    await resourcesAPI.createResource(resourceData);
    await fetchDashboard();
  };
  const editResource = async (resourceId, resourceData) => {
    await resourcesAPI.updateResource(resourceId, resourceData);
    await fetchDashboard();
  };
  const deleteResource = async (resourceId) => {
    await resourcesAPI.deleteResource(resourceId);
    await fetchDashboard();
  };
  const allocateResources = async (data) => {
    await resourcesAPI.allocateResources(data);
    await fetchDashboard();
  };
  const updateResourceStatus = async (resourceId, statusData) => {
    await resourcesAPI.updateResourceStatus(resourceId, statusData);
    await fetchDashboard();
  };
  const assignDevicesToSiteSupervisor = async ({
    deviceIds,
    siteSupervisorId,
  }) => {
    await devicesAPI.assignDevicesToSiteSupervisor({
      deviceIds,
      siteSupervisorId,
    });
    await fetchDashboard();
  };

  return (
    <SiteInChargeDashboardContext.Provider
      value={{
        ...data,
        loading,
        error,
        refetch: fetchDashboard,
        // Mutations
        addDevice,
        editDevice,
        deleteDevice,
        addJob,
        updateJobStatus,
        addResource,
        editResource,
        deleteResource,
        allocateResources,
        updateResourceStatus,
        assignDevicesToSiteSupervisor,
      }}
    >
      {children}
    </SiteInChargeDashboardContext.Provider>
  );
};
