# How shutdown workbooks shaped WarehouseGO

A shutdown planner needs an equipment scope before work begins and a progress report once crews are on site. The scope workbooks the team reviewed used separate tabs for equipment such as vessels and heat exchangers. Each row carried an equipment tag, technical specifications, and columns indicating which jobs applied. Daily reports grouped progress by equipment type and tracked blockers and day- and night-shift headcounts.

## Product decisions

**Bring in the worklist one equipment type at a time.** The importer lets a site lead select a sheet, configure its header rows, and map columns before previewing the records. It can combine multiple columns into the equipment tag. A selected scope column marked `Y` or `YES` becomes a job for that device. Specifications go into the device’s JSON attributes, so a vessel and a heat exchanger can carry different fields without a database schema change. [Equipment importer](../frontend/src/components/common/ExcelImportTab.jsx) · [Workbook parser](../frontend/src/utils/excelReader.js)

**Keep the shift update with the assigned work.** In testing, a missing constraint reason prompted a follow-up. In the MVP, a cluster supervisor updates the job from the equipment row, and the API requires a comment when the job is marked as blocked. The site report presents that comment with the updater, timestamp, and equipment priority. A database trigger rolls the job statuses up to the device so the dashboard reflects the same blocker. [Job controller](../backend/controllers/jobController.js) · [Site constraint report](../backend/controllers/constraintController.js)

**Keep Excel as a reporting output.** The reporting brief called for a familiar summary and manpower format. The site analytics export combines equipment progress, constraints, shift headcounts, safety figures, and toolbox talk notes in one worksheet. Manpower records use the same designation and day/night split as the source reports. [Excel report generator](../frontend/src/utils/excelGenerator.js) · [Manpower and safety models](../backend/prisma/schema.prisma)

## Field demo and follow-up

In October 2025, a team member demonstrated WarehouseGO during an active shutdown using the ongoing job list and report generation. The team’s debrief reported that the familiar terminology and report formats helped the audience follow the demo. The feedback also identified friction around manpower and scaffolding uploads, surfacing constraints more directly, and selecting job-scope columns in bulk.

The current equipment importer offers bulk selection for attribute columns and individual checkboxes for job-scope columns. The manpower importer lets users select a sheet and point to the designation and shift headers, then previews the headcounts for a selected date. Both workflows depend on the shape of the selected worksheet. [Equipment column mapping](../frontend/src/components/common/DeviceFieldMapper.jsx) · [Manpower import](../frontend/src/components/common/ManpowerExcelImport.jsx)

[Back to the product walkthrough](../README.md#product-walkthrough)
