import React, { useState } from "react";
import StatusBadge from "../common/StatusBadge";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import AttributesModal from "../common/AttributesModal";

const ResourceTable = ({
  resources = [],
  onEdit,
  onDelete,
  onBulkAllocate,
  onEditStatus,
  selectedResourceIds = [],
  setSelectedResourceIds,
  showActions = true,
  enableMultiSelect = false,
  sites = [],
  getSiteName = null,
  showEditStatus = false,
}) => {
  const [isAttributesModalOpen, setIsAttributesModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);

  const handleSelectResource = (resourceId, checked) => {
    setSelectedResourceIds((prev) =>
      checked ? [...prev, resourceId] : prev.filter((id) => id !== resourceId)
    );
  };
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedResourceIds(resources.map((r) => r.id));
    } else {
      setSelectedResourceIds([]);
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg shadow border border-gray-200 bg-white">
      {enableMultiSelect && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
          <div className="text-sm text-gray-700">
            {selectedResourceIds.length} selected
          </div>
          <button
            className="btn-primary"
            disabled={selectedResourceIds.length === 0}
            onClick={onBulkAllocate}
          >
            Allocate to Site
          </button>
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {enableMultiSelect && (
              <th className="px-2 py-3">
                <input
                  type="checkbox"
                  checked={
                    selectedResourceIds.length === resources.length &&
                    resources.length > 0
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Reg No
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Site
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Allocated At
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Dispatch Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Attributes
            </th>
            {showActions && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {resources.map((resource) => (
            <tr key={resource.id} className="hover:bg-gray-50 transition">
              {enableMultiSelect && (
                <td className="px-2 py-3">
                  <input
                    type="checkbox"
                    checked={selectedResourceIds.includes(resource.id)}
                    onChange={(e) =>
                      handleSelectResource(resource.id, e.target.checked)
                    }
                  />
                </td>
              )}
              <td className="px-4 py-3 text-sm text-gray-900">
                {resource.name}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {resource.regNo}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {resource.type}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {getSiteName
                  ? getSiteName(resource.siteId)
                  : resource.site?.name || "-"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {resource.allocatedAt
                  ? new Date(resource.allocatedAt).toLocaleDateString()
                  : "-"}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={resource.status} type="resource" />
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {resource.dispatchDate
                  ? new Date(resource.dispatchDate).toLocaleDateString()
                  : "-"}
              </td>
              <td className="px-4 py-3 text-xs text-gray-700">
                {resource.attributes ? (
                  <button
                    className="btn-secondary btn-xs"
                    onClick={() => {
                      setSelectedResource(resource);
                      setIsAttributesModalOpen(true);
                    }}
                  >
                    View
                  </button>
                ) : (
                  <span className="text-gray-400 italic">-</span>
                )}
              </td>
              {showActions && (
                <td className="px-4 py-3 flex gap-2 items-center">
                  {onEdit && (
                    <button
                      className="p-1 rounded hover:bg-blue-100"
                      title="Edit"
                      onClick={() => onEdit(resource)}
                    >
                      <PencilSquareIcon className="h-5 w-5 text-blue-600" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="p-1 rounded hover:bg-red-100"
                      title="Delete"
                      onClick={() => onDelete(resource)}
                    >
                      <TrashIcon className="h-5 w-5 text-red-600" />
                    </button>
                  )}
                  {showEditStatus && onEditStatus && (
                    <button
                      className="p-1 rounded hover:bg-green-100"
                      title="Edit Status"
                      onClick={() => onEditStatus(resource)}
                    >
                      <PencilSquareIcon className="h-5 w-5 text-green-600" />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <AttributesModal
        isOpen={isAttributesModalOpen}
        onClose={() => setIsAttributesModalOpen(false)}
        attributes={selectedResource?.attributes}
      />
    </div>
  );
};

export default ResourceTable;
