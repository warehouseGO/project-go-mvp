import React from "react";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

const DeviceFieldMapper = ({
  parsedData,
  fieldMappings,
  onFieldMappingChange,
  onEquipmentTagFieldToggle,
  onEquipmentTagReorder,
  onJobScopeFieldToggle,
  onAttributeFieldToggle,
  onSelectAllAttributes,
  onDeselectAllAttributes,
  errors = {},
}) => {
  const availableFields =
    parsedData.length > 0 ? Object.keys(parsedData[0]) : [];

  return (
    <div className="space-y-6">
      {/* Required Fields */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Required Fields *</h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Serial Number *
          </label>
          <select
            value={fieldMappings.serialNumber}
            onChange={(e) =>
              onFieldMappingChange("serialNumber", e.target.value)
            }
            className="input-field"
          >
            <option value="">Select column</option>
            {availableFields.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
          {errors.serialNumber && (
            <div className="text-red-500 text-sm mt-1">
              {errors.serialNumber}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Equipment Tag Number * (select multiple fields to concatenate with
            hyphen)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Select columns in order - they will be joined with "-" to create the
            tag number
          </p>

          {/* Selected fields with reorder controls */}
          {fieldMappings.equipmentTag.length > 0 && (
            <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs font-medium text-blue-700 mb-2">
                Selected fields (in order):
              </div>
              <div className="space-y-1">
                {fieldMappings.equipmentTag.map((field, index) => (
                  <div
                    key={field}
                    className="flex items-center justify-between bg-white px-2 py-1 rounded border"
                  >
                    <span className="text-sm text-gray-700">{field}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => {
                          const newOrder = [...fieldMappings.equipmentTag];
                          [newOrder[index - 1], newOrder[index]] = [
                            newOrder[index],
                            newOrder[index - 1],
                          ];
                          onEquipmentTagReorder(newOrder);
                        }}
                        className="p-0.5 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ChevronUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={
                          index === fieldMappings.equipmentTag.length - 1
                        }
                        onClick={() => {
                          const newOrder = [...fieldMappings.equipmentTag];
                          [newOrder[index], newOrder[index + 1]] = [
                            newOrder[index + 1],
                            newOrder[index],
                          ];
                          onEquipmentTagReorder(newOrder);
                        }}
                        className="p-0.5 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ChevronDownIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-blue-600">
                Preview: {fieldMappings.equipmentTag.join("-")}
              </div>
            </div>
          )}

          {/* Checkbox grid for field selection */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {availableFields.map((field) => (
              <label
                key={field}
                className={`flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer ${
                  fieldMappings.equipmentTag.includes(field)
                    ? "bg-blue-50 border-blue-300"
                    : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={fieldMappings.equipmentTag.includes(field)}
                  onChange={() => onEquipmentTagFieldToggle(field)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 truncate" title={field}>
                  {field}
                </span>
              </label>
            ))}
          </div>
          {errors.equipmentTag && (
            <div className="text-red-500 text-sm mt-1">
              {errors.equipmentTag}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name of Equipment *
          </label>
          <select
            value={fieldMappings.name}
            onChange={(e) => onFieldMappingChange("name", e.target.value)}
            className="input-field"
          >
            <option value="">Select column</option>
            {availableFields.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
          {errors.name && (
            <div className="text-red-500 text-sm mt-1">{errors.name}</div>
          )}
        </div>
      </div>

      {/* Job Scope Fields */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">
          Job Scope Fields (Y/N columns) *
        </h4>
        <p className="text-sm text-gray-600">
          Select columns that contain Y/N values for job scopes
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {availableFields
            .filter((field) => !fieldMappings.attributeFields.includes(field))
            .map((field) => (
              <label
                key={field}
                className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={fieldMappings.jobScopeFields.includes(field)}
                  onChange={() => onJobScopeFieldToggle(field)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 truncate" title={field}>
                  {field}
                </span>
              </label>
            ))}
        </div>
        {errors.jobScopeFields && (
          <div className="text-red-500 text-sm">{errors.jobScopeFields}</div>
        )}
      </div>

      {/* Attribute Fields */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Attribute Fields</h4>
        <p className="text-sm text-gray-600">
          Select columns to be added as device attributes
        </p>

        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {fieldMappings.attributeFields.length} of{" "}
            {
              availableFields.filter(
                (field) => !fieldMappings.jobScopeFields.includes(field)
              ).length
            }{" "}
            fields selected as attributes
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSelectAllAttributes}
              className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={onDeselectAllAttributes}
              className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
            >
              Deselect All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {availableFields
            .filter((field) => !fieldMappings.jobScopeFields.includes(field))
            .map((field) => (
              <label
                key={field}
                className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={fieldMappings.attributeFields.includes(field)}
                  onChange={() => onAttributeFieldToggle(field)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 truncate" title={field}>
                  {field}
                </span>
              </label>
            ))}
        </div>
      </div>
    </div>
  );
};

export default DeviceFieldMapper;
