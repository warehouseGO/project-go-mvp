import React from "react";

const ExcelFieldMapper = ({
  parsedData,
  fieldMappings,
  onFieldMappingChange,
  onNext,
  onBack,
  onImport,
  title = "Field Mapping",
  description = "Map the Excel columns to the required fields.",
  children, // This will be the specific field mapping UI
}) => {
  const handleNext = () => {
    onNext();
  };

  const handleImport = () => {
    onImport();
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      </div>

      {/* This is where the specific field mapping UI will be rendered */}
      {children}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Back
        </button>
        <div className="space-x-2">
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Preview
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Import Directly
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelFieldMapper;
