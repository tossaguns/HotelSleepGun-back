const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const controller = require("../../controllers/typeHotel/typeHotel.controller");

// ==== Multer Config ====
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/icons");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ==== Routes ====
router.post("/create", upload.single("icon"), controller.createHotel);
router.get("/getAll", controller.getAllHotel);
router.delete("/delete/:id", controller.deleteHotelById);
router.delete("/deleteAll", controller.deleteAllHotel);
router.put("/update/:id", upload.single("icon"), controller.updateHotelById);
module.exports = router;
