const express = require("express");
const router = express.Router();
const loginController = require("../../controllers/login/loginMember.controller");

router.post("/login", loginController.loginMember);

module.exports = router;
