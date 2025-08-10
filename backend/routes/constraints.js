const express = require("express");
const router = express.Router();
const constraintController = require("../controllers/constraintController");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

// Get constraint report for a specific site
router.get(
  "/report/:siteId",
  auth,
  authorize(["SITE_INCHARGE", "OWNER"]),
  constraintController.getSiteConstraintReport
);

// Get constraint report for all sites (Owner only)
router.get(
  "/report/all",
  auth,
  authorize("OWNER"),
  constraintController.getAllSitesConstraintReport
);

module.exports = router;
