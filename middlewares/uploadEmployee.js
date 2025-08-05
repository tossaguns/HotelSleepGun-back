const multer = require("multer");
const path = require("path");

// กำหนด storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/employee"); // กำหนดโฟลเดอร์ที่เก็บไฟล์
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + file.fieldname + ext);
  },
});

// ฟิลเตอร์ไฟล์ถ้าต้องการ
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;
