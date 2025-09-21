import React, { useState } from "react";

const ManpowerDataTable = ({
  data = [],
  loading = false,
  onEdit,
  onDelete,
  onDateChange,
  selectedDate = new Date().toISOString().split("T")[0],
  designations = [],
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);
  const [editSuggestions, setEditSuggestions] = useState([]);

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setEditData({
      designation: entry.designation,
      dayshift: entry.dayshift,
      nightshift: entry.nightshift,
    });
  };

  const handleSave = () => {
    if (editingId) {
      onEdit(editingId, editData);
      setEditingId(null);
      setEditData({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleInputChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Handle designation autocomplete for editing
    if (field === "designation") {
      if (value.length > 0) {
        const filteredSuggestions = designations.filter((designation) =>
          designation.toLowerCase().includes(value.toLowerCase())
        );
        setEditSuggestions(filteredSuggestions);
        setShowEditSuggestions(true);
      } else {
        setShowEditSuggestions(false);
        setEditSuggestions([]);
      }
    }
  };

  const handleEditSuggestionClick = (suggestion) => {
    setEditData((prev) => ({
      ...prev,
      designation: suggestion,
    }));
    setShowEditSuggestions(false);
    setEditSuggestions([]);
  };

  const handleDelete = (entryId) => {
    setShowDeleteConfirm(entryId);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      onDelete(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Recent Entries</h3>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Filter by Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Designation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Day Shift
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Night Shift
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No manpower entries found for the selected date
                </td>
              </tr>
            ) : (
              data.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(entry.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === entry.id ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={editData.designation}
                          onChange={(e) =>
                            handleInputChange("designation", e.target.value)
                          }
                          onFocus={() => {
                            if (editData.designation.length > 0) {
                              setShowEditSuggestions(true);
                            }
                          }}
                          onBlur={() => {
                            // Delay hiding suggestions to allow clicks
                            setTimeout(
                              () => setShowEditSuggestions(false),
                              200
                            );
                          }}
                          className="input-field"
                          placeholder="Type designation name..."
                        />
                        {showEditSuggestions && editSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-auto">
                            {editSuggestions.map((suggestion, index) => (
                              <div
                                key={index}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                onClick={() =>
                                  handleEditSuggestionClick(suggestion)
                                }
                              >
                                {suggestion}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        {entry.designation}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        value={editData.dayshift}
                        onChange={(e) =>
                          handleInputChange(
                            "dayshift",
                            parseInt(e.target.value) || 0
                          )
                        }
                        min="0"
                        className="input-field w-20"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">
                        {entry.dayshift}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        value={editData.nightshift}
                        onChange={(e) =>
                          handleInputChange(
                            "nightshift",
                            parseInt(e.target.value) || 0
                          )
                        }
                        min="0"
                        className="input-field w-20"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">
                        {entry.nightshift}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {editingId === entry.id
                      ? (editData.dayshift || 0) + (editData.nightshift || 0)
                      : entry.dayshift + entry.nightshift}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.creator?.name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingId === entry.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSave}
                          className="text-green-600 hover:text-green-900"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">
                Delete Entry
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this manpower entry? This
                  action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button onClick={confirmDelete} className="btn-danger">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManpowerDataTable;
