// routes/universalLogin.route.js
const express = require("express");
const router = express.Router();
const { loginUniversal } = require("../../controllers/login/universalLogin.controller");

router.post("/login", loginUniversal);

module.exports = router;
