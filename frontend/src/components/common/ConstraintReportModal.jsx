import React, { useState, useEffect } from "react";
import { formatDate } from "../../utils/dateUtils";
import {
  DEVICE_PRIORITY_COLORS,
  DEVICE_PRIORITY_ICONS,
} from "../../utils/constants";
import {
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const ConstraintReportModal = ({
  isOpen,
  onClose,
  reportData,
  loading,
  error,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setPriorityFilter("");
    }
  }, [isOpen]);

  // Flatten all constraints into a single list
  const allConstraints =
    reportData?.devices?.flatMap((device) =>
      device.constraints.map((constraint) => ({
        ...constraint,
        deviceName: device.deviceName,
        deviceSerial: device.serialNumber,
        deviceType: device.type,
        devicePriority: device.priority,
        deviceTargetDate: device.targetDate,
      }))
    ) || [];

  const filteredConstraints = allConstraints.filter((constraint) => {
    const matchesSearch =
      constraint.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      constraint.deviceSerial
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      constraint.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      constraint.comment.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority =
      !priorityFilter || constraint.devicePriority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Constraint Report
            </h2>
            <p className="text-gray-600 mt-1">
              {reportData?.siteName ? `${reportData.siteName} - ` : ""}
              {reportData?.totalConstraints || 0} constraints across{" "}
              {reportData?.totalDevicesWithConstraints || 0} devices
            </p>
            {reportData?.generatedAt && (
              <p className="text-sm text-gray-500 mt-1">
                Generated: {new Date(reportData.generatedAt).toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">
              Loading constraint report...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error loading constraint report
                  </h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && reportData && (
          <div className="flex-1 overflow-hidden">
            {/* Filters */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search devices, jobs, or comments..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="">All Priorities</option>
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="EXTREME">Extreme Priority</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Report Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
              {filteredConstraints.length === 0 ? (
                <div className="p-12 text-center">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No constraints found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || priorityFilter
                      ? "Try adjusting your filters."
                      : "All devices are running smoothly!"}
                  </p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="space-y-4">
                    {filteredConstraints.map((constraint, index) => (
                      <div
                        key={`${constraint.deviceSerial}-${constraint.jobId}-${index}`}
                        className="border border-gray-200 rounded-lg p-4 bg-red-50"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          {/* Device Info */}
                          <div>
                            <span className="font-medium text-gray-700">
                              Device:
                            </span>
                            <div className="mt-1">
                              <div className="font-semibold text-gray-900">
                                {constraint.deviceName}
                              </div>
                              <div className="text-gray-600">
                                {constraint.deviceSerial} •{" "}
                                {constraint.deviceType}
                              </div>
                            </div>
                          </div>

                          {/* Job Info */}
                          <div>
                            <span className="font-medium text-gray-700">
                              Job:
                            </span>
                            <div className="mt-1">
                              <div className="font-semibold text-gray-900">
                                {constraint.jobName}
                              </div>
                              <div className="text-gray-600">
                                Status: Constraint
                              </div>
                            </div>
                          </div>

                          {/* Priority & Target Date */}
                          <div>
                            <span className="font-medium text-gray-700">
                              Priority:
                            </span>
                            <div className="mt-1">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  DEVICE_PRIORITY_COLORS[
                                    constraint.devicePriority
                                  ]
                                }`}
                              >
                                {
                                  DEVICE_PRIORITY_ICONS[
                                    constraint.devicePriority
                                  ]
                                }{" "}
                                {constraint.devicePriority}
                              </span>
                              {constraint.deviceTargetDate && (
                                <div className="text-gray-600 mt-1">
                                  Target:{" "}
                                  {formatDate(constraint.deviceTargetDate)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Update Info */}
                          <div>
                            <span className="font-medium text-gray-700">
                              Updated:
                            </span>
                            <div className="mt-1">
                              <div className="text-gray-600">
                                {new Date(
                                  constraint.updatedAt
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-gray-600">
                                {new Date(
                                  constraint.updatedAt
                                ).toLocaleTimeString()}
                              </div>
                              {constraint.updatedBy && (
                                <div className="text-gray-600">
                                  by {constraint.updatedBy.name}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Comment */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <span className="font-medium text-gray-700">
                            Comment:
                          </span>
                          <div className="mt-1 p-3 bg-white rounded border text-gray-800">
                            {constraint.comment}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConstraintReportModal;
