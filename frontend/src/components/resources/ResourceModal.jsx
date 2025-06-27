import React, { useState, useEffect } from "react";

const ResourceModal = ({
  isOpen,
  onClose,
  resource,
  onSubmit,
  loading = false,
  sites = [],
  mode = "add",
}) => {
  const isEdit = mode === "edit";
  const [formData, setFormData] = useState({
    name: "",
    regNo: "",
    type: "",
    siteId: "",
    allocatedAt: "",
  });
  const [attributes, setAttributes] = useState([]);
  const [attrError, setAttrError] = useState("");

  useEffect(() => {
    if (isEdit && resource) {
      setFormData({
        name: resource.name || "",
        regNo: resource.regNo || "",
        type: resource.type || "",
        siteId: resource.siteId ? String(resource.siteId) : "",
        allocatedAt: resource.allocatedAt
          ? resource.allocatedAt.slice(0, 10)
          : "",
      });
      setAttributes(
        resource.attributes
          ? Object.entries(resource.attributes).map(([key, value]) => ({
              key,
              value,
            }))
          : []
      );
    } else if (!isEdit) {
      setFormData({
        name: "",
        regNo: "",
        type: "",
        siteId: "",
        allocatedAt: "",
      });
      setAttributes([]);
    }
  }, [resource, isEdit, isOpen]);

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
    // Convert to object
    const attrObj = {};
    attributes.forEach((a) => {
      if (a.key.trim()) attrObj[a.key.trim()] = a.value;
    });
    const data = { ...formData, attributes: attrObj };
    if (!data.siteId) delete data.siteId;
    if (!data.allocatedAt) delete data.allocatedAt;
    onSubmit(data);
  };
  const handleAttrChange = (idx, field, value) => {
    setAttributes((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a))
    );
  };
  const handleAddAttr = () =>
    setAttributes((prev) => [...prev, { key: "", value: "" }]);
  const handleRemoveAttr = (idx) =>
    setAttributes((prev) => prev.filter((_, i) => i !== idx));
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-semibold mb-4">
          {isEdit ? "Edit Resource" : "Add Resource"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.name}
              onChange={(e) =>
                setFormData((f) => ({ ...f, name: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reg No *
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.regNo}
              onChange={(e) =>
                setFormData((f) => ({ ...f, regNo: e.target.value }))
              }
              required
              disabled={isEdit}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.type}
              onChange={(e) =>
                setFormData((f) => ({ ...f, type: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site
            </label>
            <select
              className="input-field"
              value={formData.siteId}
              onChange={(e) =>
                setFormData((f) => ({ ...f, siteId: e.target.value }))
              }
            >
              <option value="">Unallocated</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Allocated At
            </label>
            <input
              type="date"
              className="input-field"
              value={formData.allocatedAt}
              onChange={(e) =>
                setFormData((f) => ({ ...f, allocatedAt: e.target.value }))
              }
            />
          </div>
          {/* Attributes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Attributes
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
                : "Add Resource"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceModal;
