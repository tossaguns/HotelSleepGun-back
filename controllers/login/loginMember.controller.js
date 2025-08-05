const Member = require("../../models/user/member.schema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// login member ด้วย username + password (plaintext password)
const loginMember = async (req, res) => {
  try {
    const { username, password } = req.body;

    const member = await Member.findOne({ username });
    if (!member) {
      return res.status(400).json({ message: "ไม่พบผู้ใช้งานนี้" });
    }

    // เปรียบเทียบ password แบบ plaintext (ไม่แนะนำใน production)
    if (password !== member.password) {
      return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign({ id: member._id, role: "member" }, "secretKey", {
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: {
        username: member.username,
        role: "member",
        email: member.email,
      },
    });
  } catch (error) {
    console.error("Login Member Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
};

module.exports = {
  loginMember,
};
