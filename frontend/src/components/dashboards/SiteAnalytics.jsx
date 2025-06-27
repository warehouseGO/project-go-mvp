import React, { useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { DEVICE_TYPES } from "../../utils/constants";

ChartJS.register(ArcElement, Tooltip, Legend);

const statusColors = {
  COMPLETED: "bg-green-100 text-green-800 border-green-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-300",
  CONSTRAINT: "bg-red-100 text-red-800 border-red-300",
  TOTAL: "bg-primary-100 text-primary-800 border-primary-300",
};

const statusLabels = {
  COMPLETED: "Completed",
  IN_PROGRESS: "In Progress",
  CONSTRAINT: "Constraint",
  TOTAL: "Total Devices",
};

const SiteAnalytics = ({ siteData }) => {
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Filtered devices
  const filteredDevices = useMemo(() => {
    let devices = siteData.devices;
    if (statusFilter) {
      devices = devices.filter((d) => {
        const statuses = d.jobs.map((j) => j.status);
        if (statusFilter === "COMPLETED") {
          return (
            statuses.length > 0 && statuses.every((s) => s === "COMPLETED")
          );
        }
        if (statusFilter === "CONSTRAINT") {
          return statuses.includes("CONSTRAINT");
        }
        if (statusFilter === "IN_PROGRESS") {
          return statuses.includes("IN_PROGRESS");
        }
        return true;
      });
    }
    if (typeFilter) {
      devices = devices.filter((d) => d.type === typeFilter);
    }
    return devices;
  }, [siteData.devices, statusFilter, typeFilter]);

  // Quick stats (use filteredDevices for all)
  const totalDevices = filteredDevices.length;
  const completedDevices = filteredDevices.filter((d) => {
    const statuses = d.jobs.map((j) => j.status);
    return statuses.length > 0 && statuses.every((s) => s === "COMPLETED");
  }).length;
  const constraintDevices = filteredDevices.filter((d) => {
    const statuses = d.jobs.map((j) => j.status);
    return statuses.includes("CONSTRAINT");
  }).length;
  const inProgressDevices = filteredDevices.filter((d) => {
    const statuses = d.jobs.map((j) => j.status);
    return (
      statuses.includes("IN_PROGRESS") &&
      !statuses.includes("CONSTRAINT") &&
      !statuses.every((s) => s === "COMPLETED")
    );
  }).length;

  // Device type distribution (filtered)
  const deviceTypeCounts = DEVICE_TYPES.map(
    (type) => filteredDevices.filter((d) => d.type === type).length
  );
  const deviceTypeData = {
    labels: DEVICE_TYPES,
    datasets: [
      {
        data: deviceTypeCounts,
        backgroundColor: [
          "#3B82F6",
          "#10B981",
          "#F59E42",
          "#6366F1",
          "#F43F5E",
          "#FBBF24",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Supervisor analytics table (use filteredDevices for all calculations)
  const supervisors = siteData.users.filter(
    (u) => u.role === "SITE_SUPERVISOR" || u.role === "CLUSTER_SUPERVISOR"
  );
  const supervisorRows = supervisors.map((sup) => {
    const assignedDevices = filteredDevices.filter((d) =>
      sup.role === "SITE_SUPERVISOR"
        ? d.siteSupervisorId === sup.id
        : d.assignedTo === sup.id
    );
    const completed = assignedDevices.filter((d) => {
      const statuses = d.jobs.map((j) => j.status);
      return statuses.length > 0 && statuses.every((s) => s === "COMPLETED");
    }).length;
    const constraint = assignedDevices.filter((d) => {
      const statuses = d.jobs.map((j) => j.status);
      return statuses.includes("CONSTRAINT");
    }).length;
    return {
      id: sup.id,
      name: sup.name,
      role: sup.role.replace("_", " ").replace("SUPERVISOR", "Supervisor"),
      total: assignedDevices.length,
      completed,
      constraint,
    };
  });

  return (
    <div className="mb-8">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Device Status
          </label>
          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="COMPLETED">Completed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="CONSTRAINT">Constraint</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Device Type
          </label>
          <select
            className="input-field"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All</option>
            {DEVICE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className={`card border ${statusColors.TOTAL}`}>
          <div className="text-3xl font-bold">{totalDevices}</div>
          <div className="text-sm font-medium mt-1">Total Devices</div>
        </div>
        <div className={`card border ${statusColors.COMPLETED}`}>
          <div className="text-3xl font-bold">{completedDevices}</div>
          <div className="text-sm font-medium mt-1">Completed</div>
        </div>
        <div className={`card border ${statusColors.IN_PROGRESS}`}>
          <div className="text-3xl font-bold">{inProgressDevices}</div>
          <div className="text-sm font-medium mt-1">In Progress</div>
        </div>
        <div className={`card border ${statusColors.CONSTRAINT}`}>
          <div className="text-3xl font-bold">{constraintDevices}</div>
          <div className="text-sm font-medium mt-1">Constraint</div>
        </div>
      </div>
      {/* Device Type Pie Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold mb-4">
            Device Type Distribution
          </h3>
          <Doughnut data={deviceTypeData} />
        </div>
        {/* Supervisor Analytics Table */}
        <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">Supervisor Analytics</h3>
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                <th className="px-4 py-2 text-left border-b">Name</th>
                <th className="px-4 py-2 text-left border-b">Role</th>
                <th className="px-4 py-2 text-center border-b"># Devices</th>
                <th className="px-4 py-2 text-center border-b">Completed</th>
                <th className="px-4 py-2 text-center border-b">Constraint</th>
              </tr>
            </thead>
            <tbody>
              {supervisorRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-6">
                    No supervisors found.
                  </td>
                </tr>
              ) : (
                supervisorRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={
                      idx % 2 === 0
                        ? "bg-gray-50 hover:bg-primary-50 transition"
                        : "bg-white hover:bg-primary-50 transition"
                    }
                  >
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {row.name}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{row.role}</td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-block px-2 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-semibold">
                        {row.total}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-block px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                        {row.completed}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-block px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold">
                        {row.constraint}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SiteAnalytics;
