import React from "react";
import { DEVICE_PRIORITY } from "../../utils/constants";

const PreSDJobFieldMapper = ({
  parsedData,
  fieldMappings,
  onFieldMappingChange,
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
          <p className="text-xs text-gray-500 mt-1">
            Only rows with numeric serial numbers will be imported
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Description *
          </label>
          <select
            value={fieldMappings.jobDescription}
            onChange={(e) =>
              onFieldMappingChange("jobDescription", e.target.value)
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
          {errors.jobDescription && (
            <div className="text-red-500 text-sm mt-1">
              {errors.jobDescription}
            </div>
          )}
        </div>
      </div>

      {/* Optional Fields */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Optional Fields</h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={fieldMappings.priority}
            onChange={(e) => onFieldMappingChange("priority", e.target.value)}
            className="input-field"
          >
            <option value="">Select column</option>
            {availableFields.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            If not mapped, will default to MEDIUM priority
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Remarks
          </label>
          <select
            value={fieldMappings.remarks}
            onChange={(e) => onFieldMappingChange("remarks", e.target.value)}
            className="input-field"
          >
            <option value="">Select column</option>
            {availableFields.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Priority Mapping Help */}
      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Priority Mapping Help:
        </h4>
        <div className="text-xs text-blue-800 space-y-1">
          <div>
            <strong>LOW:</strong> Low priority tasks
          </div>
          <div>
            <strong>MEDIUM:</strong> Standard priority tasks (default)
          </div>
          <div>
            <strong>HIGH:</strong> High priority tasks
          </div>
          <div>
            <strong>EXTREME:</strong> Critical priority tasks
          </div>
          <div className="mt-2 text-gray-600">
            If your Excel has different priority values, they will be mapped as
            follows: "Low" → LOW, "Medium" → MEDIUM, "High" → HIGH, "Critical" →
            EXTREME
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreSDJobFieldMapper;
