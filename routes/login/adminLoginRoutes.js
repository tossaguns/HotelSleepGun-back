const express = require("express");
const router = express.Router();
const adminLogin = require("../../controllers/login/loginAdmin.controller");

router.post("/login", adminLogin.loginAdmin);

module.exports = router;             