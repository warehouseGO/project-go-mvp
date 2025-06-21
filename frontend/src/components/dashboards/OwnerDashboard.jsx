import React, { useState, useEffect } from "react";
import { dashboardAPI } from "../../utils/api";
import LoadingSpinner from "../common/LoadingSpinner";

const OwnerDashboard = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.ownerDashboard();
      setSites(response.data.createdSites);
    } catch (err) {
      setError("Failed to fetch dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <div className="text-red-600">{error}</div>;

  //   const totalDevices = sites.reduce(
  //     (sum, site) => sum + site.devices.length,
  //     0
  //   );

  const totalDevices = 0;
  //    const totalUsers = sites.reduce((sum, site) => sum + site.users.length, 0);

  const totalUsers = 0;
  //   const totalJobs = sites.reduce(
  //     (sum, site) =>
  //       sum +
  //       site.devices.reduce(
  //         (deviceSum, device) => deviceSum + device.jobs.length,
  //         0
  //       ),
  //     0
  //   );

  const totalJobs = 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Multi-Site Overview
        </h1>
        <p className="text-gray-600">
          Manage all warehouse sites and monitor overall performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total Sites
          </h3>
          <p className="text-3xl font-bold text-primary-600">{sites.length}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total Devices
          </h3>
          <p className="text-3xl font-bold text-primary-600">{totalDevices}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total Users
          </h3>
          <p className="text-3xl font-bold text-primary-600">{totalUsers}</p>
        </div>
      </div>

      {/* Sites Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <div key={site.id} className="card">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {site.name}
              </h3>
              <p className="text-sm text-gray-600">{site.location}</p>
              {site.description && (
                <p className="text-xs text-gray-500 mt-1">{site.description}</p>
              )}
            </div>

            {/* <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Devices:</span>
                <span className="font-medium">{site.devices.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Users:</span>
                <span className="font-medium">{site.users.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Jobs:</span>
                <span className="font-medium">
                  {site.devices.reduce(
                    (sum, device) => sum + device.jobs.length,
                    0
                  )}
                </span>
              </div>
            </div> */}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="btn-primary w-full text-sm">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {sites.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No sites created yet.</p>
          <button className="btn-primary mt-4">Create First Site</button>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
