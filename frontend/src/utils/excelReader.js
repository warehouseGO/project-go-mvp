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

  /**
   * Parse a cell reference (e.g., "A5") into column index and row index
   * @param {string} cellRef - Cell reference like "A5", "B10", "AA1"
   * @returns {Object} { col: number, row: number } (0-indexed)
   */
  static parseCellRef(cellRef) {
    if (!cellRef || typeof cellRef !== "string") {
      throw new Error("Invalid cell reference");
    }

    const match = cellRef.toUpperCase().match(/^([A-Z]+)(\d+)$/);
    if (!match) {
      throw new Error(`Invalid cell reference format: ${cellRef}`);
    }

    const colLetters = match[1];
    const rowNumber = parseInt(match[2], 10);

    // Convert column letters to 0-indexed number (A=0, B=1, ..., Z=25, AA=26, etc.)
    let col = 0;
    for (let i = 0; i < colLetters.length; i++) {
      col = col * 26 + (colLetters.charCodeAt(i) - 64);
    }
    col -= 1; // Convert to 0-indexed

    return {
      col,
      row: rowNumber - 1, // Convert to 0-indexed
    };
  }

  /**
   * Convert column index to column letter(s)
   * @param {number} colIndex - 0-indexed column number
   * @returns {string} Column letter(s) like "A", "B", "AA"
   */
  static colIndexToLetter(colIndex) {
    let letter = "";
    let temp = colIndex + 1;
    while (temp > 0) {
      const remainder = (temp - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      temp = Math.floor((temp - 1) / 26);
    }
    return letter;
  }

  /**
   * Read value at a specific cell
   * @param {File} file - Excel file
   * @param {string} sheetName - Name of the sheet
   * @param {string} cellRef - Cell reference like "A5"
   * @returns {Promise<any>} Cell value
   */
  static async readCellValue(file, sheetName, cellRef) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(`Sheet "${sheetName}" not found`);
      }

      const worksheet = workbook.Sheets[sheetName];
      const cell = worksheet[cellRef.toUpperCase()];

      return cell ? cell.v : null;
    } catch (error) {
      throw new Error(`Failed to read cell: ${error.message}`);
    }
  }

  /**
   * Read manpower data from Excel using cell references for headers
   * Reads data from the row below the headers until designation is empty or "total"
   * @param {File} file - Excel file
   * @param {string} sheetName - Name of the sheet
   * @param {Object} headerCells - Object with cell references for each header
   * @param {string} headerCells.designation - Cell reference for Designation header (e.g., "A5")
   * @param {string} headerCells.dayshift - Cell reference for Day Shift header (e.g., "B5")
   * @param {string} headerCells.nightshift - Cell reference for Night Shift header (e.g., "C5")
   * @returns {Promise<Array>} Array of manpower entries
   */
  static async readManpowerData(file, sheetName, headerCells) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(`Sheet "${sheetName}" not found`);
      }

      const worksheet = workbook.Sheets[sheetName];

      // Parse header cell references
      const designationPos = this.parseCellRef(headerCells.designation);
      const dayshiftPos = this.parseCellRef(headerCells.dayshift);
      const nightshiftPos = this.parseCellRef(headerCells.nightshift);

      // Validate all headers are on the same row
      if (
        designationPos.row !== dayshiftPos.row ||
        designationPos.row !== nightshiftPos.row
      ) {
        throw new Error("All header cells must be on the same row");
      }

      const headerRow = designationPos.row;
      const designationCol = this.colIndexToLetter(designationPos.col);
      const dayshiftCol = this.colIndexToLetter(dayshiftPos.col);
      const nightshiftCol = this.colIndexToLetter(nightshiftPos.col);

      // Read data starting from the row below headers
      const entries = [];
      let currentRow = headerRow + 2; // +1 for 1-indexed, +1 for next row

      while (true) {
        // Read designation cell
        const designationCell = worksheet[`${designationCol}${currentRow}`];
        const designation = designationCell ? designationCell.v : null;

        // Stop conditions: empty or "total"
        if (
          !designation ||
          designation.toString().trim() === "" ||
          designation.toString().toLowerCase().includes("total")
        ) {
          break;
        }

        // Read shift values
        const dayshiftCell = worksheet[`${dayshiftCol}${currentRow}`];
        const nightshiftCell = worksheet[`${nightshiftCol}${currentRow}`];

        const dayshift = dayshiftCell ? parseInt(dayshiftCell.v) || 0 : 0;
        const nightshift = nightshiftCell ? parseInt(nightshiftCell.v) || 0 : 0;

        entries.push({
          designation: designation.toString().trim(),
          dayshift,
          nightshift,
        });

        currentRow++;

        // Safety limit to prevent infinite loops
        if (currentRow > 10000) {
          break;
        }
      }

      return entries;
    } catch (error) {
      throw new Error(`Failed to read manpower data: ${error.message}`);
    }
  }

  /**
   * Get raw data preview for a sheet (first N rows)
   * @param {File} file - Excel file
   * @param {string} sheetName - Name of the sheet
   * @param {number} maxRows - Maximum rows to return (default 20)
   * @returns {Promise<Array>} Array of arrays (raw data)
   */
  static async getSheetPreview(file, sheetName, maxRows = 20) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(`Sheet "${sheetName}" not found`);
      }

      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        raw: false,
      });

      return rawData.slice(0, maxRows);
    } catch (error) {
      throw new Error(`Failed to get sheet preview: ${error.message}`);
    }
  }
}

export default ExcelReader;
