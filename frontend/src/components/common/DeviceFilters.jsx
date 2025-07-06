import React from "react";

const DeviceFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  deviceTypes = [],
  deviceSubtypes = [],
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
            <option value="COMPLETED">Completed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="CONSTRAINT">Constraint</option>
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
            Device Subtype
          </label>
          <select
            className="input-field"
            value={filters.subtype}
            onChange={(e) => onFilterChange("subtype", e.target.value)}
          >
            <option value="">All</option>
            {deviceSubtypes.map((subtype) => (
              <option key={subtype} value={subtype}>
                {subtype}
              </option>
            ))}
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
