const express = require("express");
const router = express.Router();
const aboutHotelController = require("../../controllers/POS/aboutHotel.controller");
const { verifyPartnerAuth } = require("../../middlewares/partnerAuth.middleware");

// ดึงข้อมูล about hotel
router.get("/about-hotel", verifyPartnerAuth, aboutHotelController.getAboutHotel);

// สร้างหรืออัปเดต about hotel (ถ้าไม่มีจะสร้างใหม่ ถ้ามีจะอัปเดต)
router.post("/about-hotel", verifyPartnerAuth, aboutHotelController.createOrUpdateAboutHotel);

// อัปเดต about hotel ตาม id
router.put("/about-hotel/:id", verifyPartnerAuth, aboutHotelController.updateAboutHotel);

// ลบ about hotel ตาม id
router.delete("/about-hotel/:id", verifyPartnerAuth, aboutHotelController.deleteAboutHotel);

module.exports = router;