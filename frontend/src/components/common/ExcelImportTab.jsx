import React, { useState } from "react";
import ExcelReader from "../../utils/excelReader";
import ExcelUploader from "./ExcelUploader";
import ExcelSheetSelector from "./ExcelSheetSelector";
import ExcelHeaderConfig from "./ExcelHeaderConfig";
import ExcelFieldMapper from "./ExcelFieldMapper";
import DeviceFieldMapper from "./DeviceFieldMapper";
import ExcelPreview from "./ExcelPreview";

const ExcelImportTab = ({ onClose, onSubmit, loading = false }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Sheet Selection, 3: Header Config, 4: Field Mapping, 5: Preview
  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [headerRowCount, setHeaderRowCount] = useState(2);
  const [parsedData, setParsedData] = useState([]);
  const [originalRowCount, setOriginalRowCount] = useState(0);
  const [filteredRowCount, setFilteredRowCount] = useState(0);
  const [transformedData, setTransformedData] = useState([]);
  const [fieldMappings, setFieldMappings] = useState({
    serialNumber: "",
    equipmentTag: "",
    name: "",
    jobScopeFields: [],
    attributeFields: [],
  });
  const [errors, setErrors] = useState({});

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
      setErrors({ parsing: error.message });
    }
  };

  // Step 4: Field Mapping
  const handleFieldMappingChange = (field, value) => {
    setFieldMappings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleJobScopeFieldToggle = (field) => {
    setFieldMappings((prev) => ({
      ...prev,
      jobScopeFields: prev.jobScopeFields.includes(field)
        ? prev.jobScopeFields.filter((f) => f !== field)
        : [...prev.jobScopeFields, field],
    }));
  };

  const handleAttributeFieldToggle = (field) => {
    setFieldMappings((prev) => ({
      ...prev,
      attributeFields: prev.attributeFields.includes(field)
        ? prev.attributeFields.filter((f) => f !== field)
        : [...prev.attributeFields, field],
    }));
  };

  const handleSelectAllAttributes = () => {
    if (parsedData.length === 0) return;

    const availableFields = Object.keys(parsedData[0]).filter(
      (field) =>
        field !== fieldMappings.serialNumber &&
        field !== fieldMappings.equipmentTag &&
        field !== fieldMappings.name &&
        !fieldMappings.jobScopeFields.includes(field)
    );

    setFieldMappings((prev) => ({
      ...prev,
      attributeFields: availableFields,
    }));
  };

  const handleDeselectAllAttributes = () => {
    setFieldMappings((prev) => ({
      ...prev,
      attributeFields: [],
    }));
  };

  const validateMappings = () => {
    const newErrors = {};

    if (!fieldMappings.serialNumber) {
      newErrors.serialNumber = "Serial Number field is required";
    }
    if (!fieldMappings.equipmentTag) {
      newErrors.equipmentTag = "Equipment Tag field is required";
    }
    if (!fieldMappings.name) {
      newErrors.name = "Name field is required";
    }
    if (fieldMappings.jobScopeFields.length === 0) {
      newErrors.jobScopeFields = "At least one Job Scope field is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformData = () => {
    setOriginalRowCount(parsedData.length);

    const validRows = parsedData.filter((row) => {
      const serialValue = row[fieldMappings.serialNumber];
      if (!serialValue) return false;
      const isOnlyNumbers = /^\d+$/.test(serialValue.toString().trim());
      return isOnlyNumbers;
    });

    setFilteredRowCount(validRows.length);

    const transformed = validRows.map((row, index) => {
      const device = {
        serialNumber: row[fieldMappings.equipmentTag] || `DEVICE_${index + 1}`,
        name: row[fieldMappings.name] || `Device ${index + 1}`,
        type: selectedSheet,
        priority: "MEDIUM",
        targetDate: "",
        siteSupervisorId: "",
        attributes: {},
        jobs: [],
      };

      fieldMappings.jobScopeFields.forEach((field) => {
        const value = row[field];
        if (
          value &&
          (value.toString().toUpperCase() === "Y" ||
            value.toString().toUpperCase() === "YES")
        ) {
          device.jobs.push({ name: field });
        }
      });

      fieldMappings.attributeFields.forEach((field) => {
        const value = row[field];
        if (value !== undefined && value !== null && value !== "") {
          device.attributes[field] = value.toString();
        }
      });

      return device;
    });

    setTransformedData(transformed);
    return transformed;
  };

  const handlePreview = () => {
    if (!validateMappings()) return;
    transformData();
    setStep(5);
  };

  const handleImport = () => {
    if (!validateMappings()) return;
    const transformed = transformData();
    onSubmit(transformed);
  };

  const resetImport = () => {
    setStep(1);
    setExcelFile(null);
    setExcelData(null);
    setSelectedSheet("");
    setHeaderRowCount(2);
    setParsedData([]);
    setTransformedData([]);
    setFieldMappings({
      serialNumber: "",
      equipmentTag: "",
      name: "",
      jobScopeFields: [],
      attributeFields: [],
    });
    setErrors({});
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <ExcelUploader
            onFileProcessed={handleFileProcessed}
            onError={handleFileError}
            title="Upload Excel File"
            description="Select an Excel file containing device data. The file should have headers in the first few rows."
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
          <ExcelHeaderConfig
            excelFile={excelFile}
            selectedSheet={selectedSheet}
            headerRowCount={headerRowCount}
            onHeaderRowCountChange={handleHeaderRowCountChange}
            onNext={handleHeaderNext}
            onBack={() => setStep(2)}
          />
        );
      case 4:
        return (
          <ExcelFieldMapper
            parsedData={parsedData}
            fieldMappings={fieldMappings}
            onFieldMappingChange={handleFieldMappingChange}
            onNext={handlePreview}
            onBack={() => setStep(3)}
            onImport={handleImport}
            title="Field Mapping"
            description="Map the Excel columns to device properties. Required fields are marked with *."
          >
            <DeviceFieldMapper
              parsedData={parsedData}
              fieldMappings={fieldMappings}
              onFieldMappingChange={handleFieldMappingChange}
              onJobScopeFieldToggle={handleJobScopeFieldToggle}
              onAttributeFieldToggle={handleAttributeFieldToggle}
              onSelectAllAttributes={handleSelectAllAttributes}
              onDeselectAllAttributes={handleDeselectAllAttributes}
              errors={errors}
            />
          </ExcelFieldMapper>
        );
      case 5:
        return (
          <ExcelPreview
            data={transformedData}
            originalRowCount={originalRowCount}
            filteredRowCount={filteredRowCount}
            onBack={() => setStep(4)}
            onImport={handleImport}
            loading={loading}
            title="Preview Import Data"
            description="Review the devices that will be imported."
          />
        );
      default:
        return null;
    }
  };

  return (
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
      {renderStep()}

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
  );
};

export default ExcelImportTab;
