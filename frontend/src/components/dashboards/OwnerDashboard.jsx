import React, { useState, useEffect } from "react";
import { dashboardAPI } from "../../utils/api";
import LoadingSpinner from "../common/LoadingSpinner";

const OwnerDashboard = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [form, setForm] = useState({
    name: "",
    location: "",
    description: "",
    siteInCharge: "",
    siteSupervisors: "",
    clusterSupervisors: "",
  });

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

  const handleModalChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError("");
    setModalSuccess("");
    try {
      await dashboardAPI.fullAssignSite({
        site: {
          name: form.name,
          location: form.location,
          description: form.description,
        },
        siteInCharge: form.siteInCharge.trim(),
        siteSupervisors: form.siteSupervisors
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        clusterSupervisors: form.clusterSupervisors
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setModalSuccess("Site and users assigned successfully!");
      setForm({
        name: "",
        location: "",
        description: "",
        siteInCharge: "",
        siteSupervisors: "",
        clusterSupervisors: "",
      });
    } catch (err) {
      setModalError("Failed to create site and assign users.");
    } finally {
      setModalLoading(false);
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
    <div className="space-y-6 relative">
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

      {/* Floating + button */}
      <button
        className="fixed bottom-8 right-8 z-50 bg-primary-600 hover:bg-primary-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg text-3xl focus:outline-none"
        onClick={() => setShowModal(true)}
        title="Create New Site"
      >
        +
      </button>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">
              Create New Site & Assign Users
            </h2>
            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Name *
                </label>
                <input
                  type="text"
                  name="name"
                  className="input-field"
                  value={form.name}
                  onChange={handleModalChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  className="input-field"
                  value={form.location}
                  onChange={handleModalChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  className="input-field"
                  value={form.description}
                  onChange={handleModalChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site In-Charge Email *
                </label>
                <input
                  type="email"
                  name="siteInCharge"
                  className="input-field"
                  value={form.siteInCharge}
                  onChange={handleModalChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Supervisor Emails (comma separated)
                </label>
                <input
                  type="text"
                  name="siteSupervisors"
                  className="input-field"
                  value={form.siteSupervisors}
                  onChange={handleModalChange}
                  placeholder="ss1@gmail.com, ss2@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cluster Supervisor Emails (comma separated)
                </label>
                <input
                  type="text"
                  name="clusterSupervisors"
                  className="input-field"
                  value={form.clusterSupervisors}
                  onChange={handleModalChange}
                  placeholder="cs1@gmail.com, cs2@gmail.com"
                />
              </div>
              {modalError && (
                <div className="text-xs text-red-600">{modalError}</div>
              )}
              {modalSuccess && (
                <div className="text-xs text-green-600">{modalSuccess}</div>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={modalLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={modalLoading}
                >
                  {modalLoading ? "Creating..." : "Create Site"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
