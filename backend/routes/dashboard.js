const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const auth = require("../middleware/auth");

router.get("/owner", auth, dashboardController.ownerDashboard);
router.get(
  "/site-incharge/:siteId",
  auth,
  dashboardController.siteInChargeDashboard
);
router.get(
  "/site-supervisor",
  auth,
  dashboardController.siteSupervisorDashboard
);
router.get(
  "/cluster-supervisor",
  auth,
  dashboardController.clusterSupervisorDashboard
);

module.exports = router;
