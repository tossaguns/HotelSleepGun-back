const jwt = require("jsonwebtoken");
const Partner = require("../models/user/partner.schema");

// Middleware to verify partner authentication
exports.verifyPartnerAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "ไม่พบ token กรุณาเข้าสู่ระบบ" 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is a partner
    if (decoded.role !== "partner" && !decoded.partnerId) {
      return res.status(403).json({ 
        success: false,
        message: "เฉพาะ partner เท่านั้นที่สามารถเข้าถึงได้" 
      });
    }

    // Get partner ID from token
    const partnerId = decoded.partnerId || decoded.id;
    
    // Verify partner exists and is approved
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ 
        success: false,
        message: "ไม่พบข้อมูล partner" 
      });
    }

    if (partner.status !== "approved") {
      return res.status(403).json({ 
        success: false,
        message: "บัญชีของคุณยังไม่ผ่านการอนุมัติ" 
      });
    }

    // Add partner info to request
    req.partner = {
      id: partner._id,
      username: partner.username,
      status: partner.status
    };
    
    next();
  } catch (error) {
    console.error("Partner auth error:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: "token ไม่ถูกต้อง" 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "token หมดอายุ กรุณาเข้าสู่ระบบใหม่" 
      });
    }
    return res.status(500).json({ 
      success: false,
      message: "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์" 
    });
  }
}; 