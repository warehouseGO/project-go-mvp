const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

router.get(
  "/owner",
  auth,
  authorize("OWNER"),
  dashboardController.ownerDashboard
);
router.get(
  "/site-incharge/:siteId",
  auth,
  authorize(["SITE_INCHARGE", "OWNER"]),
  dashboardController.siteInChargeDashboard
);
router.get(
  "/site-supervisor",
  auth,
  authorize("SITE_SUPERVISOR"),
  dashboardController.siteSupervisorDashboard
);
router.get(
  "/cluster-supervisor",
  auth,
  authorize("CLUSTER_SUPERVISOR"),
  dashboardController.clusterSupervisorDashboard
);

module.exports = router;
