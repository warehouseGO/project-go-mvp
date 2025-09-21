import React, { useState, useEffect } from "react";
import { JOB_STATUS, DEVICE_PRIORITY } from "../../utils/constants";
import ExcelImportTab from "./ExcelImportTab";

const EnhancedDeviceModal = ({
  isOpen,
  onClose,
  mode = "add", // "add" or "edit"
  device = null,
  onSubmit,
  loading = false,
  siteSupervisors = [],
}) => {
  const [activeTab, setActiveTab] = useState("manual");
  const [formData, setFormData] = useState({
    serialNumber: "",
    name: "",
    type: "",
    priority: DEVICE_PRIORITY.MEDIUM,
    targetDate: "",
    siteSupervisorId: "",
  });
  const [attributes, setAttributes] = useState([]); // [{key: '', value: ''}]
  const [attrError, setAttrError] = useState("");
  const [jobs, setJobs] = useState([]); // [{id?, name}]
  const [jobError, setJobError] = useState("");

  const isEdit = mode === "edit";

  useEffect(() => {
    if (isEdit && device) {
      // Force manual tab when editing
      setActiveTab("manual");

      setFormData({
        serialNumber: device.serialNumber || "",
        name: device.name || "",
        type: device.type || "",
        priority: device.priority || DEVICE_PRIORITY.MEDIUM,
        targetDate: device.targetDate
          ? new Date(device.targetDate).toISOString().split("T")[0]
          : "",
        siteSupervisorId: device.siteSupervisorId
          ? String(device.siteSupervisorId)
          : "",
      });
      // Convert attributes object to array
      const attrArr = device.attributes
        ? Object.entries(device.attributes).map(([key, value]) => ({
            key,
            value,
          }))
        : [];
      setAttributes(attrArr);

      // Convert jobs array
      const jobsArr = device.jobs
        ? device.jobs.map((job) => ({
            id: job.id,
            name: job.name,
          }))
        : [];
      setJobs(jobsArr);
    } else {
      // Reset form for add mode
      setFormData({
        serialNumber: "",
        name: "",
        type: "",
        priority: DEVICE_PRIORITY.MEDIUM,
        targetDate: "",
        siteSupervisorId: "",
      });
      setAttributes([]);
      setJobs([]);
    }
    setAttrError("");
    setJobError("");
  }, [isEdit, device, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addAttribute = () => {
    setAttributes([...attributes, { key: "", value: "" }]);
    setAttrError("");
  };

  const updateAttribute = (index, field, value) => {
    const updated = [...attributes];
    updated[index][field] = value;
    setAttributes(updated);
    setAttrError("");
  };

  const removeAttribute = (index) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const addJob = () => {
    setJobs([...jobs, { name: "" }]);
    setJobError("");
  };

  const updateJob = (index, value) => {
    const updated = [...jobs];
    updated[index].name = value;
    setJobs(updated);
    setJobError("");
  };

  const removeJob = (index) => {
    setJobs(jobs.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.serialNumber.trim()) {
      return "Serial Number is required";
    }
    if (!formData.name.trim()) {
      return "Device Name is required";
    }
    if (!formData.type.trim()) {
      return "Device Type is required";
    }

    // Validate attributes
    for (let i = 0; i < attributes.length; i++) {
      if (!attributes[i].key.trim()) {
        setAttrError(`Attribute ${i + 1} key is required`);
        return false;
      }
    }

    // Check for duplicate attribute keys
    const keys = attributes.map((attr) => attr.key.trim()).filter((k) => k);
    const uniqueKeys = [...new Set(keys)];
    if (keys.length !== uniqueKeys.length) {
      setAttrError("Duplicate attribute keys found");
      return false;
    }

    // Validate jobs
    for (let i = 0; i < jobs.length; i++) {
      if (!jobs[i].name.trim()) {
        setJobError(`Job ${i + 1} name is required`);
        return false;
      }
    }

    return true;
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Convert attributes array to object
    const attributesObj = {};
    attributes.forEach((attr) => {
      if (attr.key.trim()) {
        attributesObj[attr.key.trim()] = attr.value.trim();
      }
    });

    // Prepare jobs data
    const jobsData = jobs.map((job) => ({
      name: job.name.trim(),
    }));

    const submitData = {
      ...formData,
      attributes: attributesObj,
      jobs: jobsData,
    };

    onSubmit(submitData);
  };

  const handleExcelImport = (devicesData) => {
    // Handle bulk device creation from Excel
    onSubmit(devicesData, true); // true indicates bulk import
  };

  const resetForm = () => {
    setFormData({
      serialNumber: "",
      name: "",
      type: "",
      priority: DEVICE_PRIORITY.MEDIUM,
      targetDate: "",
      siteSupervisorId: "",
    });
    setAttributes([]);
    setJobs([]);
    setAttrError("");
    setJobError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Edit Device" : "Add Device"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
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

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === "manual"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => !isEdit && setActiveTab("excel")}
            disabled={isEdit}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === "excel"
                ? "border-blue-500 text-blue-600"
                : isEdit
                ? "border-transparent text-gray-400 cursor-not-allowed"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            title={
              isEdit
                ? "Excel import is only available when adding new devices"
                : ""
            }
          >
            Import from Excel
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "manual" ? (
          <form onSubmit={handleManualSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number *
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter serial number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter device name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Type *
                </label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., Heat Exchanger, Pump"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value={DEVICE_PRIORITY.LOW}>Low</option>
                  <option value={DEVICE_PRIORITY.MEDIUM}>Medium</option>
                  <option value={DEVICE_PRIORITY.HIGH}>High</option>
                  <option value={DEVICE_PRIORITY.CRITICAL}>Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  name="targetDate"
                  value={formData.targetDate}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Site Supervisor
              </label>
              <select
                name="siteSupervisorId"
                value={formData.siteSupervisorId}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="">Select Site Supervisor</option>
                {siteSupervisors.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.name} ({supervisor.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Attributes Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Custom Attributes
                </label>
                <button
                  type="button"
                  onClick={addAttribute}
                  className="btn-secondary text-sm"
                >
                  + Add Attribute
                </button>
              </div>
              {attributes.map((attr, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Key"
                    value={attr.key}
                    onChange={(e) =>
                      updateAttribute(index, "key", e.target.value)
                    }
                    className="input-field flex-1"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={attr.value}
                    onChange={(e) =>
                      updateAttribute(index, "value", e.target.value)
                    }
                    className="input-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttribute(index)}
                    className="btn-danger px-3 py-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {attrError && (
                <p className="text-red-500 text-sm mt-1">{attrError}</p>
              )}
            </div>

            {/* Jobs Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Associated Jobs
                </label>
                <button
                  type="button"
                  onClick={addJob}
                  className="btn-secondary text-sm"
                >
                  + Add Job
                </button>
              </div>
              {jobs.map((job, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Job name"
                    value={job.name}
                    onChange={(e) => updateJob(index, e.target.value)}
                    className="input-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeJob(index)}
                    className="btn-danger px-3 py-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {jobError && (
                <p className="text-red-500 text-sm mt-1">{jobError}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
                disabled={loading}
              >
                Reset
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading
                  ? "Saving..."
                  : isEdit
                  ? "Update Device"
                  : "Add Device"}
              </button>
            </div>
          </form>
        ) : (
          <ExcelImportTab
            onSubmit={handleExcelImport}
            onClose={onClose}
            loading={loading}
            siteSupervisors={siteSupervisors}
          />
        )}
      </div>
    </div>
  );
};

export default EnhancedDeviceModal;
