const express = require("express");
const router = express.Router();
const adminLogin = require("../../controllers/user/admin.controller");
const adminController = require("../../controllers/user/admin.controller");
const {authenticate} = require("../../middlewares/adminAuth.middleware");



router.post("/create", adminLogin.createAdmin);
router.get("/getAll", adminLogin.getAdmins);
router.get("/get/:id", adminLogin.getAdminById);
router.get("/getLogin/:id", authenticate, adminController.getAdminById);
router.put("/update", adminLogin.updateAdmin);
router.delete("/deleteAll", adminLogin.deleteAdmin);

module.exports = router;
