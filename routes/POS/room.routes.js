const express = require("express");
const router = express.Router();
const roomController = require("../../controllers/POS/room.controller");
const { verifyPartnerAuth } = require("../../middlewares/partnerAuth.middleware");

// สร้างห้องใหม่
router.post("/rooms", verifyPartnerAuth, roomController.createRoom);

// ดึงข้อมูลห้องทั้งหมด
router.get("/rooms", verifyPartnerAuth, roomController.getAllRooms);

// ดึงข้อมูลห้องตาม ID
router.get("/rooms/:id", verifyPartnerAuth, roomController.getRoomById);

// อัปเดตข้อมูลห้อง
router.put("/rooms/:id", verifyPartnerAuth, roomController.updateRoom);

// ลบห้อง
router.delete("/rooms/:id", verifyPartnerAuth, roomController.deleteRoomById);

// ลบห้องทั้งหมด
router.delete("/rooms", verifyPartnerAuth, roomController.deleteAllRooms);

// ดึงห้องตามตึกและชั้น
router.get("/rooms/building/:buildingId/floor/:floor", verifyPartnerAuth, roomController.getRoomsByBuildingAndFloor);

// ดึงห้องตามชั้น (option)
router.get("/rooms/floor/:buildingId/:floor", verifyPartnerAuth, roomController.getRoomsByFloor);

// อัปเดตสถานะห้อง (SleepGunWeb/Walkin)
router.patch("/rooms/:id/status", verifyPartnerAuth, roomController.updateRoomStatus);

// อัปเดตสถานะห้องพัก (ว่าง/ไม่ว่าง/กำลังทำความสะอาด)
router.patch("/rooms/:id/status-room", verifyPartnerAuth, roomController.updateRoomStatusRoom);

// อัปเดตสถานะโปรโมชั่น
router.patch("/rooms/:id/status-promotion", verifyPartnerAuth, roomController.updateRoomStatusPromotion);

// ดึงตัวเลือกสถานะ
router.get("/rooms-status-options", verifyPartnerAuth, roomController.getStatusOptions);

// ดึงโควต้าห้อง SleepGun
router.get("/rooms-sleepgun-quota", verifyPartnerAuth, roomController.getSleepGunQuota);




// ค้นหาห้องว่างตามช่วงวันที่
router.post("/search-by-date", verifyPartnerAuth, roomController.searchAvailableRoomsByDateRange);

// ค้นหาห้องที่ check-out (ห้องไม่ว่าง)
router.post("/search-checked-out", verifyPartnerAuth, roomController.searchCheckedOutRooms);

// ค้นหาห้องกำลังทำความสะอาด
router.post("/search-cleaning", verifyPartnerAuth, roomController.searchCleaningRooms);

// ล้างการค้นหาห้องว่าง
router.delete("/search", verifyPartnerAuth, roomController.clearRoomSearch);

module.exports = router;