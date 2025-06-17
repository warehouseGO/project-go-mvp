const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");

router.get("/", auth, userController.getUsers);
router.get("/pending", auth, userController.getPendingUsers);
router.put("/:id/approve", auth, userController.approveUser);
router.put("/:id/role", auth, userController.assignRole);
router.get("/hierarchy", auth, userController.getHierarchy);
router.post("/assign-subordinate", auth, userController.assignSubordinate);

module.exports = router;
