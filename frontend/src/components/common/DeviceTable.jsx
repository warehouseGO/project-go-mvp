import React, { useState } from "react";
import StatusBadge from "./StatusBadge";
import { JOB_STATUS } from "../../utils/constants";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

const DeviceTable = ({
  devices,
  onShowAttributes,
  onShowJobs,
  expandedDeviceId,
  showAssignedTo = false,
  getAssignedUser = null,
  showActions = true,
  customJobTable = null,
  enableMultiSelect = false,
  assignableUsers = [],
  onBulkAssign = null,
  assignLabel = "Assign to User",
  assignLoading = false,
  onEditDevice = null,
  onDeleteDevice = null,
}) => {
  const [selectedDeviceIds, setSelectedDeviceIds] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignError, setAssignError] = useState("");

  const getDeviceStatus = (device) => {
    if (!device.jobs || device.jobs.length === 0) {
      return "IN_PROGRESS";
    }

    const statuses = device.jobs.map((j) => j.status);

    if (statuses.every((s) => s === JOB_STATUS.COMPLETED)) {
      return JOB_STATUS.COMPLETED;
    }

    if (statuses.includes(JOB_STATUS.CONSTRAINT)) {
      return JOB_STATUS.CONSTRAINT;
    }

    if (statuses.includes(JOB_STATUS.IN_PROGRESS)) {
      return JOB_STATUS.IN_PROGRESS;
    }
    return "IN_PROGRESS";
  };

  const renderDefaultJobTable = (device) => (
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
              Updated At
            </th>
          </tr>
        </thead>
        <tbody>
          {device.jobs.map((job) => (
            <tr key={job.id} className="bg-white border-b last:border-b-0">
              <td className="px-2 py-2 text-sm text-gray-900">{job.name}</td>
              <td className="px-2 py-2">
                <StatusBadge status={job.status} />
              </td>
              <td className="px-2 py-2 text-xs text-gray-700">
                {job.comment ? (
                  <span className="text-red-600">{job.comment}</span>
                ) : (
                  <span className="text-gray-400 italic">-</span>
                )}
              </td>
              <td className="px-2 py-2 text-xs text-gray-500">
                {new Date(job.updatedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const getTableHeaders = () => {
    const headers = [];
    if (enableMultiSelect) headers.push({ key: "select", label: "" });
    headers.push({ key: "serialNumber", label: "Serial No" });
    headers.push({ key: "name", label: "Name" });
    headers.push({ key: "type", label: "Type" });
    headers.push({ key: "subtype", label: "Subtype" });
    if (showAssignedTo) {
      headers.push({ key: "assignedTo", label: "Assigned To" });
    }
    headers.push({ key: "status", label: "Status" });
    headers.push({ key: "attributes", label: "Attributes" });
    headers.push({ key: "jobs", label: "Jobs" });
    return headers;
  };

  const getColSpan = () => {
    let span = 4; // serial, name, type, subtype
    if (showAssignedTo) span += 1;
    span += 3; // status, attributes, jobs
    if (enableMultiSelect) span += 1;
    return span;
  };

  const handleSelectDevice = (deviceId, checked) => {
    setSelectedDeviceIds((prev) =>
      checked ? [...prev, deviceId] : prev.filter((id) => id !== deviceId)
    );
  };
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedDeviceIds(devices.map((d) => d.id));
    } else {
      setSelectedDeviceIds([]);
    }
  };
  const openAssignModal = () => {
    setAssignUserId("");
    setAssignError("");
    setAssignModalOpen(true);
  };
  const handleBulkAssign = () => {
    if (!assignUserId) {
      setAssignError("Please select a user.");
      return;
    }
    if (onBulkAssign) {
      onBulkAssign(selectedDeviceIds, assignUserId);
    }
    setAssignModalOpen(false);
    setSelectedDeviceIds([]);
  };

  return (
    <div className="overflow-x-auto rounded-lg shadow border border-gray-200 bg-white">
      {enableMultiSelect && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
          <div className="text-sm text-gray-700">
            {selectedDeviceIds.length} selected
          </div>
          <button
            className="btn-primary"
            disabled={selectedDeviceIds.length === 0}
            onClick={openAssignModal}
          >
            {assignLabel}
          </button>
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {getTableHeaders().map((header) => (
              <th
                key={header.key}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {devices.map((device) => (
            <React.Fragment key={device.id}>
              <tr className="hover:bg-gray-50 transition">
                {enableMultiSelect && (
                  <td className="px-2 py-3">
                    <input
                      type="checkbox"
                      checked={selectedDeviceIds.includes(device.id)}
                      onChange={(e) =>
                        handleSelectDevice(device.id, e.target.checked)
                      }
                    />
                  </td>
                )}
                <td className="px-4 py-3 text-sm text-gray-900">
                  {device.serialNumber}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {device.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {device.type}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {device.subtype}
                </td>
                {showAssignedTo && (
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {getAssignedUser ? getAssignedUser(device) : "Unassigned"}
                  </td>
                )}
                <td className="px-4 py-3">
                  <StatusBadge status={getDeviceStatus(device)} />
                </td>
                <td className="px-4 py-3">
                  {showActions && onShowAttributes && (
                    <button
                      className="btn-secondary text-xs"
                      onClick={() => onShowAttributes(device.attributes)}
                    >
                      View
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  {showActions && onShowJobs && (
                    <button
                      className="btn-primary text-xs"
                      onClick={() => onShowJobs(device.id)}
                    >
                      {expandedDeviceId === device.id ? "Hide" : "Show"}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 flex gap-2 items-center">
                  {showActions && onEditDevice && (
                    <button
                      className="p-1 rounded hover:bg-blue-100"
                      title="Edit Device"
                      onClick={() => onEditDevice(device)}
                    >
                      <PencilSquareIcon className="h-5 w-5 text-blue-600" />
                    </button>
                  )}
                  {showActions && onDeleteDevice && (
                    <button
                      className="p-1 rounded hover:bg-red-100"
                      title="Delete Device"
                      onClick={() => onDeleteDevice(device)}
                    >
                      <TrashIcon className="h-5 w-5 text-red-600" />
                    </button>
                  )}
                </td>
              </tr>
              {expandedDeviceId === device.id && device.jobs && (
                <tr>
                  <td colSpan={getColSpan()} className="bg-gray-50 px-4 py-2">
                    {customJobTable
                      ? customJobTable(device)
                      : renderDefaultJobTable(device)}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">{assignLabel}</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select User
              </label>
              <select
                className="input-field w-full"
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
              >
                <option value="">Select...</option>
                {assignableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
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
                onClick={handleBulkAssign}
                disabled={assignLoading || !assignUserId}
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

export default DeviceTable;
