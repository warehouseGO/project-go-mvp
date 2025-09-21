import React from "react";

const ExcelPreview = ({
  data,
  originalRowCount,
  filteredRowCount,
  onBack,
  onImport,
  loading = false,
  title = "Preview Import Data",
  description = "Review the data that will be imported.",
  renderRow = null, // Custom row renderer function
}) => {
  const defaultRenderRow = (item, index) => (
    <tr key={index}>
      <td className="px-4 py-2 text-sm text-gray-900">
        {item.serialNumber || `Item ${index + 1}`}
      </td>
      <td className="px-4 py-2 text-sm text-gray-900">
        {item.jobDescription || item.name || "N/A"}
      </td>
      <td className="px-4 py-2 text-sm text-gray-900">
        {item.priority || "MEDIUM"}
      </td>
      <td className="px-4 py-2 text-sm text-gray-900">
        {item.remarks || "N/A"}
      </td>
    </tr>
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">
          {description} {data.length} items will be imported.
          {originalRowCount > 0 && filteredRowCount < originalRowCount && (
            <span className="block mt-1 text-amber-600">
              <strong>Note:</strong> {originalRowCount - filteredRowCount} rows
              were filtered out because they don't contain valid data.
            </span>
          )}
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Serial Number
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Job Description
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Priority
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Remarks
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) =>
              renderRow ? renderRow(item, index) : defaultRenderRow(item, index)
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Back to Mapping
        </button>
        <button
          onClick={onImport}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Importing..." : `Import ${data.length} Items`}
        </button>
      </div>
    </div>
  );
};

export default ExcelPreview;
