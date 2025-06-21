import React, { useState } from "react";
import StatusBadge from "./StatusBadge";
import { JOB_STATUS } from "../../utils/constants";

const DeviceTable = ({
  devices,
  onShowAttributes,
  onShowJobs,
  expandedDeviceId,
  showAssignedTo = false,
  getAssignedUser = null,
  showActions = true,
  customJobTable = null,
}) => {
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
    const headers = [
      { key: "serialNumber", label: "Serial No" },
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
      { key: "subtype", label: "Subtype" },
    ];

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
    return span;
  };

  return (
    <div className="overflow-x-auto rounded-lg shadow border border-gray-200 bg-white">
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
    </div>
  );
};

export default DeviceTable;
