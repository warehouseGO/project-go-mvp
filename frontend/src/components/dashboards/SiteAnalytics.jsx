import React, { useMemo, useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useNavigate } from "react-router-dom";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const statusColors = {
  COMPLETED: "bg-green-100 text-green-800 border-green-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-300",
  CONSTRAINT: "bg-red-100 text-red-800 border-red-300",
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  TOTAL: "bg-primary-100 text-primary-800 border-primary-300",
};

const statusLabels = {
  COMPLETED: "Completed",
  IN_PROGRESS: "In Progress",
  CONSTRAINT: "Constraint",
  PENDING: "Pending",
  TOTAL: "Total Devices",
};

const chartColors = {
  COMPLETED: "#10B981",
  IN_PROGRESS: "#3B82F6",
  CONSTRAINT: "#EF4444",
  PENDING: "#F59E0B",
};

const SiteAnalytics = ({
  siteData,
  goToDevicesWithFilters,
  deviceTypes,
  statusCounts = [],
}) => {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState("");

  // Filtered devices (only by type, no status filter)
  const filteredDevices = useMemo(() => {
    let devices = siteData.devices;
    if (typeFilter) {
      devices = devices.filter((d) => d.type === typeFilter);
    }
    return devices;
  }, [siteData.devices, typeFilter]);

  // Calculate device type status breakdown from devices data
  const deviceTypeStatusBreakdown = useMemo(() => {
    const breakdown = {};
    siteData.devices.forEach((device) => {
      if (!breakdown[device.type]) {
        breakdown[device.type] = {
          COMPLETED: 0,
          IN_PROGRESS: 0,
          CONSTRAINT: 0,
          PENDING: 0,
        };
      }
      breakdown[device.type][device.status] =
        (breakdown[device.type][device.status] || 0) + 1;
    });
    return breakdown;
  }, [siteData.devices]);

  // Calculate job status breakdown for selected device type
  const jobStatusBreakdown = useMemo(() => {
    if (!typeFilter) return {};

    const breakdown = {};
    const filteredDevicesForType = siteData.devices.filter(
      (d) => d.type === typeFilter
    );

    filteredDevicesForType.forEach((device) => {
      device.jobs?.forEach((job) => {
        if (!breakdown[job.name]) {
          breakdown[job.name] = {
            COMPLETED: 0,
            IN_PROGRESS: 0,
            CONSTRAINT: 0,
            PENDING: 0,
          };
        }
        breakdown[job.name][job.status] =
          (breakdown[job.name][job.status] || 0) + 1;
      });
    });

    return breakdown;
  }, [siteData.devices, typeFilter]);

  // Quick stats (use filteredDevices for all)
  const totalDevices = filteredDevices.length;
  const completedDevices = filteredDevices.filter(
    (d) => d.status === "COMPLETED"
  ).length;
  const constraintDevices = filteredDevices.filter(
    (d) => d.status === "CONSTRAINT"
  ).length;
  const inProgressDevices = filteredDevices.filter(
    (d) => d.status === "IN_PROGRESS"
  ).length;
  const pendingDevices = filteredDevices.filter(
    (d) => d.status === "PENDING"
  ).length;

  // Device type status breakdown for bar chart
  const getDeviceTypeChartData = () => {
    const chartData = {
      labels: deviceTypes,
      datasets: [
        {
          label: "Completed",
          data: deviceTypes.map(
            (type) => deviceTypeStatusBreakdown[type]?.COMPLETED || 0
          ),
          backgroundColor: chartColors.COMPLETED,
        },
        {
          label: "In Progress",
          data: deviceTypes.map(
            (type) => deviceTypeStatusBreakdown[type]?.IN_PROGRESS || 0
          ),
          backgroundColor: chartColors.IN_PROGRESS,
        },
        {
          label: "Constraint",
          data: deviceTypes.map(
            (type) => deviceTypeStatusBreakdown[type]?.CONSTRAINT || 0
          ),
          backgroundColor: chartColors.CONSTRAINT,
        },
        {
          label: "Pending",
          data: deviceTypes.map(
            (type) => deviceTypeStatusBreakdown[type]?.PENDING || 0
          ),
          backgroundColor: chartColors.PENDING,
        },
      ],
    };
    return chartData;
  };

  const deviceTypeChartData = getDeviceTypeChartData();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Device Type Status Distribution",
      },
      tooltip: {
        callbacks: {
          afterLabel: function (context) {
            const statusMap = {
              0: "Completed",
              1: "In Progress",
              2: "Constraint",
              3: "Pending",
            };
            const status = statusMap[context.datasetIndex];
            return `Click to view ${status.toLowerCase()} devices`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
    onHover: (event, elements) => {
      event.native.target.style.cursor =
        elements.length > 0 ? "pointer" : "default";
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const clickedElement = elements[0];
        const clickedIndex = clickedElement.index;
        const datasetIndex = clickedElement.datasetIndex;
        const selectedType = deviceTypes[clickedIndex];

        // Get the status from the dataset index
        const statusMap = {
          0: "COMPLETED",
          1: "IN_PROGRESS",
          2: "CONSTRAINT",
          3: "PENDING",
        };
        const selectedStatus = statusMap[datasetIndex];

        // Navigate to devices table with both device type and status filters
        goToDevicesWithFilters({
          type: selectedType,
          status: selectedStatus,
        });
      }
    },
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div
          className={`card border ${statusColors.TOTAL}`}
          style={{ cursor: goToDevicesWithFilters ? "pointer" : undefined }}
          onClick={() =>
            goToDevicesWithFilters({
              type: typeFilter,
            })
          }
        >
          <div className="text-3xl font-bold">{totalDevices}</div>
          <div className="text-sm font-medium mt-1">Total Devices</div>
        </div>
        <div
          className={`card border ${statusColors.COMPLETED}`}
          style={{ cursor: goToDevicesWithFilters ? "pointer" : undefined }}
          onClick={() =>
            goToDevicesWithFilters({
              status: "COMPLETED",
              type: typeFilter,
            })
          }
        >
          <div className="text-3xl font-bold">{completedDevices}</div>
          <div className="text-sm font-medium mt-1">Completed</div>
        </div>
        <div
          className={`card border ${statusColors.IN_PROGRESS}`}
          style={{ cursor: goToDevicesWithFilters ? "pointer" : undefined }}
          onClick={() =>
            goToDevicesWithFilters({
              status: "IN_PROGRESS",
              type: typeFilter,
            })
          }
        >
          <div className="text-3xl font-bold">{inProgressDevices}</div>
          <div className="text-sm font-medium mt-1">In Progress</div>
        </div>
        <div
          className={`card border ${statusColors.CONSTRAINT}`}
          style={{ cursor: goToDevicesWithFilters ? "pointer" : undefined }}
          onClick={() =>
            goToDevicesWithFilters({
              status: "CONSTRAINT",
              type: typeFilter,
            })
          }
        >
          <div className="text-3xl font-bold">{constraintDevices}</div>
          <div className="text-sm font-medium mt-1">Constraint</div>
        </div>
        <div
          className={`card border ${statusColors.PENDING}`}
          style={{ cursor: goToDevicesWithFilters ? "pointer" : undefined }}
          onClick={() =>
            goToDevicesWithFilters({
              status: "PENDING",
              type: typeFilter,
            })
          }
        >
          <div className="text-3xl font-bold">{pendingDevices}</div>
          <div className="text-sm font-medium mt-1">Pending</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Device Type Filter
          </label>
          <select
            className="input-field"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {deviceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        {typeFilter && (
          <button
            onClick={() => setTypeFilter("")}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Device Type Status Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            Device Type Status Distribution
            <span className="text-sm text-gray-500 font-normal ml-2">
              (Click on status bars to view filtered devices)
            </span>
          </h3>
          <div className="h-96 cursor-pointer">
            <Bar data={deviceTypeChartData} options={chartOptions} />
          </div>
        </div>

        {/* Job Status Breakdown Table (only when device type is selected) */}
        {typeFilter && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">
              Job Status Breakdown for {typeFilter}
            </h3>
            {Object.keys(jobStatusBreakdown).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        In Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Constraint
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pending
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(jobStatusBreakdown)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([jobName, statusCounts]) => {
                        const total = Object.values(statusCounts).reduce(
                          (sum, count) => sum + count,
                          0
                        );
                        return (
                          <tr key={jobName} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {jobName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {total}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {statusCounts.COMPLETED > 0 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {statusCounts.COMPLETED}
                                </span>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {statusCounts.IN_PROGRESS > 0 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {statusCounts.IN_PROGRESS}
                                </span>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {statusCounts.CONSTRAINT > 0 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  {statusCounts.CONSTRAINT}
                                </span>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {statusCounts.PENDING > 0 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  {statusCounts.PENDING}
                                </span>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No jobs found for {typeFilter} devices.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteAnalytics;
