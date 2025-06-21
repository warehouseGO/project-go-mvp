import React, { useState, useEffect } from "react";
import { dashboardAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";
import StatusBadge from "../common/StatusBadge";

const SiteInChargeDashboard = () => {
  const [siteData, setSiteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

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

      {/* Devices Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Devices</h2>
          <button className="btn-primary">Add Device</button>
        </div>

        {siteData.devices.length === 0 ? (
          <p className="text-gray-500">No devices created yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {siteData.devices.map((device) => (
              <div
                key={device.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <h3 className="font-semibold text-gray-900">{device.name}</h3>
                <p className="text-sm text-gray-600">
                  {device.type} • {device.subtype}
                </p>
                <p className="text-xs text-gray-500">
                  Serial: {device.serialNumber}
                </p>
                <div className="mt-2">
                  <span className="text-sm text-gray-600">
                    Jobs: {device.jobs.length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Users Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Users</h2>
          <button className="btn-primary">Manage Users</button>
        </div>

        {siteData.users.length === 0 ? (
          <p className="text-gray-500">No users assigned to this site.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {siteData.users.map((user) => (
              <div
                key={user.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-600">{user.email}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-600">{user.role}</span>
                  <StatusBadge status={user.status} type="user" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteInChargeDashboard;
