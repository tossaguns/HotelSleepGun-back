const Promotion = require("../models/promotion.schema");

// สร้างโปรโมชั่นใหม่
exports.createPromotion = async (req, res) => {
  try {
    let finalPrice = req.body.price;
    if (
      req.body.discountType === "reduced" &&
      req.body.price &&
      req.body.reducedPrice
    ) {
      finalPrice = req.body.price - req.body.reducedPrice;
    } else if (
      req.body.discountType === "percent" &&
      req.body.price &&
      req.body.percentPrice
    ) {
      finalPrice = Number(
        req.body.price - (req.body.price * req.body.percentPrice) / 100
      ).toFixed(2);
    }
    const promotion = new Promotion({
      ...req.body,
      finalPrice: finalPrice,
      partnerId: req.user.id, // เพิ่ม partnerId
    });
    await promotion.save();
    res.status(201).json(promotion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ดึงโปรโมชั่นทั้งหมด
exports.getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find({
      $or: [
        { partnerId: null }, // global promotion
        { partnerId: req.user.id } // ของ partner นี้
      ]
    });
    // เพิ่มฟิลด์ราคาหลังลดในแต่ละ promotion
    const result = promotions.map((promo) => {
      const obj = promo.toObject();
      // ราคาหลังลดแบบบาท
      if (obj.discountType === "reduced" && obj.price && obj.reducedPrice) {
        obj.finalPrice = obj.price - obj.reducedPrice;
      }
      // ราคาหลังลดแบบเปอร์เซ็นต์
      else if (
        obj.discountType === "percent" &&
        obj.price &&
        obj.percentPrice
      ) {
        obj.finalPrice = Number(
          obj.price - (obj.price * obj.percentPrice) / 100
        ).toFixed(2);
      }
      // ถ้าไม่มีลดราคา
      else {
        obj.finalPrice = obj.price;
      }
      return obj;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ดึงโปรโมชั่นตาม id
exports.getPromotionById = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion)
      return res.status(404).json({ error: "Promotion not found" });
    res.json(promotion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ลบโปรโมชั่นตาม id
exports.deletePromotionById = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);
    if (!promotion)
      return res.status(404).json({ error: "Promotion not found" });
    res.json({ message: "Promotion deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ลบโปรโมชั่นทั้งหมด
exports.deleteAllPromotions = async (req, res) => {
  try {
    await Promotion.deleteMany();
    res.json({ message: "All promotions deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// อัปเดตโปรโมชั่นตาม id
exports.updatePromotionById = async (req, res) => {
  try {
    let finalPrice = req.body.price;
    if (
      req.body.discountType === "reduced" &&
      req.body.price &&
      req.body.reducedPrice
    ) {
      finalPrice = req.body.price - req.body.reducedPrice;
    } else if (
      req.body.discountType === "percent" &&
      req.body.price &&
      req.body.percentPrice
    ) {
      finalPrice = Number(
        req.body.price - (req.body.price * req.body.percentPrice) / 100
      ).toFixed(2);
    }
    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      { ...req.body, finalPrice: finalPrice },
      { new: true }
    );
    if (!promotion)
      return res.status(404).json({ error: "Promotion not found" });
    res.json(promotion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
