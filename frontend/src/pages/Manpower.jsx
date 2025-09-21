import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import ManpowerAnalytics from "../components/common/ManpowerAnalytics";
import ManpowerEntryForm from "../components/common/ManpowerEntryForm";
import ManpowerDataTable from "../components/common/ManpowerDataTable";

const Manpower = () => {
  const { siteId } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState({
    analytics: null,
    dateSpecificData: null,
    designations: [],
  });
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [selectedDesignation, setSelectedDesignation] = useState("");

  // Fetch all manpower data in a single optimized call
  const fetchManpowerData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      // Add analytics date range
      if (dateRange.startDate) params.append("startDate", dateRange.startDate);
      if (dateRange.endDate) params.append("endDate", dateRange.endDate);

      // Add designation filter
      if (selectedDesignation)
        params.append("designation", selectedDesignation);

      // Add selected date for date-specific data
      params.append("selectedDate", selectedDate);

      // Always include analytics
      params.append("includeAnalytics", "true");

      const response = await api.get(
        `/manpower/sites/${siteId}/data?${params}`
      );

      setData(response.data);
    } catch (error) {
      console.error("Error fetching manpower data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (siteId) {
      fetchManpowerData();
    }
  }, [siteId]);

  // Refetch data when date range, selected date, or designation changes
  useEffect(() => {
    if (siteId) {
      fetchManpowerData();
    }
  }, [dateRange, selectedDate, selectedDesignation, siteId]);

  // Handle add entry
  const handleAddEntry = async (entryData) => {
    try {
      setAddLoading(true);
      await api.post(`/manpower/sites/${siteId}/entries`, entryData);
      await fetchManpowerData();
    } catch (error) {
      console.error("Error adding entry:", error);
      alert("Failed to add entry. Please try again.");
    } finally {
      setAddLoading(false);
    }
  };

  // Handle bulk update
  const handleBulkUpdate = async (date, entries) => {
    try {
      setAddLoading(true);
      await api.post(`/manpower/sites/${siteId}/bulk`, { date, entries });
      await fetchManpowerData();
    } catch (error) {
      console.error("Error bulk updating:", error);
      alert("Failed to bulk update. Please try again.");
    } finally {
      setAddLoading(false);
    }
  };

  // Handle edit entry
  const handleEditEntry = async (entryId, editData) => {
    try {
      setEditLoading(true);
      await api.put(`/manpower/entries/${entryId}`, editData);
      await fetchManpowerData();
    } catch (error) {
      console.error("Error editing entry:", error);
      alert("Failed to edit entry. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  // Handle delete entry
  const handleDeleteEntry = async (entryId) => {
    try {
      setDeleteLoading(true);
      await api.delete(`/manpower/entries/${entryId}`);
      await fetchManpowerData();
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Failed to delete entry. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle date range change
  const handleDateRangeChange = (field, value) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle designation filter change
  const handleDesignationFilter = (designation) => {
    setSelectedDesignation(designation);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg text-gray-600">
          Loading manpower data...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Manpower Tracking
          </h1>
          <p className="mt-2 text-gray-600">
            Track and analyze daily manpower for different designations
          </p>
        </div>

        {/* Date Range and Designation Filter */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Analytics Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  handleDateRangeChange("startDate", e.target.value)
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  handleDateRangeChange("endDate", e.target.value)
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Designation
              </label>
              <select
                value={selectedDesignation}
                onChange={(e) => handleDesignationFilter(e.target.value)}
                className="input-field"
              >
                <option value="">All Designations</option>
                {data.designations?.map((designation) => (
                  <option key={designation} value={designation}>
                    {designation}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="mb-8">
          <ManpowerAnalytics
            analyticsData={data.analytics}
            dateSpecificData={data.dateSpecificData}
            loading={loading}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
          />
        </div>

        {/* Entry Form */}
        <div className="mb-8">
          <ManpowerEntryForm
            onSubmit={handleAddEntry}
            onBulkUpdate={handleBulkUpdate}
            loading={addLoading}
            designations={data.designations}
            selectedDate={selectedDate}
            existingEntries={data.dateSpecificData?.entries || []}
          />
        </div>
      </div>
    </div>
  );
};

export default Manpower;
