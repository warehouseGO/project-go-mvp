import React from "react";
import { DEVICE_PRIORITY } from "../../utils/constants";

const DeviceFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  deviceTypes = [],
  siteSupervisors = [],
  clusterSupervisors = [],
}) => {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Site Supervisor
          </label>
          <select
            className="input-field"
            value={filters.siteSupervisor}
            onChange={(e) => onFilterChange("siteSupervisor", e.target.value)}
          >
            <option value="">All</option>
            {siteSupervisors.map((ss) => (
              <option key={ss.id} value={ss.id}>
                {ss.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cluster Supervisor
          </label>
          <select
            className="input-field"
            value={filters.clusterSupervisor}
            onChange={(e) =>
              onFilterChange("clusterSupervisor", e.target.value)
            }
          >
            <option value="">All</option>
            {clusterSupervisors.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {cs.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Device Status
          </label>
          <select
            className="input-field"
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CONSTRAINT">Constraint</option>
            <option value="DELAYED">Delayed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Device Type
          </label>
          <select
            className="input-field"
            value={filters.type}
            onChange={(e) => onFilterChange("type", e.target.value)}
          >
            <option value="">All</option>
            {deviceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            className="input-field"
            value={filters.priority}
            onChange={(e) => onFilterChange("priority", e.target.value)}
          >
            <option value="">All</option>
            <option value={DEVICE_PRIORITY.LOW}>Low</option>
            <option value={DEVICE_PRIORITY.MEDIUM}>Medium</option>
            <option value={DEVICE_PRIORITY.HIGH}>High</option>
            <option value={DEVICE_PRIORITY.EXTREME}>Extreme</option>
          </select>
        </div>

        <div className="flex items-end">
          <button className="btn-secondary w-full" onClick={onClearFilters}>
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceFilters;
