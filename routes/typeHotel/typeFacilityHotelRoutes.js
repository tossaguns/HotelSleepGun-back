const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const controller = require("../../controllers/typeHotel/typeFacilityHotel.controller");

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
router.post("/create", upload.single("icon"), controller.createFacility);
router.get("/getAll", controller.getAllFacilities);
router.delete("/delete/:id", controller.deleteFacilityById);
router.delete("/deleteAll", controller.deleteAllFacilities);
router.put("/update/:id", upload.single("icon"), controller.updateFacilityById);
module.exports = router;
