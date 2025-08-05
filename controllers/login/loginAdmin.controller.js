const Admin = require("../../models/user/admin.schema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ message: "ไม่พบผู้ใช้งานนี้" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      token,
      admin: {
        id: admin._id,
        firstname: admin.firstname,
        lastname: admin.lastname,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("❌ login error:", error);
    res.status(500).json({ message: error.message });
  }
};

