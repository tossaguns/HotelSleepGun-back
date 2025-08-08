const express = require("express");
const router = express.Router();
const buildingController = require("../../controllers/POS/building.controller");
const { verifyPartnerAuth } = require("../../middlewares/partnerAuth.middleware");

// สร้างตึกใหม่
router.post("/buildings", verifyPartnerAuth, buildingController.createBuilding);

// ดึงข้อมูลตึกทั้งหมด
router.get("/buildings", verifyPartnerAuth, buildingController.getAllBuildings);

// ดึงข้อมูลตึกตาม ID

router.get("/buildings/:id", verifyPartnerAuth, buildingController.getBuildingById);

// อัปเดตข้อมูลตึก
router.put("/buildings/:id", verifyPartnerAuth, buildingController.updateBuilding);

// ลบตึก
router.delete("/buildings/:id", verifyPartnerAuth, buildingController.deleteBuilding);

// เพิ่มชั้นในตึก
router.post("/:buildingId/floors", verifyPartnerAuth, buildingController.addFloorToBuilding);

// ลบชั้นจากตึก
router.delete("/:buildingId/floors/:floorName", verifyPartnerAuth, buildingController.removeFloorFromBuilding);

// อัปเดตชื่อชั้น
router.patch("/:buildingId/floors/:oldFloorName", verifyPartnerAuth, buildingController.updateFloorName);

// ดึงชั้นในตึก
router.get("/buildings/:buildingId/floors", verifyPartnerAuth, buildingController.getFloorsByBuilding);

module.exports = router;