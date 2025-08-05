const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Partner = require("../../models/user/partner.schema");
const Admin = require("../../models/user/admin.schema");

exports.loginUniversal = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "กรุณากรอก username และ password" });
    }

    let user = await Admin.findOne({ username }).select("+password");
    let role = "admin";

    if (!user) {
      user = await Partner.findOne({ username }).select("+password");
      role = "partner";

      if (!user) {
        return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
      }

      if (user.status !== "approved") {
        return res
          .status(403)
          .json({ message: "บัญชีของคุณยังไม่ได้รับการอนุมัติจากผู้ดูแลระบบ" });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      token,
      role,
      userId: user._id,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" });
  }
};
