const express = require("express");
const router = express.Router();
const loginController = require("../../controllers/login/loginEmployee.controller");

router.post("/login", loginController.loginEmployee);

router.post("/createLogin", loginController.createLogin);
router.get("/getall", loginController.getAllLogins);
router.get("/get/:employeeCode", loginController.getLoginsByEmployeeCode);
router.put("/update/:id", loginController.updateLogin);
router.delete("/delete/:id", loginController.deleteLogin);
router.delete("/deleteAll", loginController.deleteAllLogins);

module.exports = router;
