const express = require("express");
const router = express.Router();
const {
  getPreSDJobs,
  getPreSDJob,
  createPreSDJob,
  updatePreSDJob,
  deletePreSDJob,
  bulkCreatePreSDJobs,
  getPreSDJobStats,
} = require("../controllers/presdJobController");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

// Get PreSD jobs for a site (with pagination and filters)
router.get(
  "/sites/:siteId/jobs",
  auth,
  authorize(["SITE_INCHARGE", "OWNER"]),
  getPreSDJobs
);

// Get PreSD job statistics for a site
router.get(
  "/sites/:siteId/jobs/stats",
  auth,
  authorize(["SITE_INCHARGE", "OWNER"]),
  getPreSDJobStats
);

// Get single PreSD job
router.get(
  "/jobs/:jobId",
  auth,
  authorize(["SITE_INCHARGE", "OWNER"]),
  getPreSDJob
);

// Create new PreSD job
router.post(
  "/sites/:siteId/jobs",
  auth,
  authorize(["SITE_INCHARGE", "OWNER"]),
  createPreSDJob
);

// Update PreSD job
router.put(
  "/jobs/:jobId",
  auth,
  authorize(["SITE_INCHARGE", "OWNER"]),
  updatePreSDJob
);

// Delete PreSD job
router.delete(
  "/jobs/:jobId",
  auth,
  authorize(["SITE_INCHARGE", "OWNER"]),
  deletePreSDJob
);

// Bulk create PreSD jobs from Excel import
router.post(
  "/sites/:siteId/jobs/bulk",
  auth,
  authorize(["SITE_INCHARGE", "OWNER"]),
  bulkCreatePreSDJobs
);

module.exports = router;
