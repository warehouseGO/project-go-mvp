import React, { useState, useEffect } from "react";
import ExcelReader from "../../utils/excelReader";
import ExcelUploader from "./ExcelUploader";
import ExcelSheetSelector from "./ExcelSheetSelector";

const ManpowerExcelImport = ({
  isOpen,
  onClose,
  onImport,
  loading = false,
  selectedDate,
}) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Sheet Selection, 3: Cell Config, 4: Preview
  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [sheetPreview, setSheetPreview] = useState([]);
  const [cellConfig, setCellConfig] = useState({
    designation: "",
    dayshift: "",
    nightshift: "",
  });
  const [parsedData, setParsedData] = useState([]);
  const [errors, setErrors] = useState({});

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      resetImport();
    }
  }, [isOpen]);

  // Load sheet preview when sheet is selected
  useEffect(() => {
    if (excelFile && selectedSheet) {
      loadSheetPreview();
    }
  }, [excelFile, selectedSheet]);

  const loadSheetPreview = async () => {
    try {
      const preview = await ExcelReader.getSheetPreview(
        excelFile,
        selectedSheet,
        30
      );
      setSheetPreview(preview);
    } catch (error) {
      console.error("Failed to load sheet preview:", error);
      setErrors({ preview: error.message });
    }
  };

  // Step 1: File Upload
  const handleFileProcessed = (file, data) => {
    setExcelFile(file);
    setExcelData(data);
    setStep(2);
  };

  const handleFileError = (error) => {
    setErrors({ file: error });
  };

  // Step 2: Sheet Selection
  const handleSheetSelect = (sheetName) => {
    setSelectedSheet(sheetName);
  };

  const handleSheetNext = () => {
    setStep(3);
  };

  // Step 3: Cell Configuration
  const handleCellConfigChange = (field, value) => {
    setCellConfig((prev) => ({
      ...prev,
      [field]: value.toUpperCase(),
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateCellConfig = () => {
    const newErrors = {};

    // Validate cell reference format
    const cellRefPattern = /^[A-Z]+\d+$/i;

    if (!cellConfig.designation) {
      newErrors.designation = "Designation cell is required";
    } else if (!cellRefPattern.test(cellConfig.designation)) {
      newErrors.designation = "Invalid cell reference (e.g., A5)";
    }

    if (!cellConfig.dayshift) {
      newErrors.dayshift = "Day Shift cell is required";
    } else if (!cellRefPattern.test(cellConfig.dayshift)) {
      newErrors.dayshift = "Invalid cell reference (e.g., B5)";
    }

    if (!cellConfig.nightshift) {
      newErrors.nightshift = "Night Shift cell is required";
    } else if (!cellRefPattern.test(cellConfig.nightshift)) {
      newErrors.nightshift = "Invalid cell reference (e.g., C5)";
    }

    // Validate all cells are on the same row
    if (
      cellConfig.designation &&
      cellConfig.dayshift &&
      cellConfig.nightshift
    ) {
      try {
        const desigPos = ExcelReader.parseCellRef(cellConfig.designation);
        const dayPos = ExcelReader.parseCellRef(cellConfig.dayshift);
        const nightPos = ExcelReader.parseCellRef(cellConfig.nightshift);

        if (desigPos.row !== dayPos.row || desigPos.row !== nightPos.row) {
          newErrors.general = "All header cells must be on the same row";
        }
      } catch (e) {
        newErrors.general = e.message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleParseData = async () => {
    if (!validateCellConfig()) return;

    try {
      const data = await ExcelReader.readManpowerData(
        excelFile,
        selectedSheet,
        cellConfig
      );

      if (data.length === 0) {
        setErrors({
          general:
            "No data found. Check that the cell references are correct and there is data below the headers.",
        });
        return;
      }

      setParsedData(data);
      setStep(4);
    } catch (error) {
      setErrors({ general: error.message });
    }
  };

  // Step 4: Preview and Import
  const handleImport = () => {
    onImport(selectedDate, parsedData);
  };

  const resetImport = () => {
    setStep(1);
    setExcelFile(null);
    setExcelData(null);
    setSelectedSheet("");
    setSheetPreview([]);
    setCellConfig({
      designation: "",
      dayshift: "",
      nightshift: "",
    });
    setParsedData([]);
    setErrors({});
  };

  // Get cell value from preview for highlighting
  const getCellValue = (row, col) => {
    if (sheetPreview[row] && sheetPreview[row][col] !== undefined) {
      return sheetPreview[row][col];
    }
    return "";
  };

  // Check if a cell is one of the configured header cells
  const isHeaderCell = (rowIndex, colIndex) => {
    try {
      if (cellConfig.designation) {
        const pos = ExcelReader.parseCellRef(cellConfig.designation);
        if (pos.row === rowIndex && pos.col === colIndex) return "designation";
      }
      if (cellConfig.dayshift) {
        const pos = ExcelReader.parseCellRef(cellConfig.dayshift);
        if (pos.row === rowIndex && pos.col === colIndex) return "dayshift";
      }
      if (cellConfig.nightshift) {
        const pos = ExcelReader.parseCellRef(cellConfig.nightshift);
        if (pos.row === rowIndex && pos.col === colIndex) return "nightshift";
      }
    } catch (e) {
      // Invalid cell ref, ignore
    }
    return null;
  };

  if (!isOpen) return null;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <ExcelUploader
            onFileProcessed={handleFileProcessed}
            onError={handleFileError}
            title="Upload Manpower Excel File"
            description="Select an Excel file containing manpower data with designations and shift counts."
          />
        );
      case 2:
        return (
          <ExcelSheetSelector
            excelData={excelData}
            selectedSheet={selectedSheet}
            onSheetSelect={handleSheetSelect}
            onNext={handleSheetNext}
            onBack={() => setStep(1)}
          />
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Configure Header Cells
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter the cell references (e.g., A5, B5, C5) where the headers
                are located. All headers must be on the same row.
              </p>
            </div>

            {/* Cell Configuration Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation Header Cell *
                </label>
                <input
                  type="text"
                  value={cellConfig.designation}
                  onChange={(e) =>
                    handleCellConfigChange("designation", e.target.value)
                  }
                  placeholder="e.g., A5"
                  className="input-field"
                />
                {errors.designation && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.designation}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day Shift Header Cell *
                </label>
                <input
                  type="text"
                  value={cellConfig.dayshift}
                  onChange={(e) =>
                    handleCellConfigChange("dayshift", e.target.value)
                  }
                  placeholder="e.g., B5"
                  className="input-field"
                />
                {errors.dayshift && (
                  <p className="text-red-500 text-xs mt-1">{errors.dayshift}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Night Shift Header Cell *
                </label>
                <input
                  type="text"
                  value={cellConfig.nightshift}
                  onChange={(e) =>
                    handleCellConfigChange("nightshift", e.target.value)
                  }
                  placeholder="e.g., C5"
                  className="input-field"
                />
                {errors.nightshift && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.nightshift}
                  </p>
                )}
              </div>
            </div>

            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Sheet Preview with Cell Highlighting */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Sheet Preview (click cells to set references)
              </h4>
              <div className="border rounded-lg overflow-auto max-h-80">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left font-medium text-gray-500 border-r">
                        Row
                      </th>
                      {sheetPreview[0]?.map((_, colIndex) => (
                        <th
                          key={colIndex}
                          className="px-2 py-1 text-center font-medium text-gray-500 min-w-[80px]"
                        >
                          {ExcelReader.colIndexToLetter(colIndex)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheetPreview.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t">
                        <td className="px-2 py-1 font-medium text-gray-500 bg-gray-50 border-r">
                          {rowIndex + 1}
                        </td>
                        {row.map((cell, colIndex) => {
                          const headerType = isHeaderCell(rowIndex, colIndex);
                          let cellClass =
                            "px-2 py-1 border-r cursor-pointer hover:bg-blue-50";
                          if (headerType === "designation") {
                            cellClass += " bg-green-100 border-green-300";
                          } else if (headerType === "dayshift") {
                            cellClass += " bg-yellow-100 border-yellow-300";
                          } else if (headerType === "nightshift") {
                            cellClass += " bg-purple-100 border-purple-300";
                          }

                          return (
                            <td
                              key={colIndex}
                              className={cellClass}
                              onClick={() => {
                                const cellRef = `${ExcelReader.colIndexToLetter(
                                  colIndex
                                )}${rowIndex + 1}`;
                                // Set to the first empty config field
                                if (!cellConfig.designation) {
                                  handleCellConfigChange(
                                    "designation",
                                    cellRef
                                  );
                                } else if (!cellConfig.dayshift) {
                                  handleCellConfigChange("dayshift", cellRef);
                                } else if (!cellConfig.nightshift) {
                                  handleCellConfigChange("nightshift", cellRef);
                                }
                              }}
                              title={`${ExcelReader.colIndexToLetter(
                                colIndex
                              )}${rowIndex + 1}`}
                            >
                              {cell !== null && cell !== undefined
                                ? cell.toString()
                                : ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 flex gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-green-100 border border-green-300 rounded"></span>
                  Designation
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></span>
                  Day Shift
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></span>
                  Night Shift
                </span>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary">
                Back
              </button>
              <button onClick={handleParseData} className="btn-primary">
                Parse Data
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Preview Import Data
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Review the manpower data that will be imported for{" "}
                <strong>{selectedDate}</strong>.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-blue-700">
                  {parsedData.length} entries found
                </span>
                <span className="text-sm text-blue-600">
                  Total Day Shift:{" "}
                  {parsedData.reduce((sum, e) => sum + e.dayshift, 0)} | Total
                  Night Shift:{" "}
                  {parsedData.reduce((sum, e) => sum + e.nightshift, 0)}
                </span>
              </div>
            </div>

            {/* Data Table */}
            <div className="border rounded-lg overflow-auto max-h-80">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Designation
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Day Shift
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Night Shift
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {parsedData.map((entry, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {entry.designation}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {entry.dayshift}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {entry.nightshift}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                        {entry.dayshift + entry.nightshift}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="btn-secondary">
                Back
              </button>
              <button
                onClick={handleImport}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? "Importing..." : "Import Data"}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Import Manpower from Excel
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div
                    className={`w-12 h-0.5 ${
                      step > stepNumber ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 text-xs text-gray-500">
            <span className="w-20 text-center">Upload</span>
            <span className="w-20 text-center">Sheet</span>
            <span className="w-20 text-center">Configure</span>
            <span className="w-20 text-center">Preview</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-auto max-h-[calc(90vh-200px)]">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
          <button onClick={resetImport} className="btn-secondary">
            Start Over
          </button>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManpowerExcelImport;
