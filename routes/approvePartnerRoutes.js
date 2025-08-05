const express = require("express");
const router = express.Router();

const approveController = require("../controllers/approvePartner.controller");
const partnerController = require("../controllers/user/partner.controller");

// ======= Approve/Reject/Request Edit =======
router.put("/approved/:id", approveController.approvePartner);
router.put("/reject/:id", approveController.rejectPartner); // ใช้ PUT ได้
router.put("/request-edit/:id", approveController.requestEditPartner); // เปลี่ยน POST → PUT เพื่อ consistency

// ======= Get/Delete Partner by Status =======
router.get("/getAllStatus/:status", partnerController.getAllByStatus);//approved,...
router.get("/getStatus/:status/:id", partnerController.getOneByStatus);
router.delete("/deleteStatus/:status/:id", partnerController.deleteByStatus);

router.get("/getAllPendingPartners", partnerController.getAllPendingPartners);

module.exports = router;
