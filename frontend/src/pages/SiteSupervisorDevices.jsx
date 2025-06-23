import React, { useEffect, useState } from "react";
import { dashboardAPI, devicesAPI } from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import DeviceTable from "../components/common/DeviceTable";
import AttributesModal from "../components/common/AttributesModal";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const SiteSupervisorDevices = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subordinates, setSubordinates] = useState([]); // cluster supervisors
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [devices, setDevices] = useState([]);
  const [expandedDeviceId, setExpandedDeviceId] = useState(null);
  const [showAttrModal, setShowAttrModal] = useState(false);
  const [attrModalData, setAttrModalData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await devicesAPI.getDevices();
      setSubordinates(response.data.subordinates);
      // Flatten all devices assigned to this site supervisor
      setDevices(response.data.devices);
    } catch (err) {
      setAssignError("Failed to fetch devices");
    } finally {
      setLoading(false);
    }
  };

  // All cluster supervisors under this site supervisor
  const clusterSupervisors = subordinates.map((sub) => ({
    id: sub.id,
    name: sub.name,
  }));

  const handleBulkAssign = async (deviceIds, clusterSupervisorId) => {
    setAssignLoading(true);
    setAssignError("");
    try {
      await devicesAPI.assignDevicesToClusterSupervisor({
        deviceIds,
        clusterSupervisorId,
      });
      fetchDashboardData();
    } catch (err) {
      setAssignError("Failed to assign devices.");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleShowAttributes = (attributes) => {
    setAttrModalData(attributes);
    setShowAttrModal(true);
  };

  const handleShowJobs = (deviceId) => {
    setExpandedDeviceId(expandedDeviceId === deviceId ? null : deviceId);
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (assignError) return <div className="text-red-600">{assignError}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Devices</h1>
          <p className="text-gray-600">
            Manage and assign your devices to cluster supervisors
          </p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
      <div className="card">
        <DeviceTable
          devices={devices}
          onShowAttributes={handleShowAttributes}
          onShowJobs={handleShowJobs}
          expandedDeviceId={expandedDeviceId}
          showAssignedTo={false}
          showActions={true}
          enableMultiSelect={true}
          assignableUsers={clusterSupervisors}
          onBulkAssign={handleBulkAssign}
          assignLabel="Assign to Cluster Supervisor"
          assignLoading={assignLoading}
        />
      </div>
      <AttributesModal
        isOpen={showAttrModal}
        onClose={() => setShowAttrModal(false)}
        attributes={attrModalData}
      />
    </div>
  );
};

export default SiteSupervisorDevices;
