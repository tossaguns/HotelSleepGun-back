// middleware/auth.js
const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
  if (!token) return res.status(401).json({ message: "ไม่พบ token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // รองรับทั้ง id และ partnerId
    req.user = decoded;
    req.user.id = decoded.id || decoded.partnerId; // ให้ req.user.id มีค่าเสมอ
    next();
  } catch (err) {
    res.status(401).json({ message: "token ไม่ถูกต้อง" });
  }
};

exports.requireAdminPartner = (req, res, next) => {
  if (req.user.role !== "adminPartner") {
    return res.status(403).json({ message: "ไม่อนุญาตให้เข้าถึง" });
  }
  next();
};
