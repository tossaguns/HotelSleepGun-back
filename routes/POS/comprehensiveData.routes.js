const express = require("express");
const router = express.Router();
const comprehensiveDataController = require("../../controllers/POS/comprehensiveData.controller");
const { verifyPartnerAuth } = require("../../middlewares/partnerAuth.middleware");

// ดึงข้อมูลทั้งหมดที่เกี่ยวข้องกับ partner
router.get("/comprehensive-data", verifyPartnerAuth, comprehensiveDataController.getComprehensiveData);

module.exports = router;