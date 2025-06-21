import React, { useState, useEffect } from "react";
import { devicesAPI, jobsAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";
import DeviceTable from "../common/DeviceTable";
import AttributesModal from "../common/AttributesModal";
import { JOB_STATUS } from "../../utils/constants";

const ClusterSupervisorDashboard = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedDeviceId, setExpandedDeviceId] = useState(null);
  const [showAttrModal, setShowAttrModal] = useState(false);
  const [attrModalData, setAttrModalData] = useState(null);
  const [showConstraintModal, setShowConstraintModal] = useState(false);
  const [constraintJob, setConstraintJob] = useState(null);
  const [constraintComment, setConstraintComment] = useState("");
  const { user } = useAuth();
  const [statusLoading, setStatusLoading] = useState({});
  const [jobEdits, setJobEdits] = useState({});

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await devicesAPI.getDevices({
        role: "CLUSTER_SUPERVISOR",
        userId: user.id,
      });
      setDevices(response.data);
      setJobEdits({});
    } catch (err) {
      setError("Failed to fetch devices");
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

  const handleStatusEdit = (job, newStatus) => {
    setJobEdits((prev) => ({
      ...prev,
      [job.id]: {
        status: newStatus,
        comment:
          newStatus === JOB_STATUS.CONSTRAINT
            ? jobEdits[job.id]?.comment || job.comment || ""
            : "",
      },
    }));
  };

  const handleConstraintClick = (job) => {
    setConstraintJob(job);
    setConstraintComment(jobEdits[job.id]?.comment || job.comment || "");
    setShowConstraintModal(true);
  };

  const handleConstraintSubmit = () => {
    if (!constraintJob) return;
    setJobEdits((prev) => ({
      ...prev,
      [constraintJob.id]: {
        status: JOB_STATUS.CONSTRAINT,
        comment: constraintComment,
      },
    }));
    setShowConstraintModal(false);
    setConstraintJob(null);
    setConstraintComment("");
  };

  const handleUpdateJob = async (job) => {
    const edit = jobEdits[job.id];
    if (!edit || edit.status === job.status) return;
    setStatusLoading((prev) => ({ ...prev, [job.id]: true }));
    try {
      await jobsAPI.updateJobStatus(job.id, {
        status: edit.status,
        comment:
          edit.status === JOB_STATUS.CONSTRAINT ? edit.comment : undefined,
      });
      await fetchDevices();
    } catch (err) {
      setError("Failed to update job status");
    } finally {
      setStatusLoading((prev) => ({ ...prev, [job.id]: false }));
    }
  };

  const renderJobTable = (device) => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Job Name
            </th>
            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Comment
            </th>
            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {device.jobs.map((job) => {
            const edit = jobEdits[job.id] || {
              status: job.status,
              comment: job.comment,
            };
            return (
              <tr key={job.id} className="bg-white border-b last:border-b-0">
                <td className="px-2 py-2 text-sm text-gray-900">{job.name}</td>
                <td className="px-2 py-2 flex items-center gap-2">
                  <select
                    className="input-field text-xs py-1 px-2"
                    value={edit.status}
                    disabled={statusLoading[job.id]}
                    onChange={(e) => handleStatusEdit(job, e.target.value)}
                  >
                    {Object.values(JOB_STATUS).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2 text-xs text-gray-700">
                  {edit.status === JOB_STATUS.CONSTRAINT &&
                  (edit.comment || job.comment) ? (
                    <span className="text-red-600">
                      {edit.comment || job.comment}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">-</span>
                  )}
                </td>
                <td className="px-2 py-2 flex gap-2">
                  <button
                    className="btn-secondary text-xs"
                    disabled={edit.status !== JOB_STATUS.CONSTRAINT}
                    onClick={() => handleConstraintClick(job)}
                  >
                    {edit.status === JOB_STATUS.CONSTRAINT
                      ? "Add/Edit Comment"
                      : "Add Comment"}
                  </button>
                  <button
                    className="btn-primary text-xs justify-center"
                    disabled={
                      statusLoading[job.id] || edit.status === job.status
                    }
                    onClick={() => handleUpdateJob(job)}
                  >
                    {statusLoading[job.id] ? "Updating..." : "Update"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          My Assigned Devices
        </h1>
        <p className="text-gray-600">
          Manage your assigned devices and update job statuses
        </p>
      </div>

      <DeviceTable
        devices={devices}
        onShowAttributes={handleShowAttributes}
        onShowJobs={handleShowJobs}
        expandedDeviceId={expandedDeviceId}
        showAssignedTo={false}
        showActions={true}
        customJobTable={renderJobTable}
      />

      {/* Constraint Comment Modal */}
      {showConstraintModal && constraintJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw]">
            <h2 className="text-lg font-semibold mb-4">
              Add/Edit Constraint Comment
            </h2>
            <textarea
              className="input-field w-full min-h-[80px]"
              value={constraintComment}
              onChange={(e) => setConstraintComment(e.target.value)}
              placeholder="Enter your comment here..."
            />
            <div className="mt-6 flex justify-end space-x-2">
              <button
                className="btn-secondary"
                onClick={() => setShowConstraintModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleConstraintSubmit}
                disabled={!constraintComment.trim()}
              >
                Save
              </button>
            </div>
          </div>
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

export default ClusterSupervisorDashboard;
