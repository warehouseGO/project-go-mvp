const express = require("express");
const router = express.Router();
const resourceController = require("../controllers/resourceController");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

// List resources (Owner: all, Site In-Charge: only their site)
router.get(
  "/",
  auth,
  authorize(["OWNER", "SITE_INCHARGE"]),
  resourceController.getResources
);

// Add resource (Owner only)
router.post("/", auth, authorize("OWNER"), resourceController.createResource);

// Edit resource (Owner only)
router.put("/:id", auth, authorize("OWNER"), resourceController.updateResource);

// Delete resource (Owner only)
router.delete(
  "/:id",
  auth,
  authorize("OWNER"),
  resourceController.deleteResource
);

// Bulk allocate resources (Owner only)
router.post(
  "/allocate",
  auth,
  authorize("OWNER"),
  resourceController.allocateResources
);

// Site In-Charge: update status/dispatchDate
router.put(
  "/:id/status",
  auth,
  authorize("SITE_INCHARGE"),
  resourceController.updateResourceStatus
);

module.exports = router;
