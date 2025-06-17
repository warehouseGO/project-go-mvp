const express = require("express");
const router = express.Router();
const deviceController = require("../controllers/deviceController");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

router.get("/", auth, deviceController.getDevices);
router.post(
  "/",
  auth,
  authorize("SITE_INCHARGE"),
  deviceController.createDevice
);
router.get("/:id", auth, deviceController.getDeviceDetails);
router.put("/:id", auth, deviceController.updateDevice);
router.delete("/:id", auth, deviceController.deleteDevice);
router.post("/:id/assign", auth, deviceController.assignDevice);

module.exports = router;
