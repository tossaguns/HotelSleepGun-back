const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const partnerController = require('../controllers/user/partnerController');
const chatController = require('../controllers/chatController');

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('อนุญาตเฉพาะไฟล์ JPG, PNG, GIF, PDF, DOC, และ DOCX เท่านั้น'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: fileFilter
});

router.get('/user/list', partnerController.listPartners);

router.get('/history', chatController.getChatHistory);

router.post('/upload', upload.single('file'), chatController.uploadFile); // เพิ่มเส้นทางใหม่
module.exports = router;
