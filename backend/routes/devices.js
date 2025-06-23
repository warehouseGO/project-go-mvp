const express = require("express");
const router = express.Router();
const deviceController = require("../controllers/deviceController");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

router.get(
  "/",
  auth,
  authorize("SITE_SUPERVISOR"),
  deviceController.getDevices
);
router.post(
  "/",
  auth,
  authorize("SITE_INCHARGE"),
  deviceController.createDevice
);
router.get("/:id", auth, deviceController.getDeviceDetails);
router.put(
  "/:id",
  auth,
  authorize("SITE_INCHARGE"),
  deviceController.updateDevice
);
router.delete(
  "/:id",
  auth,
  authorize("SITE_INCHARGE"),
  deviceController.deleteDevice
);
router.post(
  "/:id/assign",
  auth,
  authorize("SITE_SUPERVISOR"),
  deviceController.assignDevice
);

// Bulk assign devices to a site supervisor
router.post(
  "/assign-site-supervisor",
  auth,
  authorize("SITE_INCHARGE"),
  deviceController.assignDevicesToSiteSupervisor
);

// Bulk assign devices to a cluster supervisor
router.post(
  "/assign-cluster-supervisor",
  auth,
  authorize("SITE_SUPERVISOR"),
  deviceController.assignDevicesToClusterSupervisor
);

// Add jobs to a device
router.post(
  "/:id/jobs",
  auth,
  authorize("SITE_INCHARGE"),
  deviceController.addJobsToDevice
);

// Update a job for a device
router.put(
  "/jobs/:jobId",
  auth,
  authorize("SITE_INCHARGE"),
  deviceController.updateJob
);

// Delete a job from a device
router.delete(
  "/jobs/:jobId",
  auth,
  authorize("SITE_INCHARGE"),
  deviceController.deleteJob
);

module.exports = router;
