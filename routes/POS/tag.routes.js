const express = require("express");
const router = express.Router();
const tagController = require("../../controllers/POS/tag.controller");
const { verifyPartnerAuth } = require("../../middlewares/partnerAuth.middleware");

// สร้างแท็กใหม่
router.post("/tags", verifyPartnerAuth, tagController.createTag);

// ดึงข้อมูลแท็กทั้งหมด
router.get("/tags", verifyPartnerAuth, tagController.getAllTags);

// ดึงข้อมูลแท็กตาม ID
router.get("/tags/:id", verifyPartnerAuth, tagController.getTagById);

// อัปเดตแท็ก
router.put("/tags/:id", verifyPartnerAuth, tagController.updateTag);

// ลบแท็กตาม ID
router.delete("/tags/:id", verifyPartnerAuth, tagController.deleteTagById);

// ลบแท็กทั้งหมด
router.delete("/tags", verifyPartnerAuth, tagController.deleteAllTags);

module.exports = router;