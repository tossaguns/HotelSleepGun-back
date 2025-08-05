const express = require("express");
const router = express.Router();
const promotion = require("../controllers/promotion.controller");
const { verifyToken } = require('../middlewares/auth.middleware');

router.post("/create", verifyToken, promotion.createPromotion);
router.get("/getAll", verifyToken, promotion.getAllPromotions);
router.get("/get/:id", verifyToken, promotion.getPromotionById);
router.put("/update/:id", verifyToken, promotion.updatePromotionById);
router.delete("/delete/:id", verifyToken, promotion.deletePromotionById);
router.delete("/deleteAll", verifyToken, promotion.deleteAllPromotions);

module.exports = router;
