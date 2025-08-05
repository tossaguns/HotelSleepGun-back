const Admin = require("../models/user/admin.schema");
const jwt = require("jsonwebtoken");


exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      return res.status(401).json({ message: "ไม่พบผู้ใช้งาน" });
    }

    req.user = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token ไม่ถูกต้อง" });
  }
};
