import React, { useState } from "react";

const ExcelHeaderConfig = ({
  excelFile,
  selectedSheet,
  headerRowCount,
  onHeaderRowCountChange,
  onNext,
  onBack,
  title = "Configure Headers",
  description = "Specify how many rows contain headers in your Excel file.",
}) => {
  const [localHeaderRowCount, setLocalHeaderRowCount] =
    useState(headerRowCount);

  const handleNext = async () => {
    onHeaderRowCountChange(localHeaderRowCount);
    onNext(localHeaderRowCount);
  };

  const handleBack = () => {
    onBack();
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Header Rows
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              min="1"
              max="10"
              value={localHeaderRowCount}
              onChange={(e) =>
                setLocalHeaderRowCount(parseInt(e.target.value) || 1)
              }
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-sm text-gray-500">
              {localHeaderRowCount === 1 ? "row" : "rows"}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Most Excel files have 1-2 header rows. Nested headers (like merged
            cells) may require 2+ rows.
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={handleBack}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ExcelHeaderConfig;
