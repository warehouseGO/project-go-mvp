import * as XLSX from "xlsx";

/**
 * Frontend Excel Reader Utility
 * Provides functions to read Excel files and convert them to JSON format in the browser
 */

class ExcelReader {
  /**
   * Read an Excel file from File object and convert all sheets to JSON
   * @param {File} file - Excel file from File API
   * @param {Object} options - Reading options
   * @returns {Promise<Object>} Object containing all sheets as JSON
   */
  static async readExcelFile(file, options = {}) {
    try {
      // Validate file
      if (!file) {
        throw new Error("No file provided");
      }

      if (!this.isValidExcelFile(file)) {
        throw new Error("Invalid Excel file format");
      }

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetNames = workbook.SheetNames;

      const result = {
        fileName: file.name,
        sheetCount: sheetNames.length,
        sheets: {},
      };

      // Process each sheet
      sheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];

        // Get sheet dimensions
        const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");
        const dimensions = {
          rows: range.e.r + 1,
          columns: range.e.c + 1,
        };

        const sheetData = {
          name: sheetName,
          dimensions,
          data: {},
        };

        // Raw data (array of arrays)
        if (options.includeRaw !== false) {
          sheetData.data.raw = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: options.defval || "",
            raw: options.raw || false,
          });
        }

        // Object data with nested headers
        if (options.includeObjects !== false) {
          if (options.nestedHeaders) {
            sheetData.data.objects = this._readWithNestedHeaders(
              worksheet,
              options
            );
          } else {
            sheetData.data.objects = XLSX.utils.sheet_to_json(worksheet, {
              defval: options.defval || "",
              raw: options.raw || false,
            });
          }
        }

        result.sheets[sheetName] = sheetData;
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to read Excel file: ${error.message}`);
    }
  }

  /**
   * Read a specific sheet from an Excel file
   * @param {File} file - Excel file from File API
   * @param {string} sheetName - Name of the sheet to read
   * @param {Object} options - Reading options
   * @returns {Promise<Object>} Sheet data as JSON
   */
  static async readSheet(file, sheetName, options = {}) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(
          `Sheet "${sheetName}" not found. Available sheets: ${workbook.SheetNames.join(
            ", "
          )}`
        );
      }

      const worksheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");

      const result = {
        fileName: file.name,
        sheetName,
        dimensions: {
          rows: range.e.r + 1,
          columns: range.e.c + 1,
        },
        data: {},
      };

      // Raw data
      if (options.includeRaw !== false) {
        result.data.raw = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: options.defval || "",
          raw: options.raw || false,
        });
      }

      // Object data with nested headers
      if (options.includeObjects !== false) {
        if (options.nestedHeaders) {
          result.data.objects = this._readWithNestedHeaders(worksheet, options);
        } else {
          result.data.objects = XLSX.utils.sheet_to_json(worksheet, {
            defval: options.defval || "",
            raw: options.raw || false,
          });
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to read sheet: ${error.message}`);
    }
  }

  /**
   * Private method to handle nested headers with merged cell detection
   * @param {Object} worksheet - XLSX worksheet object
   * @param {Object} options - Reading options
   * @returns {Array} Array of objects with combined headers
   */
  static _readWithNestedHeaders(worksheet, options = {}) {
    // Get raw data as array of arrays
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: options.defval || "",
      raw: options.raw || false,
    });

    if (rawData.length < 1) {
      return [];
    }

    // Get number of header rows from options
    const headerRowCount = this._getHeaderRowCount(rawData, options);

    if (headerRowCount === 0) {
      return [];
    }

    // Extract header rows
    const headerRows = rawData.slice(0, headerRowCount);

    // Get merged cell ranges
    const merges = worksheet["!merges"] || [];

    // Combine all header rows with merged cell awareness
    const combinedHeaders = this._combineMultipleHeadersWithMerges(
      headerRows,
      merges
    );

    // Convert data rows to objects using combined headers
    const dataRows = rawData.slice(headerRowCount);
    const result = [];

    dataRows.forEach((row) => {
      const obj = {};
      combinedHeaders.forEach((header, index) => {
        obj[header] = row[index] || options.defval || "";
      });
      result.push(obj);
    });

    return result;
  }

  /**
   * Get the number of header rows from options
   * @param {Array} rawData - Raw data array
   * @param {Object} options - Reading options
   * @returns {number} Number of header rows
   */
  static _getHeaderRowCount(rawData, options = {}) {
    // Require headerRowCount to be explicitly specified
    if (!options.headerRowCount || options.headerRowCount <= 0) {
      throw new Error(
        "headerRowCount must be specified when using nestedHeaders. Example: { nestedHeaders: true, headerRowCount: 2 }"
      );
    }

    return Math.min(options.headerRowCount, rawData.length);
  }

  /**
   * Combine multiple header rows into a single header array
   * @param {Array} headerRows - Array of header rows
   * @param {Array} merges - Array of merged cell ranges
   * @returns {Array} Combined headers
   */
  static _combineMultipleHeadersWithMerges(headerRows, merges) {
    if (headerRows.length === 0) return [];
    if (headerRows.length === 1) return headerRows[0];

    const maxColumns = Math.max(...headerRows.map((row) => row.length));
    const combined = [];

    // Create a map of merged cells for quick lookup
    const mergedCells = new Map();
    merges.forEach((merge) => {
      const { s, e } = merge; // start and end coordinates
      for (let row = s.r; row <= e.r; row++) {
        for (let col = s.c; col <= e.c; col++) {
          mergedCells.set(`${row}-${col}`, {
            isMerged: true,
            masterRow: s.r,
            masterCol: s.c,
            masterValue:
              headerRows[s.r] && headerRows[s.r][s.c]
                ? headerRows[s.r][s.c].toString().trim()
                : "",
          });
        }
      }
    });

    // First pass: identify parent headers with merged cell awareness
    const parentHeaders = new Array(maxColumns).fill("");

    for (let col = 0; col < maxColumns; col++) {
      // Check if this cell is part of a merged range
      const mergeInfo = mergedCells.get(`0-${col}`);

      if (mergeInfo && mergeInfo.isMerged) {
        // This cell is merged, use the master cell's value
        parentHeaders[col] = mergeInfo.masterValue;
      } else {
        // Regular cell, look backwards for parent header
        for (let checkCol = col; checkCol >= 0; checkCol--) {
          const cell = headerRows[0][checkCol];
          if (cell && cell.toString().trim() !== "") {
            parentHeaders[col] = cell.toString().trim();
            break;
          }
        }
      }
    }

    // Second pass: build combined headers
    for (let col = 0; col < maxColumns; col++) {
      let combinedHeader = "";
      let hasContent = false;
      const parentHeader = parentHeaders[col];

      // Build header by combining non-empty cells from all header rows
      for (let row = 0; row < headerRows.length; row++) {
        const cell = headerRows[row][col];
        if (cell && cell.toString().trim() !== "") {
          const cellValue = cell.toString().trim();

          if (row === 0) {
            // This is a parent header
            combinedHeader = cellValue;
            hasContent = true;
          } else {
            // This is a child header, combine with parent
            if (parentHeader && parentHeader !== cellValue) {
              combinedHeader = `${parentHeader}-${cellValue}`;
            } else {
              combinedHeader = cellValue;
            }
            hasContent = true;
          }
        }
      }

      // If no content found, use a generic column name
      if (!hasContent) {
        combinedHeader = `Column_${col + 1}`;
      }

      combined.push(combinedHeader);
    }

    return combined;
  }

  /**
   * Get information about an Excel file without reading all data
   * @param {File} file - Excel file from File API
   * @returns {Promise<Object>} File information
   */
  static async getFileInfo(file) {
    try {
      if (!file) {
        throw new Error("No file provided");
      }

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetNames = workbook.SheetNames;

      const info = {
        fileName: file.name,
        fileSize: file.size,
        sheetCount: sheetNames.length,
        sheets: [],
      };

      sheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");

        info.sheets.push({
          name: sheetName,
          rows: range.e.r + 1,
          columns: range.e.c + 1,
        });
      });

      return info;
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  /**
   * Validate if a file is a valid Excel file
   * @param {File} file - File object
   * @returns {boolean} True if valid Excel file
   */
  static isValidExcelFile(file) {
    try {
      if (!file) {
        return false;
      }

      const ext = file.name.split(".").pop().toLowerCase();
      const validExtensions = ["xlsx", "xls", "xlsm", "xlsb"];

      return validExtensions.includes(ext);
    } catch (error) {
      return false;
    }
  }
}

export default ExcelReader;
