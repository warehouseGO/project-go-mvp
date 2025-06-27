import React, { useState, useEffect } from "react";
import { JOB_STATUS } from "../../utils/constants";

const DeviceModal = ({
  isOpen,
  onClose,
  mode = "add", // "add" or "edit"
  device = null,
  onSubmit,
  loading = false,
  siteSupervisors = [],
}) => {
  const isEdit = mode === "edit";
  const [formData, setFormData] = useState({
    serialNumber: "",
    name: "",
    type: "",
    subtype: "",
    siteSupervisorId: "",
  });
  const [attributes, setAttributes] = useState([]); // [{key: '', value: ''}]
  const [attrError, setAttrError] = useState("");
  const [jobs, setJobs] = useState([]); // [{id?, name}]
  const [jobError, setJobError] = useState("");

  useEffect(() => {
    if (isEdit && device) {
      setFormData({
        serialNumber: device.serialNumber || "",
        name: device.name || "",
        type: device.type || "",
        subtype: device.subtype || "",
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
      setJobs(
        device.jobs ? device.jobs.map((j) => ({ id: j.id, name: j.name })) : []
      );
    } else if (!isEdit) {
      setFormData({
        serialNumber: "",
        name: "",
        type: "",
        subtype: "",
        siteSupervisorId: "",
      });
      setAttributes([]);
      setJobs([]);
    }
  }, [device, isEdit, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate attributes
    const keys = attributes.map((a) => a.key.trim());
    if (keys.some((k) => !k)) {
      setAttrError("Attribute keys cannot be empty.");
      return;
    }
    if (new Set(keys).size !== keys.length) {
      setAttrError("Attribute keys must be unique.");
      return;
    }
    setAttrError("");
    // Validate jobs
    if (jobs.some((j) => !j.name.trim())) {
      setJobError("Job names cannot be empty.");
      return;
    }
    setJobError("");
    // Convert to object
    const attrObj = {};
    attributes.forEach((a) => {
      if (a.key.trim()) attrObj[a.key.trim()] = a.value;
    });
    // Prepare jobs for backend: only name (and id if editing), status logic
    const jobsForSubmit = jobs.map((j) =>
      isEdit && j.id
        ? { id: j.id, name: j.name } // status/comment not editable
        : { name: j.name, status: JOB_STATUS.IN_PROGRESS }
    );
    onSubmit({ ...formData, attributes: attrObj, jobs: jobsForSubmit });
  };

  const handleAttrChange = (idx, field, value) => {
    setAttributes((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a))
    );
  };

  const handleAddAttr = () => {
    setAttributes((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleRemoveAttr = (idx) => {
    setAttributes((prev) => prev.filter((_, i) => i !== idx));
  };

  // Jobs logic
  const handleJobChange = (idx, value) => {
    setJobs((prev) =>
      prev.map((j, i) => (i === idx ? { ...j, name: value } : j))
    );
  };
  const handleAddJob = () => {
    setJobs((prev) => [...prev, { name: "" }]);
  };
  const handleRemoveJob = (idx) => {
    setJobs((prev) => prev.filter((_, i) => i !== idx));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-semibold mb-4">
          {isEdit ? "Edit Device" : "Add New Device"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Serial Number{isEdit ? "" : " *"}
            </label>
            <input
              type="text"
              className={`input-field${
                isEdit ? " bg-gray-100 cursor-not-allowed" : ""
              }`}
              value={formData.serialNumber}
              onChange={(e) =>
                !isEdit &&
                setFormData((prev) => ({
                  ...prev,
                  serialNumber: e.target.value,
                }))
              }
              placeholder="Enter serial number"
              required={!isEdit}
              disabled={isEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device Name *
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter device name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device Type *
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, type: e.target.value }))
              }
              placeholder="e.g., Heat Exchanger, Pump"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device Subtype
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.subtype}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subtype: e.target.value }))
              }
              placeholder="e.g., Floating, Fixed"
            />
          </div>

          {/* Assign Site Supervisor */}
          {siteSupervisors && siteSupervisors.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Site Supervisor
              </label>
              <select
                className="input-field"
                value={formData.siteSupervisorId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    siteSupervisorId: e.target.value,
                  }))
                }
              >
                <option value="">None</option>
                {siteSupervisors.map((ss) => (
                  <option key={ss.id} value={ss.id}>
                    {ss.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Additional Attributes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Additional Attributes
              </label>
              <button
                type="button"
                className="btn-secondary btn-xs"
                onClick={handleAddAttr}
              >
                + Add
              </button>
            </div>
            {attributes.map((attr, idx) => (
              <div key={idx} className="flex gap-2 mb-1">
                <input
                  type="text"
                  className="input-field flex-1"
                  placeholder="Key"
                  value={attr.key}
                  onChange={(e) => handleAttrChange(idx, "key", e.target.value)}
                />
                <input
                  type="text"
                  className="input-field flex-1"
                  placeholder="Value"
                  value={attr.value}
                  onChange={(e) =>
                    handleAttrChange(idx, "value", e.target.value)
                  }
                />
                <button
                  type="button"
                  className="btn-danger btn-xs"
                  onClick={() => handleRemoveAttr(idx)}
                >
                  Remove
                </button>
              </div>
            ))}
            {attrError && (
              <div className="text-red-600 text-xs mt-1">{attrError}</div>
            )}
          </div>

          {/* Jobs */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Jobs
              </label>
              <button
                type="button"
                className="btn-secondary btn-xs"
                onClick={handleAddJob}
              >
                + Add
              </button>
            </div>
            {jobs.map((job, idx) => (
              <div key={job.id || idx} className="flex gap-2 mb-1 items-center">
                <input
                  type="text"
                  className="input-field flex-1"
                  placeholder="Job Name"
                  value={job.name}
                  onChange={(e) => handleJobChange(idx, e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn-danger btn-xs"
                  onClick={() => handleRemoveJob(idx)}
                >
                  Remove
                </button>
              </div>
            ))}
            {jobError && (
              <div className="text-red-600 text-xs mt-1">{jobError}</div>
            )}
          </div>

          <div className="flex gap-2 justify-end mt-4">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? isEdit
                  ? "Saving..."
                  : "Adding..."
                : isEdit
                ? "Save Changes"
                : "Add Device"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeviceModal;
