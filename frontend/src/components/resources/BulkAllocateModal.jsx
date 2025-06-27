import React, { useState } from "react";

const BulkAllocateModal = ({
  isOpen,
  onClose,
  resourceIds = [],
  sites = [],
  onSubmit,
}) => {
  const [siteId, setSiteId] = useState("");
  const [allocatedAt, setAllocatedAt] = useState("");
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Allocate Resources</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(siteId, allocatedAt);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Site *
            </label>
            <select
              className="input-field"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              required
            >
              <option value="">Select...</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Allocation Date
            </label>
            <input
              type="date"
              className="input-field"
              value={allocatedAt}
              onChange={(e) => setAllocatedAt(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!siteId}>
              Allocate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkAllocateModal;
