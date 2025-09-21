import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { JOB_STATUS, DEVICE_PRIORITY } from "../utils/constants";
import api from "../utils/api";
import PreSDJobTable from "../components/common/PreSDJobTable";
import PreSDJobModal from "../components/common/PreSDJobModal";
import LoadingSpinner from "../components/common/LoadingSpinner";

const PreSDJobs = () => {
  const { siteId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [selectedJobIds, setSelectedJobIds] = useState([]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editJobData, setEditJobData] = useState(null);
  const [deleteJobData, setDeleteJobData] = useState(null);

  // Loading states
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "",
    priority: searchParams.get("priority") || "",
    page: parseInt(searchParams.get("page")) || 1,
    limit: parseInt(searchParams.get("limit")) || 20,
    sortBy: searchParams.get("sortBy") || "createdAt",
    sortOrder: searchParams.get("sortOrder") || "desc",
  });

  // Debounced search state
  const [searchInput, setSearchInput] = useState(filters.search);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(
        `/presd-jobs/sites/${siteId}/jobs?${params}`
      );
      setJobs(response.data.jobs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Failed to fetch PreSD jobs:", error);
      // Handle error appropriately
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Debounced search effect
  useEffect(() => {
    if (searchInput !== filters.search) {
      setIsSearching(true);
    }

    const timeoutId = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchInput,
        page: 1, // Reset to first page when search changes
      }));
      setIsSearching(false);
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchInput, filters.search]);

  // Fetch jobs when filters change
  useEffect(() => {
    fetchJobs();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    if (key === "search") {
      setSearchInput(value);
    } else {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
        page: 1, // Reset to first page when filters change
      }));
    }
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleItemsPerPageChange = (limit) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  // Handle job creation
  const handleAddJob = async (jobData, isBulk = false) => {
    try {
      setAddLoading(true);

      if (isBulk) {
        // Handle bulk import
        const response = await api.post(
          `/presd-jobs/sites/${siteId}/jobs/bulk`,
          {
            jobs: jobData,
          }
        );
        console.log("Bulk jobs created:", response.data);
      } else {
        // Handle single job creation
        const response = await api.post(
          `/presd-jobs/sites/${siteId}/jobs`,
          jobData
        );
        console.log("Job created:", response.data);
      }

      setShowAddModal(false);
      fetchJobs(); // Refresh the list
    } catch (error) {
      console.error("Failed to create job(s):", error);
      // Handle error appropriately
    } finally {
      setAddLoading(false);
    }
  };

  // Handle job editing
  const handleEditJob = (job) => {
    setEditJobData(job);
  };

  const handleEditJobSubmit = async (jobData) => {
    try {
      setEditLoading(true);
      const response = await api.put(
        `/presd-jobs/jobs/${editJobData.id}`,
        jobData
      );
      console.log("Job updated:", response.data);
      setEditJobData(null);
      fetchJobs(); // Refresh the list
    } catch (error) {
      console.error("Failed to update job:", error);
      // Handle error appropriately
    } finally {
      setEditLoading(false);
    }
  };

  // Handle job deletion
  const handleDeleteJob = (job) => {
    setDeleteJobData(job);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await api.delete(`/presd-jobs/jobs/${deleteJobData.id}`);
      console.log("Job deleted");
      setDeleteJobData(null);
      fetchJobs(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete job:", error);
      // Handle error appropriately
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedJobIds.length === 0) return;

    try {
      if (action === "delete") {
        // Delete selected jobs
        await Promise.all(
          selectedJobIds.map((jobId) => api.delete(`/presd-jobs/jobs/${jobId}`))
        );
        console.log("Selected jobs deleted");
        setSelectedJobIds([]);
        fetchJobs(); // Refresh the list
      } else if (action === "status") {
        // Update status for selected jobs
        // This would open a status update modal
        console.log("Update status for selected jobs:", selectedJobIds);
      }
    } catch (error) {
      console.error("Failed to perform bulk action:", error);
      // Handle error appropriately
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PreSD Jobs</h1>
          <p className="text-gray-600">
            Manage pre-shutdown jobs for this site
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          Add PreSD Job
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
              {isSearching && (
                <span className="ml-2 text-xs text-blue-600">Searching...</span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="Search job descriptions..."
                className="input-field pr-8"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-4 h-4"
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
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="input-field"
            >
              <option value="">All Statuses</option>
              <option value={JOB_STATUS.IN_PROGRESS}>In Progress</option>
              <option value={JOB_STATUS.COMPLETED}>Completed</option>
              <option value={JOB_STATUS.CONSTRAINT}>Constraint</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              className="input-field"
            >
              <option value="">All Priorities</option>
              <option value={DEVICE_PRIORITY.LOW}>Low</option>
              <option value={DEVICE_PRIORITY.MEDIUM}>Medium</option>
              <option value={DEVICE_PRIORITY.HIGH}>High</option>
              <option value={DEVICE_PRIORITY.EXTREME}>Extreme</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split("-");
                setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
              }}
              className="input-field"
            >
              <option value="createdAt-desc">Created (Newest)</option>
              <option value="createdAt-asc">Created (Oldest)</option>
              <option value="jobDescription-asc">Description (A-Z)</option>
              <option value="jobDescription-desc">Description (Z-A)</option>
              <option value="priority-desc">Priority (High to Low)</option>
              <option value="priority-asc">Priority (Low to High)</option>
              <option value="status-asc">Status (A-Z)</option>
              <option value="status-desc">Status (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <PreSDJobTable
        jobs={jobs}
        loading={loading}
        onEdit={handleEditJob}
        onDelete={handleDeleteJob}
        onBulkAction={handleBulkAction}
        selectedJobIds={selectedJobIds}
        onSelectionChange={setSelectedJobIds}
        pagination={pagination}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {/* Add/Edit Modal */}
      <PreSDJobModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        mode="add"
        onSubmit={handleAddJob}
        loading={addLoading}
      />

      <PreSDJobModal
        isOpen={!!editJobData}
        onClose={() => setEditJobData(null)}
        mode="edit"
        job={editJobData}
        onSubmit={handleEditJobSubmit}
        loading={editLoading}
      />

      {/* Delete Confirmation Modal */}
      {deleteJobData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete PreSD Job
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this job? This action cannot be
              undone.
            </p>
            <div className="bg-gray-50 p-3 rounded mb-4">
              <p className="text-sm text-gray-800">
                <strong>Description:</strong> {deleteJobData.jobDescription}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteJobData(null)}
                className="btn-secondary"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="btn-danger"
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

export default PreSDJobs;
