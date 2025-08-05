const express = require("express");
const router = express.Router();
const {
  loginPartner,
} = require("../../controllers/login/loginPartner.controller");

router.post("/login", loginPartner);

module.exports = router;




