const express = require("express");
const router = express.Router();
const siteController = require("../controllers/siteController");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

router.get("/", auth, siteController.getSites);
router.post("/", auth, authorize("OWNER"), siteController.createSite);
router.get("/:id", auth, siteController.getSiteDetails);
router.put("/:id", auth, siteController.updateSite);
router.post(
  "/full-assign",
  auth,
  authorize("OWNER"),
  siteController.fullAssignSite
);

module.exports = router;
