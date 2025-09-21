import React, { useState } from "react";
import ExcelReader from "../../utils/excelReader";

const ExcelUploader = ({
  onFileProcessed,
  onError,
  title = "Upload Excel File",
  description = "Select an Excel file containing data. The file should have headers in the first few rows.",
  accept = ".xlsx,.xls,.xlsm,.xlsb",
}) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setError("");
    setLoading(true);

    try {
      const data = await ExcelReader.readExcelFile(selectedFile, {
        includeRaw: true,
      });
      setFile(selectedFile);
      onFileProcessed(selectedFile, data);
    } catch (err) {
      const errorMessage = err.message || "Failed to read Excel file";
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setError("");
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                {file ? file.name : "Click to upload Excel file"}
              </span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept={accept}
                onChange={handleFileUpload}
                disabled={loading}
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">{accept}</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Processing file...</span>
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      {file && (
        <div className="bg-green-50 p-3 rounded-md">
          <p className="text-green-800 text-sm">
            ✓ File uploaded successfully: {file.name}
          </p>
        </div>
      )}
    </div>
  );
};

export default ExcelUploader;
