import React, { useState, useEffect } from "react";
import { dashboardAPI } from "../../utils/api";
import LoadingSpinner from "../common/LoadingSpinner";
import DeviceTable from "../common/DeviceTable";
import DeviceFilters from "../common/DeviceFilters";
import { useNavigate } from "react-router-dom";

const OwnerDashboard = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSiteId, setDeleteSiteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSiteId, setEditSiteId] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    location: "",
    description: "",
    siteInCharge: "",
    siteSupervisors: "",
    clusterSupervisors: "",
  });
  const [form, setForm] = useState({
    name: "",
    location: "",
    description: "",
    siteInCharge: "",
    siteSupervisors: "",
    clusterSupervisors: "",
  });

  const navigate = useNavigate();

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

  const handleDeleteSite = async () => {
    setDeleteLoading(true);
    try {
      await dashboardAPI.deleteSite(deleteSiteId);
      setDeleteModalOpen(false);
      setDeleteSiteId(null);
      fetchDashboardData(); // Refresh data
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditSite = async () => {
    setEditLoading(true);
    try {
      const data = {
        name: editForm.name,
        location: editForm.location,
        description: editForm.description,
        siteInCharge: editForm.siteInCharge,
        siteSupervisors: editForm.siteSupervisors
          .split(",")
          .map((email) => email.trim())
          .filter((email) => email),
        clusterSupervisors: editForm.clusterSupervisors
          .split(",")
          .map((email) => email.trim())
          .filter((email) => email),
      };
      await dashboardAPI.updateSite(editSiteId, data);
      setEditModalOpen(false);
      setEditSiteId(null);
      fetchDashboardData(); // Refresh data
    } catch (err) {
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  const openDeleteModal = (siteId) => {
    setDeleteSiteId(siteId);
    setDeleteModalOpen(true);
  };

  const openEditModal = async (siteId) => {
    setEditSiteId(siteId);
    try {
      const siteDetails = await dashboardAPI.getSiteDetails(siteId);
      console.log("Site details response:", siteDetails); // Debug log

      // Safely handle users array - provide default empty array if undefined
      const users = siteDetails.users || [];
      console.log("Users array:", users); // Debug log

      const siteInCharge = users.find((user) => user.role === "SITE_INCHARGE");
      const siteSupervisors = users.filter(
        (user) => user.role === "SITE_SUPERVISOR"
      );
      const clusterSupervisors = users.filter(
        (user) => user.role === "CLUSTER_SUPERVISOR"
      );

      setEditForm({
        name: siteDetails.name || "",
        location: siteDetails.location || "",
        description: siteDetails.description || "",
        siteInCharge: siteInCharge ? siteInCharge.email : "",
        siteSupervisors: siteSupervisors.map((user) => user.email).join(", "),
        clusterSupervisors: clusterSupervisors
          .map((user) => user.email)
          .join(", "),
      });
      setEditModalOpen(true);
    } catch (err) {
      console.error("Error fetching site details:", err);
      // Set default form values if API call fails
      setEditForm({
        name: "",
        location: "",
        description: "",
        siteInCharge: "",
        siteSupervisors: "",
        clusterSupervisors: "",
      });
      setEditModalOpen(true);
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

      {/* Sites Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <div key={site.id} className="card relative">
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

            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
              <button
                className="btn-primary text-sm"
                onClick={() => navigate(`/sites/${site.id}`)}
              >
                View Details
              </button>
              <div className="flex gap-2">
                <button
                  className="btn-secondary text-sm"
                  onClick={() => openEditModal(site.id)}
                >
                  Edit
                </button>
                <button
                  className="btn-danger text-sm"
                  onClick={() => openDeleteModal(site.id)}
                >
                  Delete
                </button>
              </div>
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

      {/* Edit Site Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Edit Site</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter site name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm({ ...editForm, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter description"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site In-Charge Email *
                </label>
                <input
                  type="email"
                  value={editForm.siteInCharge}
                  onChange={(e) =>
                    setEditForm({ ...editForm, siteInCharge: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter site in-charge email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Supervisors (comma-separated emails)
                </label>
                <input
                  type="text"
                  value={editForm.siteSupervisors}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      siteSupervisors: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cluster Supervisors (comma-separated emails)
                </label>
                <input
                  type="text"
                  value={editForm.clusterSupervisors}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      clusterSupervisors: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="btn-secondary"
                onClick={() => setEditModalOpen(false)}
                disabled={editLoading}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleEditSite}
                disabled={
                  editLoading || !editForm.name || !editForm.siteInCharge
                }
              >
                {editLoading ? "Updating..." : "Update Site"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Delete Site</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this site? This action cannot be
              undone. All devices and jobs will be deleted, and users will be
              unassigned.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="btn-secondary"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteSite}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
