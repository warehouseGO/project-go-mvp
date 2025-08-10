import React, { useMemo, useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

const statusColors = {
  WORKING: "bg-green-100 text-green-800 border-green-300",
  BREAKDOWN: "bg-red-100 text-red-800 border-red-300",
  FREE: "bg-blue-100 text-blue-800 border-blue-300",
  TOTAL: "bg-primary-100 text-primary-800 border-primary-300",
};

const statusLabels = {
  WORKING: "Working",
  BREAKDOWN: "Breakdown",
  FREE: "Free",
  TOTAL: "Total Resources",
};

const ResourceAnalytics = ({ resources, sites, goToResourcesWithFilters }) => {
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState("");

  // Filtered resources
  const filteredResources = useMemo(() => {
    let filtered = resources;
    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }
    if (typeFilter) {
      filtered = filtered.filter((r) => r.type === typeFilter);
    }
    if (siteFilter) {
      filtered = filtered.filter(
        (r) => String(r.siteId) === String(siteFilter)
      );
    }
    return filtered;
  }, [resources, statusFilter, typeFilter, siteFilter]);

  // Quick stats
  const totalResources = filteredResources.length;
  const workingResources = filteredResources.filter(
    (r) => r.status === "WORKING"
  ).length;
  const breakdownResources = filteredResources.filter(
    (r) => r.status === "BREAKDOWN"
  ).length;
  const freeResources = filteredResources.filter(
    (r) => r.status === "FREE"
  ).length;

  // Get unique resource types
  const resourceTypes = useMemo(() => {
    const types = [...new Set(resources.map((r) => r.type))];
    return types.filter(Boolean);
  }, [resources]);

  // Get unique sites
  const uniqueSites = useMemo(() => {
    const siteIds = [...new Set(resources.map((r) => r.siteId))];

    return sites.filter((s) => siteIds.includes(s.id));
  }, [resources, sites]);

  // Chart data
  const getChartData = () => {
    if (statusFilter) {
      // Show type distribution for selected status
      const typeCounts = resourceTypes.map(
        (type) => filteredResources.filter((r) => r.type === type).length
      );
      return {
        labels: resourceTypes,
        datasets: [
          {
            data: typeCounts,
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
    } else if (siteFilter) {
      // Show type distribution for selected site
      const typeCounts = resourceTypes.map(
        (type) => filteredResources.filter((r) => r.type === type).length
      );
      return {
        labels: resourceTypes,
        datasets: [
          {
            data: typeCounts,
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
    } else {
      // Show type distribution by default
      const typeCounts = resourceTypes.map(
        (type) => filteredResources.filter((r) => r.type === type).length
      );
      return {
        labels: resourceTypes,
        datasets: [
          {
            data: typeCounts,
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
    }
  };

  const chartData = getChartData();

  // Site analytics table
  const siteRows = uniqueSites.map((site) => {
    const siteResources = filteredResources.filter(
      (r) => String(r.siteId) === String(site.id)
    );
    const working = siteResources.filter((r) => r.status === "WORKING").length;
    const breakdown = siteResources.filter(
      (r) => r.status === "BREAKDOWN"
    ).length;
    const free = siteResources.filter((r) => r.status === "FREE").length;

    return {
      id: site.id,
      name: site.name,
      total: siteResources.length,
      working,
      breakdown,
      free,
    };
  });
  useEffect(() => {
    console.log(uniqueSites);
  }, [uniqueSites]);
  return (
    <div className="mb-8">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Resource Status
          </label>
          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="WORKING">Working</option>
            <option value="BREAKDOWN">Breakdown</option>
            <option value="FREE">Free</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Resource Type
          </label>
          <select
            className="input-field"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All</option>
            {resourceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Site
          </label>
          <select
            className="input-field"
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
          >
            <option value="">All Sites</option>
            {uniqueSites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div
          className={`card border ${statusColors.TOTAL}`}
          style={{ cursor: goToResourcesWithFilters ? "pointer" : undefined }}
          onClick={() => goToResourcesWithFilters({})}
        >
          <div className="text-3xl font-bold">{totalResources}</div>
          <div className="text-sm font-medium mt-1">Total Resources</div>
        </div>
        <div
          className={`card border ${statusColors.WORKING}`}
          style={{ cursor: goToResourcesWithFilters ? "pointer" : undefined }}
          onClick={() =>
            goToResourcesWithFilters({
              status: "WORKING",
              type: typeFilter,
              siteId: siteFilter,
            })
          }
        >
          <div className="text-3xl font-bold">{workingResources}</div>
          <div className="text-sm font-medium mt-1">Working</div>
        </div>
        <div
          className={`card border ${statusColors.BREAKDOWN}`}
          style={{ cursor: goToResourcesWithFilters ? "pointer" : undefined }}
          onClick={() =>
            goToResourcesWithFilters({
              status: "BREAKDOWN",
              type: typeFilter,
              siteId: siteFilter,
            })
          }
        >
          <div className="text-3xl font-bold">{breakdownResources}</div>
          <div className="text-sm font-medium mt-1">Breakdown</div>
        </div>
        <div
          className={`card border ${statusColors.FREE}`}
          style={{ cursor: goToResourcesWithFilters ? "pointer" : undefined }}
          onClick={() =>
            goToResourcesWithFilters({
              status: "FREE",
              type: typeFilter,
              siteId: siteFilter,
            })
          }
        >
          <div className="text-3xl font-bold">{freeResources}</div>
          <div className="text-sm font-medium mt-1">Free</div>
        </div>
      </div>

      {/* Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {statusFilter
              ? `${statusFilter} Type Distribution`
              : siteFilter
              ? `${
                  sites.find((s) => String(s.id) === String(siteFilter))
                    ?.name || "Site"
                } Type Distribution`
              : "Resource Type Distribution"}
          </h3>
          <div className="h-64">
            <Doughnut
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Site Performance Table */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Site Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                    Site
                  </th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">
                    Total
                  </th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">
                    Working
                  </th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">
                    Breakdown
                  </th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">
                    Free
                  </th>
                </tr>
              </thead>
              <tbody>
                {siteRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                    style={{
                      cursor: goToResourcesWithFilters ? "pointer" : undefined,
                    }}
                    onClick={() =>
                      goToResourcesWithFilters({
                        siteId: row.id,
                        status: statusFilter,
                        type: typeFilter,
                      })
                    }
                  >
                    <td className="py-2 px-3 text-sm text-gray-900">
                      {row.name}
                    </td>
                    <td className="py-2 px-3 text-sm text-center text-gray-900 font-medium">
                      {row.total}
                    </td>
                    <td className="py-2 px-3 text-sm text-center text-green-600 font-medium">
                      {row.working}
                    </td>
                    <td className="py-2 px-3 text-sm text-center text-red-600 font-medium">
                      {row.breakdown}
                    </td>
                    <td className="py-2 px-3 text-sm text-center text-blue-600 font-medium">
                      {row.free}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceAnalytics;
