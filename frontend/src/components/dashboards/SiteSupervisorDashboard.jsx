import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { dashboardAPI, devicesAPI } from "../../utils/api";
import LoadingSpinner from "../common/LoadingSpinner";
import StatusBadge from "../common/StatusBadge";
import { JOB_STATUS } from "../../utils/constants";
import { useAuth } from "../../context/AuthContext";
import DeviceTable from "../common/DeviceTable";

const SiteSupervisorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subordinates, setSubordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignDeviceId, setAssignDeviceId] = useState(null);
  const [assignClusterId, setAssignClusterId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.siteSupervisorDashboard();
      setSubordinates(response.data);
    } catch (err) {
      setError("Failed to fetch dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (subordinate) => {
    const totalDevices = subordinate.assignedDevices.length;
    const totalJobs = subordinate.assignedDevices.reduce(
      (sum, device) => sum + device.jobs.length,
      0
    );

    const jobStats = subordinate.assignedDevices.reduce((stats, device) => {
      device.jobs.forEach((job) => {
        stats[job.status] = (stats[job.status] || 0) + 1;
      });
      return stats;
    }, {});

    return {
      totalDevices,
      totalJobs,
      completed: jobStats[JOB_STATUS.COMPLETED] || 0,
      inProgress: jobStats[JOB_STATUS.IN_PROGRESS] || 0,
      constraint: jobStats[JOB_STATUS.CONSTRAINT] || 0,
    };
  };

  const handleViewDetails = (subordinate) => {
    navigate(`/cluster-supervisor/${subordinate.id}`);
  };

  // Open assign modal for a device
  const openAssignModal = (deviceId) => {
    setAssignDeviceId(deviceId);
    setAssignClusterId("");
    setAssignError("");
    setAssignModalOpen(true);
  };
  const handleAssignDevice = async () => {
    if (!assignClusterId) {
      setAssignError("Please select a cluster supervisor.");
      return;
    }
    setAssignLoading(true);
    setAssignError("");
    try {
      await devicesAPI.assignDeviceToClusterSupervisor({
        deviceId: assignDeviceId,
        clusterSupervisorId: assignClusterId,
      });
      setAssignModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      setAssignError("Failed to assign device.");
    } finally {
      setAssignLoading(false);
    }
  };

  // Bulk assign logic for Site Supervisor

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <div className="text-red-600">{error}</div>;

  const totalSubordinates = subordinates.length;
  const totalDevices = subordinates.reduce(
    (sum, sub) => sum + sub.assignedDevices.length,
    0
  );
  const totalJobs = subordinates.reduce(
    (sum, sub) =>
      sum +
      sub.assignedDevices.reduce(
        (deviceSum, device) => deviceSum + device.jobs.length,
        0
      ),
    0
  );

  // Flatten all devices assigned to this site supervisor
  const allDevices = subordinates.flatMap((sub) => sub.assignedDevices);
  // All cluster supervisors under this site supervisor
  const clusterSupervisors = subordinates.map((sub) => ({
    id: sub.id,
    name: sub.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Subordinates Overview
        </h1>
        <p className="text-gray-600">
          Monitor your cluster supervisors' devices and job progress
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Cluster Supervisors
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {totalSubordinates}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total Devices
          </h3>
          <p className="text-3xl font-bold text-green-600">{totalDevices}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total Jobs
          </h3>
          <p className="text-3xl font-bold text-purple-600">{totalJobs}</p>
        </div>
      </div>

      {/* Cluster Supervisor Cards */}
      {subordinates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No cluster supervisors assigned to you yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subordinates.map((subordinate) => {
            const stats = calculateStats(subordinate);
            return (
              <div
                key={subordinate.id}
                className="card hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {subordinate.name}
                    </h3>
                    <StatusBadge status={subordinate.status} type="user" />
                  </div>
                  <p className="text-sm text-gray-600">{subordinate.email}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.totalDevices}
                    </p>
                    <p className="text-xs text-blue-700">Devices</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {stats.totalJobs}
                    </p>
                    <p className="text-xs text-green-700">Jobs</p>
                  </div>
                </div>

                {/* Job Status Breakdown */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Job Status Breakdown
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Completed</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {stats.completed}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">
                          In Progress
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {stats.inProgress}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">
                          Constraint
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {stats.constraint}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Devices Table for this subordinate */}

                {/* Action Button */}
                <button
                  className="w-full btn-primary"
                  onClick={() => handleViewDetails(subordinate)}
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Devices Table for this site supervisor */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">My Devices</h2>
          <Link to="/site-supervisor/devices" className="btn-primary">
            Manage & Assign Devices
          </Link>
        </div>
        <p className="text-gray-500 mt-2">
          Go to the device management page to assign devices to cluster
          supervisors in bulk.
        </p>
      </div>

      {/* Assign Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">
              Assign Device to Cluster Supervisor
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Cluster Supervisor
              </label>
              <select
                className="input-field w-full"
                value={assignClusterId}
                onChange={(e) => setAssignClusterId(e.target.value)}
              >
                <option value="">Select...</option>
                {subordinates.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {cs.name}
                  </option>
                ))}
              </select>
            </div>
            {assignError && (
              <div className="text-xs text-red-600 mb-2">{assignError}</div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="btn-secondary"
                onClick={() => setAssignModalOpen(false)}
                disabled={assignLoading}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleAssignDevice}
                disabled={assignLoading || !assignClusterId}
              >
                {assignLoading ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteSupervisorDashboard;
