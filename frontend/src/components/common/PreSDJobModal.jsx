import React, { useState, useEffect } from "react";
import { JOB_STATUS, DEVICE_PRIORITY } from "../../utils/constants";
import ExcelUploader from "./ExcelUploader";
import ExcelSheetSelector from "./ExcelSheetSelector";
import ExcelHeaderConfig from "./ExcelHeaderConfig";
import ExcelFieldMapper from "./ExcelFieldMapper";
import PreSDJobFieldMapper from "./PreSDJobFieldMapper";
import ExcelPreview from "./ExcelPreview";
import ExcelReader from "../../utils/excelReader";

const PreSDJobModal = ({
  isOpen,
  onClose,
  mode = "add", // "add" or "edit"
  job = null,
  onSubmit,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState("manual");
  const [formData, setFormData] = useState({
    jobDescription: "",
    priority: DEVICE_PRIORITY.MEDIUM,
    remarks: "",
  });
  const [statusData, setStatusData] = useState({
    status: JOB_STATUS.IN_PROGRESS,
    completedDate: "",
  });
  const [errors, setErrors] = useState({});

  // Excel import states
  const [step, setStep] = useState(1); // 1: Upload, 2: Sheet Selection, 3: Header Config, 4: Field Mapping, 5: Preview
  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [headerRowCount, setHeaderRowCount] = useState(2);
  const [parsedData, setParsedData] = useState([]);
  const [originalRowCount, setOriginalRowCount] = useState(0);
  const [filteredRowCount, setFilteredRowCount] = useState(0);
  const [transformedData, setTransformedData] = useState([]);
  const [validRows, setValidRows] = useState([]);
  const [fieldMappings, setFieldMappings] = useState({
    serialNumber: "",
    jobDescription: "",
    priority: "",
    remarks: "",
  });
  const [excelErrors, setExcelErrors] = useState({});

  const isEdit = mode === "edit";

  useEffect(() => {
    if (isEdit && job) {
      // Force manual tab when editing
      setActiveTab("manual");

      setFormData({
        jobDescription: job.jobDescription || "",
        priority: job.priority || DEVICE_PRIORITY.MEDIUM,
        remarks: job.remarks || "",
      });
      setStatusData({
        status: job.status || JOB_STATUS.IN_PROGRESS,
        completedDate: job.completedDate
          ? new Date(job.completedDate).toISOString().split("T")[0]
          : "",
      });
    } else {
      // Reset form for add mode
      setFormData({
        jobDescription: "",
        priority: DEVICE_PRIORITY.MEDIUM,
        remarks: "",
      });
      setStatusData({
        status: JOB_STATUS.IN_PROGRESS,
        completedDate: "",
      });
    }
    setErrors({});
  }, [isEdit, job, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleStatusChange = (e) => {
    const { name, value } = e.target;
    setStatusData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.jobDescription.trim()) {
      newErrors.jobDescription = "Job description is required";
    }

    if (
      statusData.status === JOB_STATUS.COMPLETED &&
      !statusData.completedDate
    ) {
      newErrors.completedDate =
        "Completed date is required when status is completed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      ...statusData,
    };

    onSubmit(submitData);
  };

  // Step 1: File Upload
  const handleFileProcessed = (file, data) => {
    setExcelFile(file);
    setExcelData(data);
    setStep(2);
  };

  const handleFileError = (error) => {
    setExcelErrors({ file: error });
  };

  // Step 2: Sheet Selection
  const handleSheetSelect = (sheetName) => {
    setSelectedSheet(sheetName);
  };

  const handleSheetNext = () => {
    setStep(3);
  };

  // Step 3: Header Configuration
  const handleHeaderRowCountChange = (count) => {
    setHeaderRowCount(count);
  };

  const handleHeaderNext = async () => {
    if (!excelFile || !selectedSheet) return;

    try {
      const sheetData = await ExcelReader.readSheet(excelFile, selectedSheet, {
        nestedHeaders: true,
        headerRowCount: headerRowCount,
      });

      setParsedData(sheetData.data.objects);
      setStep(4);
    } catch (error) {
      setExcelErrors({ parsing: error.message });
    }
  };

  // Step 4: Field Mapping
  const handleFieldMappingChange = (field, value) => {
    setFieldMappings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateMappings = () => {
    const newErrors = {};

    if (!fieldMappings.serialNumber) {
      newErrors.serialNumber = "Serial Number field is required";
    }
    if (!fieldMappings.jobDescription) {
      newErrors.jobDescription = "Job Description field is required";
    }

    setExcelErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformData = () => {
    setOriginalRowCount(parsedData.length);

    const filteredRows = parsedData.filter((row) => {
      const serialValue = row[fieldMappings.serialNumber];
      if (!serialValue) return false;
      const isOnlyNumbers = /^\d+$/.test(serialValue.toString().trim());
      return isOnlyNumbers;
    });

    setValidRows(filteredRows);
    setFilteredRowCount(filteredRows.length);

    const transformed = filteredRows.map((row, index) => {
      const job = {
        jobDescription: row[fieldMappings.jobDescription] || `Job ${index + 1}`,
        priority: row[fieldMappings.priority] || "MEDIUM",
        remarks: row[fieldMappings.remarks] || "",
      };

      return job;
    });

    setTransformedData(transformed);
    return transformed;
  };

  const handlePreview = () => {
    if (!validateMappings()) return;
    transformData();
    setStep(5);
  };

  const handleExcelImport = () => {
    if (!validateMappings()) return;
    const transformed = transformData();
    onSubmit(transformed, true); // true indicates bulk import
  };

  const resetImport = () => {
    setStep(1);
    setExcelFile(null);
    setExcelData(null);
    setSelectedSheet("");
    setHeaderRowCount(2);
    setParsedData([]);
    setTransformedData([]);
    setValidRows([]);
    setFieldMappings({
      serialNumber: "",
      jobDescription: "",
      priority: "",
      remarks: "",
    });
    setExcelErrors({});
  };

  const resetForm = () => {
    setFormData({
      jobDescription: "",
      priority: DEVICE_PRIORITY.MEDIUM,
      remarks: "",
    });
    setStatusData({
      status: JOB_STATUS.IN_PROGRESS,
      completedDate: "",
    });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Edit PreSD Job" : "Add PreSD Job"}
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

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === "manual"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => !isEdit && setActiveTab("excel")}
            disabled={isEdit}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === "excel"
                ? "border-blue-500 text-blue-600"
                : isEdit
                ? "border-transparent text-gray-400 cursor-not-allowed"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            title={
              isEdit
                ? "Excel import is only available when adding new jobs"
                : ""
            }
          >
            Import from Excel
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "manual" ? (
          <form onSubmit={handleManualSubmit} className="space-y-6">
            {/* Job Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Description *
              </label>
              <textarea
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleInputChange}
                className="input-field min-h-[100px]"
                placeholder="Enter detailed job description"
                required
              />
              {errors.jobDescription && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.jobDescription}
                </p>
              )}
            </div>

            {/* Priority and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value={DEVICE_PRIORITY.LOW}>Low</option>
                  <option value={DEVICE_PRIORITY.MEDIUM}>Medium</option>
                  <option value={DEVICE_PRIORITY.HIGH}>High</option>
                  <option value={DEVICE_PRIORITY.EXTREME}>Extreme</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={statusData.status}
                  onChange={handleStatusChange}
                  className="input-field"
                >
                  <option value={JOB_STATUS.IN_PROGRESS}>In Progress</option>
                  <option value={JOB_STATUS.COMPLETED}>Completed</option>
                  <option value={JOB_STATUS.CONSTRAINT}>Constraint</option>
                </select>
              </div>
            </div>

            {/* Completed Date */}
            {statusData.status === JOB_STATUS.COMPLETED && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Completed Date *
                </label>
                <input
                  type="date"
                  name="completedDate"
                  value={statusData.completedDate}
                  onChange={handleStatusChange}
                  className="input-field"
                  required
                />
                {errors.completedDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.completedDate}
                  </p>
                )}
              </div>
            )}

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                className="input-field min-h-[80px]"
                placeholder="Enter any additional remarks or notes"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
                disabled={loading}
              >
                Reset
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Saving..." : isEdit ? "Update Job" : "Add Job"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3, 4, 5].map((stepNumber) => (
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
                  {stepNumber < 5 && (
                    <div
                      className={`w-8 h-0.5 ${
                        step > stepNumber ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            {step === 1 && (
              <ExcelUploader
                onFileProcessed={handleFileProcessed}
                onError={handleFileError}
                title="Upload Excel File"
                description="Select an Excel file containing PreSD job data. The file should have headers in the first few rows."
              />
            )}

            {step === 2 && (
              <ExcelSheetSelector
                excelData={excelData}
                selectedSheet={selectedSheet}
                onSheetSelect={handleSheetSelect}
                onNext={handleSheetNext}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <ExcelHeaderConfig
                excelFile={excelFile}
                selectedSheet={selectedSheet}
                headerRowCount={headerRowCount}
                onHeaderRowCountChange={handleHeaderRowCountChange}
                onNext={handleHeaderNext}
                onBack={() => setStep(2)}
              />
            )}

            {step === 4 && (
              <ExcelFieldMapper
                parsedData={parsedData}
                fieldMappings={fieldMappings}
                onFieldMappingChange={handleFieldMappingChange}
                onNext={handlePreview}
                onBack={() => setStep(3)}
                onImport={handleExcelImport}
                title="PreSD Job Field Mapping"
                description="Map the Excel columns to PreSD job properties. Required fields are marked with *."
              >
                <PreSDJobFieldMapper
                  parsedData={parsedData}
                  fieldMappings={fieldMappings}
                  onFieldMappingChange={handleFieldMappingChange}
                  errors={excelErrors}
                />
              </ExcelFieldMapper>
            )}

            {step === 5 && (
              <ExcelPreview
                data={transformedData}
                originalRowCount={originalRowCount}
                filteredRowCount={filteredRowCount}
                onBack={() => setStep(4)}
                onImport={handleExcelImport}
                loading={loading}
                title="Preview Import Data"
                description="Review the PreSD jobs that will be imported."
                renderRow={(item, index) => {
                  // Get the original serial number from the parsed data for display
                  const originalRow = parsedData[validRows.indexOf(item)];
                  const displaySerialNumber = originalRow
                    ? originalRow[fieldMappings.serialNumber]
                    : `Job ${index + 1}`;

                  return (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {displaySerialNumber || `Job ${index + 1}`}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {item.jobDescription || "N/A"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {item.priority || "MEDIUM"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {item.remarks || "N/A"}
                      </td>
                    </tr>
                  );
                }}
              />
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <button onClick={resetImport} className="btn-secondary">
                Start Over
              </button>
              <button onClick={onClose} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreSDJobModal;
