const express = require("express");
const router = express.Router();
const checkInOrderController = require("../../controllers/POS/checkInOrder.controller");
const { verifyPartnerAuth } = require("../../middlewares/partnerAuth.middleware");

// สร้าง Check-in Order ใหม่
router.post("/create", verifyPartnerAuth, checkInOrderController.createCheckInOrder);

// ดึง Check-in Order ทั้งหมดของ partner
router.get("/partner/:partnerId", verifyPartnerAuth, checkInOrderController.getAllCheckInOrders);

// ดึง Check-in Order ตาม ID
router.get("/:id", verifyPartnerAuth, checkInOrderController.getCheckInOrderById);

// ดึง Check-in Order ตาม checkInOrderId
router.get("/order/:checkInOrderId", verifyPartnerAuth, checkInOrderController.getCheckInOrderByOrderId);

// อัปเดต Check-in Order
router.put("/:id", verifyPartnerAuth, checkInOrderController.updateCheckInOrder);

// ลบ Check-in Order
router.delete("/:id", verifyPartnerAuth, checkInOrderController.deleteCheckInOrder);

// ดึงสถิติ Check-in Orders
router.get("/stats/:partnerId", verifyPartnerAuth, checkInOrderController.getCheckInOrderStats);

module.exports = router; 