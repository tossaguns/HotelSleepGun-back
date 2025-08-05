const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage });

exports.uploadMiddleware = upload.fields([
  { name: "imageHotelOurDoor", maxCount: 1 },
  { name: "imageIden", maxCount: 1 },
  { name: "imageVisa", maxCount: 1 },
  { name: "businessLicense", maxCount: 1 },
  { name: "imageLogoCompany", maxCount: 1 },
  { name: "imageSignature", maxCount: 1 },
  { name: "imageBank", maxCount: 1 },
]);
