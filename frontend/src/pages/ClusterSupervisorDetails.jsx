import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dashboardAPI } from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatusBadge from "../components/common/StatusBadge";
import DeviceTable from "../components/common/DeviceTable";
import AttributesModal from "../components/common/AttributesModal";
import { JOB_STATUS } from "../utils/constants";

const ClusterSupervisorDetails = () => {
  const { subordinateId } = useParams();
  const navigate = useNavigate();
  const [subordinate, setSubordinate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedDeviceId, setExpandedDeviceId] = useState(null);
  const [showAttrModal, setShowAttrModal] = useState(false);
  const [attrModalData, setAttrModalData] = useState(null);

  useEffect(() => {
    fetchSubordinateData();
  }, [subordinateId]);

  const fetchSubordinateData = async () => {
    try {
      const response = await dashboardAPI.siteSupervisorDashboard();
      const foundSubordinate = response.data.find(
        (sub) => sub.id === parseInt(subordinateId)
      );

      if (!foundSubordinate) {
        setError("Cluster supervisor not found");
        return;
      }

      setSubordinate(foundSubordinate);
    } catch (err) {
      setError("Failed to fetch cluster supervisor data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAttributes = (attributes) => {
    setAttrModalData(attributes);
    setShowAttrModal(true);
  };

  const handleShowJobs = (deviceId) => {
    setExpandedDeviceId(expandedDeviceId === deviceId ? null : deviceId);
  };

  const calculateStats = (subordinate) => {
    if (!subordinate)
      return {
        totalDevices: 0,
        totalJobs: 0,
        completed: 0,
        inProgress: 0,
        constraint: 0,
      };

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

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!subordinate)
    return <div className="text-red-600">Cluster supervisor not found</div>;

  const stats = calculateStats(subordinate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="btn-secondary mb-4">
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {subordinate.name} - Device Details
          </h1>
          <p className="text-gray-600">{subordinate.email}</p>
        </div>
        <div className="text-right">
          <StatusBadge status={subordinate.status} type="user" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total Devices
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {stats.totalDevices}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total Jobs
          </h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalJobs}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Completed
          </h3>
          <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            In Progress
          </h3>
          <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Constraint
          </h3>
          <p className="text-3xl font-bold text-red-600">{stats.constraint}</p>
        </div>
      </div>

      {/* Devices Table */}
      {subordinate.assignedDevices.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            No devices assigned to this cluster supervisor.
          </p>
        </div>
      ) : (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Assigned Devices
          </h2>
          <DeviceTable
            devices={subordinate.assignedDevices}
            onShowAttributes={handleShowAttributes}
            onShowJobs={handleShowJobs}
            expandedDeviceId={expandedDeviceId}
            showAssignedTo={false}
            showActions={true}
          />
        </div>
      )}

      {/* Attributes Modal */}
      <AttributesModal
        isOpen={showAttrModal}
        onClose={() => setShowAttrModal(false)}
        attributes={attrModalData}
      />
    </div>
  );
};

export default ClusterSupervisorDetails;
