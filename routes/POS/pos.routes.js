const express = require("express");
const router = express.Router();
const posController = require("../../controllers/POS/pos.controller");
const { verifyPartnerAuth } = require("../../middlewares/partnerAuth.middleware");

// ==================== POS ROUTES ====================
// ดึงข้อมูล POS สรุป (ต้องอยู่ก่อน /pos/:id)
router.get("/pos-summary", verifyPartnerAuth, posController.getPosSummary);

// ดึงข้อมูล POS ทั้งหมด (ต้องอยู่ก่อน /pos/:id)
router.get("/pos", verifyPartnerAuth, posController.getAllPos);

// สร้าง POS ใหม่
router.post("/pos", verifyPartnerAuth, posController.createPos);

// อัปเดตข้อมูล POS
router.put("/pos/:id", verifyPartnerAuth, posController.updatePos);

// ลบ POS
router.delete("/pos/:id", verifyPartnerAuth, posController.deletePos);

// ลบ POS ทั้งหมด
router.delete("/pos", verifyPartnerAuth, posController.deleteAllPos);

// ดึงข้อมูล POS ตาม ID (ต้องอยู่หลัง routes อื่นๆ)
router.get("/pos/:id", verifyPartnerAuth, posController.getPosById);


module.exports = router;


// const express = require("express");
// const router = express.Router();
// const posController = require("../../controllers/POS/pos.controller");
// const { verifyPartnerAuth } = require("../../middlewares/partnerAuth.middleware");

// // ==================== POS ROUTES ====================
// // ดึงข้อมูล POS สรุป (ต้องอยู่ก่อน /pos/:id)
// router.get("/pos-summary", verifyPartnerAuth, posController.getPosSummary);

// // ดึงข้อมูล POS ทั้งหมด (ต้องอยู่ก่อน /pos/:id)
// router.get("/pos", verifyPartnerAuth, posController.getAllPos);

// // สร้าง POS ใหม่
// router.post("/pos", verifyPartnerAuth, posController.createPos);

// // อัปเดตข้อมูล POS
// router.put("/pos/:id", verifyPartnerAuth, posController.updatePos);

// // ลบ POS
// router.delete("/pos/:id", verifyPartnerAuth, posController.deletePos);

// // ลบ POS ทั้งหมด
// router.delete("/pos", verifyPartnerAuth, posController.deleteAllPos);

// // ดึงข้อมูล POS ตาม ID (ต้องอยู่หลัง routes อื่นๆ)
// router.get("/pos/:id", verifyPartnerAuth, posController.getPosById);

// // ==================== BUILDING ROUTES ====================
// // สร้างตึกใหม่
// router.post("/buildings", verifyPartnerAuth, posController.createBuilding);

// // ดึงข้อมูลตึกทั้งหมด
// router.get("/buildings", verifyPartnerAuth, posController.getAllBuildings);

// // ดึงข้อมูลตึกตาม ID
// router.get("/buildings/:id", verifyPartnerAuth, posController.getBuildingById);

// // อัปเดตข้อมูลตึก
// router.put("/buildings/:id", verifyPartnerAuth, posController.updateBuilding);

// // ลบตึก
// router.delete("/buildings/:id", verifyPartnerAuth, posController.deleteBuilding);

// // เพิ่มชั้นในตึก
// router.post("/buildings/:buildingId/floors", verifyPartnerAuth, posController.addFloorToBuilding);

// // ลบชั้นจากตึก
// router.delete("/buildings/:buildingId/floors/:floorName", verifyPartnerAuth, posController.removeFloorFromBuilding);

// // อัปเดตชื่อชั้น
// router.patch("/buildings/:buildingId/floors/:oldFloorName", verifyPartnerAuth, posController.updateFloorName);

// // ดึงชั้นในตึก
// router.get("/buildings/:buildingId/floors", verifyPartnerAuth, posController.getFloorsByBuilding);

// // ==================== ROOM ROUTES ====================
// // ดึงตัวเลือกสถานะ (ต้องอยู่ก่อน /rooms/:id)
// router.get("/rooms/status-options", verifyPartnerAuth, posController.getStatusOptions);

// // ดึงข้อมูลโควต้า SleepGun (ต้องอยู่ก่อน /rooms/:id)
// router.get("/rooms/sleepgun-quota", verifyPartnerAuth, posController.getSleepGunQuota);

// // สร้างห้องพัก
// router.post("/rooms", verifyPartnerAuth, posController.createRoom);

// // ดึงข้อมูลห้องพักทั้งหมด
// router.get("/rooms", verifyPartnerAuth, posController.getAllRooms);

// // ดึงข้อมูลห้องพักตามชั้น
// router.get("/rooms/floor/:floor", verifyPartnerAuth, posController.getRoomsByFloor);

// // ดึงข้อมูลห้องพักตามตึกและชั้น
// router.get("/buildings/:buildingId/floors/:floor/rooms", verifyPartnerAuth, posController.getRoomsByBuildingAndFloor);

// // ลบห้องพักทั้งหมด
// router.delete("/rooms", verifyPartnerAuth, posController.deleteAllRooms);

// // อัปเดตสถานะห้องพัก (SleepGunWeb/Walkin)
// router.patch("/rooms/:id/status", verifyPartnerAuth, posController.updateRoomStatus);

// // อัปเดตสถานะห้องพัก (ว่าง/ไม่ว่าง/กำลังทำความสะอาด)
// router.patch("/rooms/:id/status-room", verifyPartnerAuth, posController.updateRoomStatusRoom);

// // อัปเดตสถานะโปรโมชั่น
// router.patch("/rooms/:id/status-promotion", verifyPartnerAuth, posController.updateRoomStatusPromotion);

// // อัปเดตข้อมูลห้องพัก
// router.put("/rooms/:id", verifyPartnerAuth, posController.updateRoom);

// // ลบห้องพักตาม ID
// router.delete("/rooms/:id", verifyPartnerAuth, posController.deleteRoomById);

// // ดึงข้อมูลห้องพักตาม ID (ต้องอยู่หลัง routes อื่นๆ)
// router.get("/rooms/:id", verifyPartnerAuth, posController.getRoomById);

// // ==================== ROOM SEARCH ROUTES ====================
// // ค้นหาห้องว่างตามช่วงวันที่
// router.post("/rooms/search-by-date", verifyPartnerAuth, posController.searchAvailableRoomsByDateRange);

// // ค้นหาห้องที่ check-out (ห้องไม่ว่าง)
// router.post("/rooms/search-checked-out", verifyPartnerAuth, posController.searchCheckedOutRooms);

// // ค้นหาห้องกำลังทำความสะอาด
// router.post("/rooms/search-cleaning", verifyPartnerAuth, posController.searchCleaningRooms);

// // ล้างการค้นหาห้องว่าง
// router.delete("/rooms/search", verifyPartnerAuth, posController.clearRoomSearch);

// // ==================== TAG ROUTES ====================
// // สร้างแท็กใหม่
// router.post("/tags", verifyPartnerAuth, posController.createTag);

// // ดึงข้อมูลแท็กทั้งหมด
// router.get("/tags", verifyPartnerAuth, posController.getAllTags);

// // ลบแท็กทั้งหมด
// router.delete("/tags", verifyPartnerAuth, posController.deleteAllTags);

// // อัปเดตแท็ก
// router.put("/tags/:id", verifyPartnerAuth, posController.updateTag);

// // ลบแท็ก
// router.delete("/tags/:id", verifyPartnerAuth, posController.deleteTagById);

// // ดึงข้อมูลแท็กตาม ID (ต้องอยู่หลัง routes อื่นๆ)
// router.get("/tags/:id", verifyPartnerAuth, posController.getTagById);

// // ==================== ABOUT HOTEL ROUTES ====================
// // ดึงข้อมูล about hotel
// router.get("/about-hotel", verifyPartnerAuth, posController.getAboutHotel);

// // สร้างหรืออัปเดตข้อมูล about hotel
// router.post("/about-hotel", verifyPartnerAuth, posController.createOrUpdateAboutHotel);

// // อัปเดตข้อมูล about hotel
// router.put("/about-hotel/:id", verifyPartnerAuth, posController.updateAboutHotel);

// // ลบข้อมูล about hotel
// router.delete("/about-hotel/:id", verifyPartnerAuth, posController.deleteAboutHotel);

// // ==================== COMPREHENSIVE DATA ROUTES ====================
// // ดึงข้อมูล POS ทั้งหมดพร้อมข้อมูลที่เกี่ยวข้อง
// router.get("/complete-data", verifyPartnerAuth, posController.getCompletePosData);

// module.exports = router; 