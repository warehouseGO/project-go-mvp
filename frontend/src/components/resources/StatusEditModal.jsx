import React, { useState, useEffect } from "react";

const StatusEditModal = ({ isOpen, onClose, resource, onSubmit }) => {
  const [status, setStatus] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");
  useEffect(() => {
    if (resource) {
      setStatus(resource.status || "");
      setDispatchDate(
        resource.dispatchDate ? resource.dispatchDate.slice(0, 10) : ""
      );
    }
  }, [resource, isOpen]);
  if (!isOpen || !resource) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Edit Resource Status</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(status, dispatchDate);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              className="input-field"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              <option value="">Select...</option>
              <option value="WORKING">Working</option>
              <option value="BREAKDOWN">Breakdown</option>
              <option value="FREE">Free</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dispatch Date
            </label>
            <input
              type="date"
              className="input-field"
              value={dispatchDate}
              onChange={(e) => setDispatchDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!status}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusEditModal;
