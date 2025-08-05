const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/uploadEmployee"); // middleware multer
const employeeCtrl = require("../../controllers/user/employee.controller");
const { verifyToken } = require('../../middlewares/auth.middleware');

// login
router.post("/login", employeeCtrl.loginEmployee);

// CRUD
router.post("/create", verifyToken, upload.single("imageIden"), employeeCtrl.createEmployee);
router.get("/getAll", verifyToken, employeeCtrl.getAllEmployees);
router.get("/get:id", verifyToken, employeeCtrl.getEmployeeById);
router.put("/update:id", verifyToken, upload.single("imageIden"), employeeCtrl.updateEmployee);
router.delete("/delete:id", verifyToken, employeeCtrl.deleteEmployeeById);
router.delete("/deleteAll", verifyToken, employeeCtrl.deleteAllEmployees);

// อัปเดต password ของ employee ที่เป็น plain text
router.post("/updatePasswords", employeeCtrl.updatePlainTextPasswords);

module.exports = router;