import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ROLES, USER_STATUS_COLORS } from "../utils/constants";
import api from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { usersAPI, dashboardAPI } from "../utils/api";

const Users = () => {
  const { user, hasRole } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState({});
  const [siteUsers, setSiteUsers] = useState([]);
  const [selectedSiteSupervisor, setSelectedSiteSupervisor] = useState("");
  const [selectedClusterSupervisors, setSelectedClusterSupervisors] = useState(
    []
  );
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState("");
  const [assignError, setAssignError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchPendingUsers();
    if (user.role === ROLES.SITE_INCHARGE && user.siteId) {
      fetchSiteUsers();
    }
    // eslint-disable-next-line
  }, [user]);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/pending", {
        params: { superiorId: user.id },
      });
      setPendingUsers(res.data);
    } catch (err) {
      setPendingUsers([]);
    }
    setLoading(false);
  };

  const fetchSiteUsers = async () => {
    try {
      const res = await dashboardAPI.siteInChargeDashboard(user.siteId);
      setSiteUsers(res.data.users || []);
    } catch (err) {
      setSiteUsers([]);
    }
  };

  const siteSupervisors = siteUsers.filter(
    (u) => u.role === ROLES.SITE_SUPERVISOR
  );
  const clusterSupervisors = siteUsers.filter(
    (u) => u.role === ROLES.CLUSTER_SUPERVISOR
  );

  const handleApprove = async (userId) => {
    setApproving((prev) => ({ ...prev, [userId]: true }));
    try {
      await api.put(`/users/${userId}/approve`);
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      // Optionally show error
    }
    setApproving((prev) => ({ ...prev, [userId]: false }));
  };

  const handleClusterSupervisorCheck = (id) => {
    setSelectedClusterSupervisors((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    setAssignLoading(true);
    setAssignError("");
    setAssignSuccess("");
    try {
      await usersAPI.assignClusterSupervisorsToSiteSupervisor(
        selectedSiteSupervisor,
        selectedClusterSupervisors
      );
      setAssignSuccess("Cluster supervisors assigned successfully!");
      setSelectedClusterSupervisors([]);
      fetchSiteUsers();
    } catch (err) {
      setAssignError("Failed to assign cluster supervisors.");
    }
    setAssignLoading(false);
  };

  // Helper for showing selected names/count
  const getSelectedClusterSupervisorsLabel = () => {
    if (selectedClusterSupervisors.length === 0)
      return "Select Cluster Supervisors";
    if (selectedClusterSupervisors.length === 1) {
      const cs = clusterSupervisors.find(
        (cs) => cs.id.toString() === selectedClusterSupervisors[0]
      );
      return cs ? cs.name : "1 selected";
    }
    if (selectedClusterSupervisors.length <= 3) {
      return clusterSupervisors
        .filter((cs) => selectedClusterSupervisors.includes(cs.id.toString()))
        .map((cs) => cs.name)
        .join(", ");
    }
    return `${selectedClusterSupervisors.length} selected`;
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest(".dropdown-multicheck")) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClick);
    } else {
      document.removeEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  if (
    !user ||
    !(
      hasRole(ROLES.OWNER) ||
      hasRole(ROLES.SITE_INCHARGE) ||
      hasRole(ROLES.SITE_SUPERVISOR)
    )
  ) {
    return <div className="p-8">Access Denied</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Pending Users</h2>
      {loading ? (
        <LoadingSpinner size="lg" />
      ) : pendingUsers.length === 0 ? (
        <div className="text-gray-500">No pending users to approve.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.role}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        USER_STATUS_COLORS[u.status]
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      className="btn-primary text-xs"
                      disabled={approving[u.id]}
                      onClick={() => handleApprove(u.id)}
                    >
                      {approving[u.id] ? "Approving..." : "Approve"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Cluster Supervisors to Site Supervisor (Site In-Charge only) */}
      {hasRole(ROLES.SITE_INCHARGE) && (
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Assign Cluster Supervisors to Site Supervisor
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Supervisor
              </label>
              <select
                className="input-field w-full"
                value={selectedSiteSupervisor}
                onChange={(e) => setSelectedSiteSupervisor(e.target.value)}
              >
                <option value="">Select Site Supervisor</option>
                {siteSupervisors.map((ss) => (
                  <option key={ss.id} value={ss.id}>
                    {ss.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 relative dropdown-multicheck">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cluster Supervisors
              </label>
              <button
                type="button"
                className="input-field w-full flex justify-between items-center cursor-pointer"
                onClick={() => setDropdownOpen((open) => !open)}
              >
                <span>{getSelectedClusterSupervisorsLabel()}</span>
                <svg
                  className={`w-4 h-4 ml-2 transition-transform ${
                    dropdownOpen ? "rotate-180" : "rotate-0"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto">
                  {clusterSupervisors.length === 0 && (
                    <div className="px-4 py-2 text-gray-500">
                      No cluster supervisors
                    </div>
                  )}
                  {clusterSupervisors.map((cs) => (
                    <label
                      key={cs.id}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClusterSupervisors.includes(
                          cs.id.toString()
                        )}
                        onChange={() =>
                          handleClusterSupervisorCheck(cs.id.toString())
                        }
                      />
                      <span>{cs.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            className="btn-primary"
            disabled={
              !selectedSiteSupervisor ||
              selectedClusterSupervisors.length === 0 ||
              assignLoading
            }
            onClick={handleAssign}
          >
            {assignLoading
              ? "Assigning..."
              : "Assign Selected Cluster Supervisors"}
          </button>
          {assignSuccess && (
            <div className="text-green-600 mt-2">{assignSuccess}</div>
          )}
          {assignError && (
            <div className="text-red-600 mt-2">{assignError}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Users;
