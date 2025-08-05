const express = require("express");
const router = express.Router();
const auth = require("../controllers/registerLogin.controller");

router.post("/google", auth.googleLogin);
router.post("/facebook", auth.facebookLogin);
router.post("/line", auth.lineLogin);

module.exports = router;
