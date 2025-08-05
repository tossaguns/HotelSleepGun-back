const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Partner = require("../../models/user/partner.schema");

const loginPartner = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "กรุณากรอก username และ password" });
    }

    const partner = await Partner.findOne({ username }).select("+password");

    if (!partner) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้งานนี้" });
    }

    const isMatch = await bcrypt.compare(password, partner.password);
    if (!isMatch) {
      return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });
    }

    if (partner.status !== "approved") {
      return res
        .status(403)
        .json({ message: "บัญชีของคุณยังไม่ผ่านการอนุมัติ" });
    }

    const token = jwt.sign(
      { partnerId: partner._id, username: partner.username },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    const { password: _, ...partnerData } = partner.toObject();

    res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      partner: partnerData,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" });
  }
};

module.exports = { loginPartner };
