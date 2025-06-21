import { useState, useEffect } from "react";
import { JOB_STATUS } from "../utils/constants";

export const useDevices = (fetchFunction, dependencies = []) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedDeviceId, setExpandedDeviceId] = useState(null);
  const [showAttrModal, setShowAttrModal] = useState(false);
  const [attrModalData, setAttrModalData] = useState(null);

  useEffect(() => {
    fetchData();
  }, dependencies);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetchFunction();
      setDevices(response.data);
    } catch (err) {
      setError("Failed to fetch devices data");
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

  const closeAttrModal = () => {
    setShowAttrModal(false);
    setAttrModalData(null);
  };

  const getDeviceStatus = (device) => {
    if (!device.jobs || device.jobs.length === 0) return "IN_PROGRESS";

    const statuses = device.jobs.map((j) => j.status);
    if (statuses.every((s) => s === JOB_STATUS.COMPLETED))
      return JOB_STATUS.COMPLETED;
    if (statuses.includes(JOB_STATUS.CONSTRAINT)) return JOB_STATUS.CONSTRAINT;
    if (statuses.includes(JOB_STATUS.IN_PROGRESS))
      return JOB_STATUS.IN_PROGRESS;
    return "IN_PROGRESS";
  };

  return {
    devices,
    loading,
    error,
    expandedDeviceId,
    showAttrModal,
    attrModalData,
    handleShowAttributes,
    handleShowJobs,
    closeAttrModal,
    getDeviceStatus,
    refetch: fetchData,
  };
};
