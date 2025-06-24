import React, { useState, useEffect } from "react";
import { dashboardAPI, usersAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";
import StatusBadge from "../common/StatusBadge";

const SiteInChargeDashboard = () => {
  const [siteData, setSiteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const [selectedSiteSupervisor, setSelectedSiteSupervisor] = useState("");
  const [selectedClusterSupervisors, setSelectedClusterSupervisors] = useState(
    []
  );
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState("");
  const [assignError, setAssignError] = useState("");

  useEffect(() => {
    if (user?.siteId) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.siteInChargeDashboard(user.siteId);
      setSiteData(response.data);
    } catch (err) {
      setError("Failed to fetch dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const siteSupervisors =
    siteData?.users?.filter((u) => u.role === "SITE_SUPERVISOR") || [];
  const clusterSupervisors =
    siteData?.users?.filter((u) => u.role === "CLUSTER_SUPERVISOR") || [];

  const handleAssign = async () => {
    setAssignLoading(true);
    setAssignError("");
    setAssignSuccess("");
    try {
      await usersAPI.assignClusterSupervisorsToSiteSupervisor(
        selectedSiteSupervisor,
        selectedClusterSupervisors
      );
      setAssignSuccess("Cluster supervisors assigned successfully!");
      setSelectedClusterSupervisors([]);
      fetchDashboardData();
    } catch (err) {
      setAssignError("Failed to assign cluster supervisors.");
    }
    setAssignLoading(false);
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!siteData) return <div className="text-gray-500">No site assigned</div>;

  const totalJobs = siteData.devices.reduce(
    (sum, device) => sum + device.jobs.length,
    0
  );
  const completedJobs = siteData.devices.reduce(
    (sum, device) =>
      sum + device.jobs.filter((job) => job.status === "COMPLETED").length,
    0
  );
  const inProgressJobs = siteData.devices.reduce(
    (sum, device) =>
      sum + device.jobs.filter((job) => job.status === "IN_PROGRESS").length,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {siteData.name} - Site Management
        </h1>
        <p className="text-gray-600">
          Manage devices, users, and monitor site performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total Devices
          </h3>
          <p className="text-3xl font-bold text-primary-600">
            {siteData.devices.length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total Users
          </h3>
          <p className="text-3xl font-bold text-primary-600">
            {siteData.users.length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Completed Jobs
          </h3>
          <p className="text-3xl font-bold text-success-600">{completedJobs}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            In Progress
          </h3>
          <p className="text-3xl font-bold text-warning-600">
            {inProgressJobs}
          </p>
        </div>
      </div>

      {/* Assign Cluster Supervisors to Site Supervisor */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          Assign Cluster Supervisors to Site Supervisor
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site Supervisor
            </label>
            <select
              className="input-field w-full"
              value={selectedSiteSupervisor}
              onChange={(e) => setSelectedSiteSupervisor(e.target.value)}
            >
              <option value="">Select Site Supervisor</option>
              {siteSupervisors.map((ss) => (
                <option key={ss.id} value={ss.id}>
                  {ss.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cluster Supervisors
            </label>
            <select
              className="input-field w-full"
              multiple
              value={selectedClusterSupervisors}
              onChange={(e) =>
                setSelectedClusterSupervisors(
                  Array.from(e.target.selectedOptions, (option) => option.value)
                )
              }
              size={Math.min(6, clusterSupervisors.length)}
            >
              {clusterSupervisors.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.name}
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-1">
              Hold Ctrl (Cmd on Mac) to select multiple.
            </div>
          </div>
        </div>
        <button
          className="btn-primary"
          disabled={
            !selectedSiteSupervisor ||
            selectedClusterSupervisors.length === 0 ||
            assignLoading
          }
          onClick={handleAssign}
        >
          {assignLoading
            ? "Assigning..."
            : "Assign Selected Cluster Supervisors"}
        </button>
        {assignSuccess && (
          <div className="text-green-600 mt-2">{assignSuccess}</div>
        )}
        {assignError && <div className="text-red-600 mt-2">{assignError}</div>}
      </div>
    </div>
  );
};

export default SiteInChargeDashboard;
