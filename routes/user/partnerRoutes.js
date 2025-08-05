const express = require("express");
const router = express.Router();
const { uploadMiddleware } = require("../../middlewares/upload.middleware");
const partnerController = require("../../controllers/user/partner.controller");

router.post(
  "/register",
  partnerController.uploadPartnerFiles,
  partnerController.registerPartnerBasic
);

router.get("/getAll", partnerController.getAllPartners);
router.get("/get/:id", partnerController.getPartnerById);
router.get("/hotelLogin/:partnerId", partnerController.getHotelLoginData);
router.post("/createTestData", partnerController.createTestHotelData);
router.put("/update/:id", partnerController.updatePartnerById);
router.delete("/delete/:id", partnerController.deletePartnerById);
router.delete("/deleteAll", partnerController.deleteAllPartners);

router.put("/updateAfterLogin/:id", uploadMiddleware, partnerController.updatePartnerProfileAfterLogin);


module.exports = router;
