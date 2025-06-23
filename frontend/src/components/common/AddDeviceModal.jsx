import React, { useState } from "react";
import { JOB_STATUS } from "../../utils/constants";

const AddDeviceModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  siteSupervisors = [],
}) => {
  const [formData, setFormData] = useState({
    serialNumber: "",
    name: "",
    type: "",
    subtype: "",
    siteSupervisorId: "",
  });
  const [attributes, setAttributes] = useState([]); // [{key: '', value: ''}]
  const [attrError, setAttrError] = useState("");
  const [jobs, setJobs] = useState([]); // [{name, status, comment}]
  const [jobError, setJobError] = useState("");

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
    onSubmit({ ...formData, attributes: attrObj, jobs });
  };

  const handleClose = () => {
    setFormData({
      serialNumber: "",
      name: "",
      type: "",
      subtype: "",
      siteSupervisorId: "",
    });
    setAttributes([]);
    setJobs([]);
    setAttrError("");
    setJobError("");
    onClose();
  };

  const isFormValid = formData.serialNumber && formData.name && formData.type;

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
  const handleJobChange = (idx, field, value) => {
    setJobs((prev) =>
      prev.map((j, i) => (i === idx ? { ...j, [field]: value } : j))
    );
  };
  const handleAddJob = () => {
    setJobs((prev) => [
      ...prev,
      { name: "", status: JOB_STATUS.IN_PROGRESS, comment: "" },
    ]);
  };
  const handleRemoveJob = (idx) => {
    setJobs((prev) => prev.filter((_, i) => i !== idx));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-semibold mb-4">Add New Device</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Serial Number *
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.serialNumber}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  serialNumber: e.target.value,
                }))
              }
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
                className="btn-secondary text-xs px-2 py-1"
                onClick={handleAddAttr}
              >
                + Add Attribute
              </button>
            </div>
            {attributes.length === 0 && (
              <div className="text-xs text-gray-400 mb-2">
                No attributes added yet.
              </div>
            )}
            <div className="space-y-2">
              {attributes.map((attr, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    className="input-field flex-1"
                    placeholder="Key"
                    value={attr.key}
                    onChange={(e) =>
                      handleAttrChange(idx, "key", e.target.value)
                    }
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
                    className="btn-danger text-xs px-2 py-1"
                    onClick={() => handleRemoveAttr(idx)}
                    aria-label="Remove attribute"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {attrError && (
              <div className="text-xs text-red-600 mt-1">{attrError}</div>
            )}
            {attributes.length > 0 && !attrError && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Summary:</div>
                <div className="bg-gray-50 rounded p-2 text-xs text-gray-700">
                  {attributes.map((a, i) => (
                    <div key={i}>
                      <span className="font-medium">{a.key}</span>: {a.value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Jobs Section */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Jobs
              </label>
              <button
                type="button"
                className="btn-secondary text-xs px-2 py-1"
                onClick={handleAddJob}
              >
                + Add Job
              </button>
            </div>
            {jobs.length === 0 && (
              <div className="text-xs text-gray-400 mb-2">
                No jobs added yet.
              </div>
            )}
            <div className="space-y-2">
              {jobs.map((job, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    className="input-field flex-1"
                    placeholder="Job Name"
                    value={job.name}
                    onChange={(e) =>
                      handleJobChange(idx, "name", e.target.value)
                    }
                  />
                  <select
                    className="input-field flex-1"
                    value={job.status}
                    onChange={(e) =>
                      handleJobChange(idx, "status", e.target.value)
                    }
                  >
                    {Object.values(JOB_STATUS).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="input-field flex-1"
                    placeholder="Comment"
                    value={job.comment}
                    onChange={(e) =>
                      handleJobChange(idx, "comment", e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="btn-danger text-xs px-2 py-1"
                    onClick={() => handleRemoveJob(idx)}
                    aria-label="Remove job"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {jobError && (
              <div className="text-xs text-red-600 mt-1">{jobError}</div>
            )}
            {jobs.length > 0 && !jobError && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Summary:</div>
                <div className="bg-gray-50 rounded p-2 text-xs text-gray-700">
                  {jobs.map((j, i) => (
                    <div key={i}>
                      <span className="font-medium">{j.name}</span> ({j.status})
                      {j.comment ? `: ${j.comment}` : ""}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!isFormValid || loading}
            >
              {loading ? "Adding..." : "Add Device"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDeviceModal;
