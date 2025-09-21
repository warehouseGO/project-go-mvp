const express = require("express");
const router = express.Router();
const {
  getManpowerAnalytics,
  getManpowerData,
  createManpowerEntry,
  updateManpowerEntry,
  deleteManpowerEntry,
  bulkUpdateManpower,
} = require("../controllers/manpowerController");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

// Get comprehensive manpower data for a site (analytics + recent entries + designations)
router.get(
  "/sites/:siteId/data",
  auth,
  authorize(["SITE_INCHARGE", "OWNER"]),
  getManpowerData
);

// Legacy analytics endpoint - redirects to main data endpoint
router.get(
  "/sites/:siteId/analytics",
  auth,
  authorize(["SITE_INCHARGE", "OWNER"]),
  getManpowerAnalytics
);

// Create manpower entry
router.post(
  "/sites/:siteId/entries",
  auth,
  authorize(["SITE_INCHARGE", "OWNER"]),
  createManpowerEntry
);

// Update manpower entry
router.put(
  "/entries/:entryId",
  auth,
  authorize(["SITE_INCHARGE", "OWNER"]),
  updateManpowerEntry
);

// Delete manpower entry
router.delete(
  "/entries/:entryId",
  auth,
  authorize(["SITE_INCHARGE", "OWNER"]),
  deleteManpowerEntry
);

// Bulk update manpower for a specific date
router.post(
  "/sites/:siteId/bulk",
  auth,
  authorize(["SITE_INCHARGE", "OWNER"]),
  bulkUpdateManpower
);

module.exports = router;
