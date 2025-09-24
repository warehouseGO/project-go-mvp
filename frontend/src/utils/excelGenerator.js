import ExcelJS from "exceljs";
import headerImageUrl from "../assets/image.png?url";

// Helper: fetch URL and return base64 string (without data URL prefix)
async function urlToBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result || "";
      const base64 = String(result).split(",")[1] || "";
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Generate Excel report with charts for Site Analytics
 * @param {Object} siteData - Site data including devices and manpower
 * @param {Object} manpowerData - Manpower analytics data
 * @param {string} siteName - Name of the site
 * @param {Object} safetyData - Safety data for today
 * @param {Object} tbtData - TBT data for today
 * @returns {Promise<Blob>} Excel file blob
 */
export const generateSiteAnalyticsReport = async (
  siteData,
  manpowerData,
  siteName,
  safetyData = null,
  tbtData = null
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Site Analytics Report");

  // Set up worksheet properties
  worksheet.properties.defaultRowHeight = 20;

  // Header image in A1:C3
  try {
    const base64Logo = await urlToBase64(headerImageUrl);
    const logoId = workbook.addImage({ base64: base64Logo, extension: "png" });
    worksheet.addImage(logoId, {
      tl: { col: 0, row: 0 },
      br: { col: 3, row: 3 },
    });
  } catch (e) {
    // Non-fatal if image fails
    console.warn("Failed to load header image", e);
  }

  // Title merged in A3:N3
  worksheet.mergeCells("A2:N3");
  worksheet.getCell("A2").value = `SD Bird's Eye View -  ${siteName}`;
  worksheet.getCell("A2").font = { size: 18, bold: true };
  worksheet.getCell("A2").alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  // Today's date in N1
  worksheet.getCell("N1").value = new Date().toLocaleDateString();
  worksheet.getCell("N1").alignment = { horizontal: "right" };

  // Adjust header row heights
  worksheet.getRow(1).height = 22;
  worksheet.getRow(2).height = 16; // thinner
  worksheet.getRow(3).height = 16; // thinner
  worksheet.getRow(4).height = 28; // taller
  worksheet.getRow(31).height = 22; // taller
  worksheet.getRow(32).height = 22; // taller
  worksheet.getRow(33).height = 22; // taller
  worksheet.getRow(34).height = 22; // taller
  worksheet.getRow(35).height = 22; // taller

  // SD Progress row
  worksheet.getCell("A4").value = "SD Progress";
  worksheet.getCell("A4").font = { bold: true };
  worksheet.mergeCells("B4:M4");

  // Calculate completed shutdown percentage = completed devices / total devices
  const totalDevicesForPct = siteData?.devices?.length || 0;
  const completedDevicesForPct =
    siteData?.devices?.filter((d) => d.status === "COMPLETED").length || 0;
  const completedPct =
    totalDevicesForPct > 0 ? completedDevicesForPct / totalDevicesForPct : 0;

  const pctCell = worksheet.getCell("B4");
  pctCell.value = completedPct;
  pctCell.numFmt = "0.0%";
  pctCell.font = { bold: true };
  pctCell.alignment = { horizontal: "center", vertical: "middle" };
  // Light gray background
  pctCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE5E7EB" },
  };

  // Chart titles will be embedded inside the images themselves

  // Set row heights for chart areas
  for (let i = 6; i <= 19; i++) {
    worksheet.getRow(i).height = 25;
  }

  // Set column widths
  worksheet.getColumn("A").width = 15;
  worksheet.getColumn("B").width = 15;
  worksheet.getColumn("C").width = 15;
  worksheet.getColumn("D").width = 15;
  worksheet.getColumn("E").width = 15;
  worksheet.getColumn("F").width = 15;
  worksheet.getColumn("G").width = 15;
  worksheet.getColumn("H").width = 15;
  worksheet.getColumn("I").width = 15;
  worksheet.getColumn("J").width = 15;
  worksheet.getColumn("K").width = 15;
  worksheet.getColumn("L").width = 2;
  worksheet.getColumn("M").width = 15;
  worksheet.getColumn("N").width = 30;

  // Constraint Report header (merge M5:N5)
  worksheet.mergeCells("M5:N5");
  const constraintHeader = worksheet.getCell("M5");
  constraintHeader.value = "Constraint Report";
  constraintHeader.font = { bold: true };
  constraintHeader.alignment = { horizontal: "center" };
  constraintHeader.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // Subheadings
  const tagNoHeader = worksheet.getCell("M6");
  tagNoHeader.value = "TagNo";
  tagNoHeader.font = { bold: true };
  tagNoHeader.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  const commentHeader = worksheet.getCell("N6");
  commentHeader.value = "Comment";
  commentHeader.font = { bold: true };
  commentHeader.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // Prepare top 13 constraint devices by priority and recency using existing siteData
  const constrainedDevices = (siteData?.devices || [])
    .filter((d) => d.status === "CONSTRAINT")
    .sort((a, b) => {
      const pr = (b.priority || 0) - (a.priority || 0);
      if (pr !== 0) return pr;
      const bu = new Date(b.updatedAt || b.createdAt || 0).getTime();
      const au = new Date(a.updatedAt || a.createdAt || 0).getTime();
      return bu - au;
    })
    .slice(0, 13);

  // Fill rows M7..M19 and N7..N19
  constrainedDevices.forEach((device, idx) => {
    const row = 7 + idx; // 7..19
    // TagNo from serialNumber or name as fallback
    const tagNoCell = worksheet.getCell(`M${row}`);
    tagNoCell.value = device.serialNumber || device.name || "-";
    tagNoCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // Concatenate comments from constraint jobs
    const comments = (device.jobs || [])
      .filter((j) => j.status === "CONSTRAINT" && j.comment)
      .map((j) => j.comment)
      .filter(Boolean);
    const commentCell = worksheet.getCell(`N${row}`);
    commentCell.value = comments.length ? comments.join("; ") : "-";
    commentCell.alignment = { wrapText: true };
    commentCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Manpower Report section
  // Title merged in M21:N21
  worksheet.mergeCells("M21:N21");
  const manpowerHeader = worksheet.getCell("M21");
  manpowerHeader.value = "Manpower Report";
  manpowerHeader.font = { bold: true };
  manpowerHeader.alignment = { horizontal: "center" };
  manpowerHeader.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // Subheadings row M22, N22
  const designationHeader = worksheet.getCell("M22");
  designationHeader.value = "Designation";
  designationHeader.font = { bold: true };
  designationHeader.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  const numberHeader = worksheet.getCell("N22");
  numberHeader.value = "No.";
  numberHeader.font = { bold: true };
  numberHeader.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // Build designation counts from manpowerData (day + night for selected date)
  const designationRows = [];
  const designationData = manpowerData?.dateSpecificData?.designationData || [];
  designationData.forEach((item) => {
    const name = item?.designation || item?.name || "Unknown";
    const day = Number(item?.dayshift || 0);
    const night = Number(item?.nightshift || 0);
    designationRows.push({ designation: name, count: day + night });
  });
  // Sort by count desc
  designationRows.sort((a, b) => b.count - a.count);

  // Cap to 13 rows and aggregate the rest into "Other"
  const maxRows = 13;
  let topRows = designationRows.slice(0, maxRows);
  const remaining = designationRows.slice(maxRows);
  if (remaining.length > 0) {
    const otherCount = remaining.reduce((sum, r) => sum + (r.count || 0), 0);
    // Replace the last row with Other to keep total 13 rows
    // If we already have 13 rows, convert the last one into Other by adding its count
    if (topRows.length === maxRows) {
      const last = topRows[topRows.length - 1];
      const lastCount = last?.count || 0;
      topRows[topRows.length - 1] = {
        designation: "Other",
        count: otherCount + lastCount,
      };
    } else {
      topRows.push({ designation: "Other", count: otherCount });
    }
  }

  // Fill M23..M35 and N23..N35 with up to 13 rows
  topRows.forEach((rowData, idx) => {
    const rowNum = 23 + idx; // 23..35
    const designationCell = worksheet.getCell(`M${rowNum}`);
    designationCell.value = rowData.designation;
    designationCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    const countCell = worksheet.getCell(`N${rowNum}`);
    countCell.value = rowData.count;
    countCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Total row at 14th line of this section => row 36 (M36,N36)
  const totalManpower = designationRows.reduce(
    (sum, r) => sum + (r.count || 0),
    0
  );
  const totalDesignationCell = worksheet.getCell("M36");
  totalDesignationCell.value = "Total";
  totalDesignationCell.font = { bold: true };
  totalDesignationCell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  const totalCountCell = worksheet.getCell("N36");
  totalCountCell.value = totalManpower;
  totalCountCell.font = { bold: true };
  totalCountCell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // Generate charts
  await generateManpowerPieChart(workbook, worksheet, manpowerData);
  await generateDeviceStatusBarChart(workbook, worksheet, siteData);

  // Progress Highlights and Look Ahead Plan Section
  // Progress Highlights header (A21:D21)
  worksheet.mergeCells("A21:D21");
  const progressHeader = worksheet.getCell("A21");
  progressHeader.value = "Progress Highlights";
  progressHeader.font = { bold: true, size: 12 };
  progressHeader.alignment = { horizontal: "center" };
  progressHeader.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // Look Ahead Plan header (E21:L21)
  worksheet.mergeCells("E21:L21");
  const lookAheadHeader = worksheet.getCell("E21");
  lookAheadHeader.value = "Look Ahead Plan";
  lookAheadHeader.font = { bold: true, size: 12 };
  lookAheadHeader.alignment = { horizontal: "center" };
  lookAheadHeader.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // Look Ahead Plan sub-columns (E22:H22 and I22:L22)
  worksheet.mergeCells("E22:H22");
  const leftSubHeader = worksheet.getCell("E22");

  leftSubHeader.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  worksheet.mergeCells("I22:L22");
  const rightSubHeader = worksheet.getCell("I22");

  rightSubHeader.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // Progress Highlights rows (A23:D27) - 5 rows merged A:D
  for (let i = 0; i < 6; i++) {
    const row = 22 + i;
    worksheet.mergeCells(`A${row}:D${row}`);
    const progressCell = worksheet.getCell(`A${row}`);
    progressCell.value = ""; // Empty for now
    progressCell.alignment = { horizontal: "left", vertical: "top" };
  }

  // Look Ahead Plan left column rows (E23:H27) - 5 rows merged E:H
  for (let i = 0; i < 5; i++) {
    const row = 23 + i;
    worksheet.mergeCells(`E${row}:H${row}`);
    const leftCell = worksheet.getCell(`E${row}`);
    leftCell.value = ""; // Empty for now
    leftCell.alignment = { horizontal: "left", vertical: "top" };
    leftCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }

  // Look Ahead Plan right column rows (I23:L27) - 5 rows merged I:L
  for (let i = 0; i < 5; i++) {
    const row = 23 + i;
    worksheet.mergeCells(`I${row}:L${row}`);
    const rightCell = worksheet.getCell(`I${row}`);
    rightCell.value = ""; // Empty for now
    rightCell.alignment = { horizontal: "left", vertical: "top" };
    rightCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }

  // Safety Section
  // Title merged in A29:L29
  worksheet.mergeCells("A29:L29");
  const safetyHeader = worksheet.getCell("A29");
  safetyHeader.value = "Safety Section";
  safetyHeader.font = { bold: true, size: 14 };
  safetyHeader.alignment = { horizontal: "center" };
  // Add border around title
  safetyHeader.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // Subheadings row 30
  worksheet.mergeCells("A30:D30");
  const tbtHeader = worksheet.getCell("A30");
  tbtHeader.value = "TBT Topic";
  tbtHeader.font = { bold: true };
  tbtHeader.alignment = { horizontal: "left" };
  tbtHeader.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  worksheet.mergeCells("E30:H30");
  const obsHeader = worksheet.getCell("E30");
  obsHeader.value = "Observations";
  obsHeader.font = { bold: true };
  obsHeader.alignment = { horizontal: "center" };
  obsHeader.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  const safetyHeader2 = worksheet.getCell("I30");
  worksheet.mergeCells("I30:L30");
  safetyHeader2.value = "Safety Record";
  safetyHeader2.font = { bold: true };
  safetyHeader2.alignment = { horizontal: "center" };
  safetyHeader2.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // TBT Topic fields and observations (rows 31-35)
  const tbtFields = [
    { key: "specificPPE", label: "Specific PPE" },
    { key: "housekeeping", label: "Housekeeping" },
    { key: "plantEquipmentSafety", label: "Plant Equipment Safety" },
    { key: "workingUnderSuspendedLoad", label: "Working Under Suspended Load" },
    { key: "importantOfEyeShower", label: "Importance of Eye Shower" },
  ];

  tbtFields.forEach((field, index) => {
    const row = 31 + index;
    // TBT Topic field name
    worksheet.mergeCells(`A${row}:D${row}`);
    const tbtFieldCell = worksheet.getCell(`A${row}`);
    tbtFieldCell.value = field.label;
    tbtFieldCell.alignment = { horizontal: "left" };
    tbtFieldCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // Observations from TBT data
    worksheet.mergeCells(`E${row}:H${row}`);
    const obsCell = worksheet.getCell(`E${row}`);
    const observation = tbtData?.[field.key] || "";
    obsCell.value = observation;
    obsCell.alignment = {
      horizontal: "left",
      wrapText: true,
    };
    obsCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Safety Record fields and values (rows 31-35)
  const safetyFields = [
    { key: "nearmiss", label: "Near Miss" },
    { key: "firstaid", label: "First Aid" },
    { key: "lti", label: "LTI" },
    { key: "fireincidents", label: "Fire Incidents" },
    { key: "auditsConducted", label: "Audits Conducted" },
  ];

  safetyFields.forEach((field, index) => {
    const row = 31 + index;
    // Safety field name - only in column I
    const safetyFieldCell = worksheet.getCell(`I${row}`);
    safetyFieldCell.value = field.label;
    safetyFieldCell.alignment = { horizontal: "left" };
    safetyFieldCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // Safety value from Safety data - merge J:K
    worksheet.mergeCells(`J${row}:K${row}`);
    const safetyValueCell = worksheet.getCell(`J${row}`);
    const value = safetyData?.[field.key] || 0;
    safetyValueCell.value = value;
    safetyValueCell.alignment = { horizontal: "center" };
    safetyValueCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Add Incident Report field in the last row (row 35)
  const incidentFieldCell = worksheet.getCell("I36");
  incidentFieldCell.value = "Incident Report";
  incidentFieldCell.alignment = { horizontal: "left" };
  incidentFieldCell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  worksheet.mergeCells("J36:K36");
  const incidentValueCell = worksheet.getCell("J36");
  const incidentReportValue = safetyData?.incidentReport || 0;
  incidentValueCell.value = incidentReportValue;
  incidentValueCell.alignment = { horizontal: "center" };
  incidentValueCell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

/**
 * Generate manpower pie chart and add as image to worksheet
 */
const generateManpowerPieChart = async (workbook, worksheet, manpowerData) => {
  // Create a canvas element for the chart
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext("2d");

  // Fill white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Get manpower data
  const dayShift =
    manpowerData?.dateSpecificData?.shiftComparison?.dayshift || 0;
  const nightShift =
    manpowerData?.dateSpecificData?.shiftComparison?.nightshift || 0;

  // Draw chart title inside image
  ctx.fillStyle = "#111827"; // Gray-900
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Today's Manpower Distribution", canvas.width / 2, 30);

  // Draw pie chart (add more bottom whitespace to reduce oval appearance when placed)
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2 + 10; // slightly less vertical shift
  const radius = Math.min(centerX, canvas.height * 0.4) - 10; // smaller radius to add padding

  const total = dayShift + nightShift;
  if (total === 0) {
    // Draw empty state
    ctx.fillStyle = "#f3f4f6";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = "#6b7280";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("No Data Available", centerX, centerY);
  } else {
    // Draw pie slices
    let currentAngle = 0;

    // Day Shift slice (orange)
    const dayShiftAngle = (dayShift / total) * 2 * Math.PI;
    ctx.fillStyle = "#f59e0b"; // Orange
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(
      centerX,
      centerY,
      radius,
      currentAngle,
      currentAngle + dayShiftAngle
    );
    ctx.closePath();
    ctx.fill();
    currentAngle += dayShiftAngle;

    // Night Shift slice (blue)
    const nightShiftAngle = (nightShift / total) * 2 * Math.PI;
    ctx.fillStyle = "#3b82f6"; // Blue
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(
      centerX,
      centerY,
      radius,
      currentAngle,
      currentAngle + nightShiftAngle
    );
    ctx.closePath();
    ctx.fill();

    // Add labels (inside slices)
    ctx.fillStyle = "#ffffff"; // White text
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";

    // Day Shift label
    const dayShiftLabelAngle = dayShiftAngle / 2;
    const dayShiftLabelX =
      centerX + Math.cos(dayShiftLabelAngle) * (radius * 0.7);
    const dayShiftLabelY =
      centerY + Math.sin(dayShiftLabelAngle) * (radius * 0.7);
    ctx.fillText(`Day: ${dayShift}`, dayShiftLabelX, dayShiftLabelY);

    // Night Shift label
    const nightShiftLabelAngle = dayShiftAngle + nightShiftAngle / 2;
    const nightShiftLabelX =
      centerX + Math.cos(nightShiftLabelAngle) * (radius * 0.7);
    const nightShiftLabelY =
      centerY + Math.sin(nightShiftLabelAngle) * (radius * 0.7);
    ctx.fillText(`Night: ${nightShift}`, nightShiftLabelX, nightShiftLabelY);
  }

  // Draw border around image area
  ctx.strokeStyle = "#e5e7eb"; // Gray-200
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  // Convert canvas to base64 image
  const imageData = canvas.toDataURL("image/png");

  // Add image to worksheet (A5:C19)
  const imageId = workbook.addImage({
    base64: imageData.split(",")[1],
    extension: "png",
  });

  worksheet.addImage(imageId, {
    tl: { col: 0, row: 4 }, // A5
    br: { col: 3, row: 18 }, // C19
  });
};

/**
 * Generate device status horizontal bar chart and add as image to worksheet
 */
const generateDeviceStatusBarChart = async (workbook, worksheet, siteData) => {
  // Create a canvas element for the chart
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 300;
  const ctx = canvas.getContext("2d");

  // Fill white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Calculate device status by type
  const deviceTypeStatus = {};
  siteData.devices?.forEach((device) => {
    if (!deviceTypeStatus[device.type]) {
      deviceTypeStatus[device.type] = {
        COMPLETED: 0,
        IN_PROGRESS: 0,
        PENDING: 0,
        CONSTRAINT: 0,
        TOTAL: 0,
      };
    }
    deviceTypeStatus[device.type][device.status]++;
    deviceTypeStatus[device.type].TOTAL++;
  });

  const deviceTypes = Object.keys(deviceTypeStatus);
  if (deviceTypes.length === 0) {
    // Draw empty state
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#6b7280";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "No Device Data Available",
      canvas.width / 2,
      canvas.height / 2
    );
  } else {
    // Chart dimensions
    const margin = { top: 50, right: 20, bottom: 60, left: 100 }; // Increased top margin for title
    const chartWidth = canvas.width - margin.left - margin.right;
    const chartHeight = canvas.height - margin.top - margin.bottom;
    const barHeight = Math.min(30, chartHeight / deviceTypes.length);

    // Colors for status
    const statusColors = {
      COMPLETED: "#10b981",
      IN_PROGRESS: "#3b82f6",
      PENDING: "#f59e0b",
      CONSTRAINT: "#ef4444",
    };

    // Draw chart title inside image
    ctx.fillStyle = "#111827"; // Gray-900
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Device Status by Type (Stacked %)", canvas.width / 2, 30);

    // Draw bars for each device type
    deviceTypes.forEach((deviceType, index) => {
      const y = margin.top + index * (barHeight + 10);
      const data = deviceTypeStatus[deviceType];

      // Calculate percentages
      const completedPercent = (data.COMPLETED / data.TOTAL) * 100;
      const inProgressPercent = (data.IN_PROGRESS / data.TOTAL) * 100;
      const pendingPercent = (data.PENDING / data.TOTAL) * 100;
      const constraintPercent = (data.CONSTRAINT / data.TOTAL) * 100;

      // Draw stacked horizontal bars
      let currentX = margin.left;

      // Completed
      const completedWidth = (completedPercent / 100) * chartWidth;
      ctx.fillStyle = statusColors.COMPLETED;
      ctx.fillRect(currentX, y, completedWidth, barHeight);
      currentX += completedWidth;

      // In Progress
      const inProgressWidth = (inProgressPercent / 100) * chartWidth;
      ctx.fillStyle = statusColors.IN_PROGRESS;
      ctx.fillRect(currentX, y, inProgressWidth, barHeight);
      currentX += inProgressWidth;

      // Pending
      const pendingWidth = (pendingPercent / 100) * chartWidth;
      ctx.fillStyle = statusColors.PENDING;
      ctx.fillRect(currentX, y, pendingWidth, barHeight);
      currentX += pendingWidth;

      // Constraint
      const constraintWidth = (constraintPercent / 100) * chartWidth;
      ctx.fillStyle = statusColors.CONSTRAINT;
      ctx.fillRect(currentX, y, constraintWidth, barHeight);

      // Add device type label
      ctx.fillStyle = "#000000";
      ctx.font = "12px Arial";
      ctx.textAlign = "right";
      ctx.fillText(deviceType, margin.left - 10, y + barHeight / 2 + 4);

      // Add percentage labels on bars
      ctx.fillStyle = "#000000";
      ctx.font = "10px Arial";
      ctx.textAlign = "center";

      if (completedPercent > 5) {
        ctx.fillText(
          `${completedPercent.toFixed(1)}%`,
          margin.left + completedWidth / 2,
          y + barHeight / 2 + 3
        );
      }
      if (inProgressPercent > 5) {
        ctx.fillText(
          `${inProgressPercent.toFixed(1)}%`,
          margin.left + completedWidth + inProgressWidth / 2,
          y + barHeight / 2 + 3
        );
      }
      if (pendingPercent > 5) {
        ctx.fillText(
          `${pendingPercent.toFixed(1)}%`,
          margin.left + completedWidth + inProgressWidth + pendingWidth / 2,
          y + barHeight / 2 + 3
        );
      }
      if (constraintPercent > 5) {
        ctx.fillText(
          `${constraintPercent.toFixed(1)}%`,
          margin.left +
            completedWidth +
            inProgressWidth +
            pendingWidth +
            constraintWidth / 2,
          y + barHeight / 2 + 3
        );
      }
    });

    // Add legend
    const legendY = margin.top + deviceTypes.length * (barHeight + 10) + 30;
    const legendItems = [
      { label: "Completed", color: statusColors.COMPLETED },
      { label: "In Progress", color: statusColors.IN_PROGRESS },
      { label: "Pending", color: statusColors.PENDING },
      { label: "Constraint", color: statusColors.CONSTRAINT },
    ];

    legendItems.forEach((item, index) => {
      const x = margin.left + index * 150;
      ctx.fillStyle = item.color;
      ctx.fillRect(x, legendY, 15, 15);

      ctx.fillStyle = "#000000";
      ctx.font = "12px Arial";
      ctx.textAlign = "left";
      ctx.fillText(item.label, x + 20, legendY + 12);
    });
  }

  // Draw border around image area
  ctx.strokeStyle = "#e5e7eb"; // Gray-200
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  // Convert canvas to base64 image
  const imageData = canvas.toDataURL("image/png");

  // Add image to worksheet (D5:L19)
  const imageId = workbook.addImage({
    base64: imageData.split(",")[1],
    extension: "png",
  });

  worksheet.addImage(imageId, {
    tl: { col: 3, row: 4 }, // D5
    br: { col: 11, row: 18 }, // L19
  });
};
