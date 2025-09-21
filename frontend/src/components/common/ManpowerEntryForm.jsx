import React, { useState } from "react";

const ManpowerEntryForm = ({
  onSubmit,
  onBulkUpdate,
  loading = false,
  designations = [],
  selectedDate = new Date().toISOString().split("T")[0],
  existingEntries = [],
}) => {
  const [formData, setFormData] = useState({
    designation: "",
    dayshift: 0,
    nightshift: 0,
  });

  const [bulkMode, setBulkMode] = useState(false);
  const [bulkData, setBulkData] = useState({});
  const [errors, setErrors] = useState({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [bulkDesignationInput, setBulkDesignationInput] = useState("");
  const [showBulkSuggestions, setShowBulkSuggestions] = useState(false);

  // Initialize bulk data with existing entries
  React.useEffect(() => {
    if (bulkMode && existingEntries.length > 0) {
      const initialBulkData = {};
      existingEntries.forEach((entry) => {
        initialBulkData[entry.designation] = {
          dayshift: entry.dayshift,
          nightshift: entry.nightshift,
        };
      });
      setBulkData(initialBulkData);
    }
  }, [bulkMode, existingEntries]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Handle designation autocomplete
    if (name === "designation") {
      if (value.length > 0) {
        const filteredSuggestions = designations.filter((designation) =>
          designation.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(filteredSuggestions);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
        setSuggestions([]);
      }
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBulkInputChange = (designation, field, value) => {
    setBulkData((prev) => ({
      ...prev,
      [designation]: {
        ...prev[designation],
        [field]: parseInt(value) || 0,
      },
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.designation) {
      newErrors.designation = "Designation is required";
    }

    if (formData.dayshift < 0) {
      newErrors.dayshift = "Day shift cannot be negative";
    }

    if (formData.nightshift < 0) {
      newErrors.nightshift = "Night shift cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSubmit({
      designation: formData.designation,
      date: selectedDate,
      dayshift: parseInt(formData.dayshift),
      nightshift: parseInt(formData.nightshift),
    });

    // Reset form
    setFormData({
      designation: "",
      dayshift: 0,
      nightshift: 0,
    });
  };

  const handleBulkSubmit = (e) => {
    e.preventDefault();

    const entries = Object.entries(bulkData).map(([designation, data]) => ({
      designation,
      dayshift: data.dayshift || 0,
      nightshift: data.nightshift || 0,
    }));

    onBulkUpdate(selectedDate, entries);
  };

  const handleSuggestionClick = (suggestion) => {
    setFormData((prev) => ({
      ...prev,
      designation: suggestion,
    }));
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleBulkDesignationInput = (value) => {
    setBulkDesignationInput(value);
    if (value.length > 0) {
      const filteredSuggestions = designations.filter((designation) =>
        designation.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowBulkSuggestions(true);
    } else {
      setShowBulkSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleBulkSuggestionClick = (suggestion) => {
    setBulkDesignationInput(suggestion);
    setShowBulkSuggestions(false);
    setSuggestions([]);
  };

  const addDesignationToBulk = (designation) => {
    const finalDesignation = designation || bulkDesignationInput.trim();
    if (finalDesignation && !bulkData[finalDesignation]) {
      setBulkData((prev) => ({
        ...prev,
        [finalDesignation]: { dayshift: 0, nightshift: 0 },
      }));
      setBulkDesignationInput("");
      setShowBulkSuggestions(false);
    }
  };

  const removeDesignationFromBulk = (designation) => {
    setBulkData((prev) => {
      const newData = { ...prev };
      delete newData[designation];
      return newData;
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Manpower Entry</h3>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setBulkMode(false)}
            className={`px-3 py-1 text-sm rounded-md ${
              !bulkMode
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Single Entry
          </button>
          <button
            type="button"
            onClick={() => setBulkMode(true)}
            className={`px-3 py-1 text-sm rounded-md ${
              bulkMode
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Bulk Update
          </button>
        </div>
      </div>

      {!bulkMode ? (
        // Single Entry Form
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Designation *
              </label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                onFocus={() => {
                  if (formData.designation.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Delay hiding suggestions to allow clicks
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                className="input-field"
                placeholder="Type designation name..."
                required
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
              {errors.designation && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.designation}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                className="input-field"
                disabled
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Day Shift
              </label>
              <input
                type="number"
                name="dayshift"
                value={formData.dayshift}
                onChange={handleInputChange}
                min="0"
                className="input-field"
              />
              {errors.dayshift && (
                <p className="text-red-500 text-sm mt-1">{errors.dayshift}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Night Shift
              </label>
              <input
                type="number"
                name="nightshift"
                value={formData.nightshift}
                onChange={handleInputChange}
                min="0"
                className="input-field"
              />
              {errors.nightshift && (
                <p className="text-red-500 text-sm mt-1">{errors.nightshift}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Adding..." : "Add Entry"}
            </button>
          </div>
        </form>
      ) : (
        // Bulk Update Form
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date: {selectedDate}
            </label>
            <p className="text-sm text-gray-600">
              Update manpower for all designations on this date
            </p>
          </div>

          {/* Add Designation Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Designation
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={bulkDesignationInput}
                  onChange={(e) => handleBulkDesignationInput(e.target.value)}
                  onFocus={() => {
                    if (bulkDesignationInput.length > 0) {
                      setShowBulkSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow clicks
                    setTimeout(() => setShowBulkSuggestions(false), 200);
                  }}
                  className="input-field"
                  placeholder="Type designation name..."
                />
                {showBulkSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions
                      .filter((d) => !bulkData[d])
                      .map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => handleBulkSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => addDesignationToBulk()}
                className="btn-primary"
                disabled={!bulkDesignationInput.trim()}
              >
                Add
              </button>
            </div>
          </div>

          {/* Bulk Data Inputs */}
          <div className="space-y-3">
            {Object.entries(bulkData).map(([designation, data]) => (
              <div
                key={designation}
                className="flex items-center space-x-4 p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {designation}
                  </label>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    Day Shift
                  </label>
                  <input
                    type="number"
                    value={data.dayshift || 0}
                    onChange={(e) =>
                      handleBulkInputChange(
                        designation,
                        "dayshift",
                        e.target.value
                      )
                    }
                    min="0"
                    className="input-field"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    Night Shift
                  </label>
                  <input
                    type="number"
                    value={data.nightshift || 0}
                    onChange={(e) =>
                      handleBulkInputChange(
                        designation,
                        "nightshift",
                        e.target.value
                      )
                    }
                    min="0"
                    className="input-field"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeDesignationFromBulk(designation)}
                  className="text-red-600 hover:text-red-800 p-1"
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
              </div>
            ))}
          </div>

          {Object.keys(bulkData).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No designations selected. Add a designation to get started.
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || Object.keys(bulkData).length === 0}
            >
              {loading ? "Updating..." : "Bulk Update"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ManpowerEntryForm;
