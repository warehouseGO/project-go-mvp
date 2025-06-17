const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

router.get("/", auth, jobController.getJobs);
router.post("/", auth, authorize("SITE_INCHARGE"), jobController.createJobs);
router.put(
  "/:id/status",
  auth,
  authorize("CLUSTER_SUPERVISOR"),
  jobController.updateJobStatus
);

module.exports = router;
