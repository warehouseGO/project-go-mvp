import React from "react";

const ExcelSheetSelector = ({
  excelData,
  selectedSheet,
  onSheetSelect,
  onNext,
  onBack,
  title = "Select Sheet",
  description = "Choose which sheet contains the data you want to import.",
}) => {
  const sheetNames = Object.keys(excelData?.sheets || {});

  const handleSheetSelect = (sheetName) => {
    onSheetSelect(sheetName);
  };

  const handleNext = () => {
    if (selectedSheet) {
      onNext();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      </div>

      <div className="space-y-2">
        {sheetNames.map((sheetName) => {
          const sheetData = excelData.sheets[sheetName];
          const rowCount = sheetData?.dimensions?.rows || 0;
          const colCount = sheetData?.dimensions?.columns || 0;

          return (
            <button
              key={sheetName}
              onClick={() => handleSheetSelect(sheetName)}
              className={`w-full text-left p-4 border rounded-lg transition-colors ${
                selectedSheet === sheetName
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-gray-900">{sheetName}</h4>
                  <p className="text-sm text-gray-500">
                    {rowCount} rows × {colCount} columns
                  </p>
                </div>
                {selectedSheet === sheetName && (
                  <div className="text-blue-600">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {sheetNames.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No sheets found in the Excel file.
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedSheet}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ExcelSheetSelector;
