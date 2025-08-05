const express = require('express');
const router = express.Router();
const provinceData = require('../config/provinceData');

// Ensure province data is loaded before handling requests
provinceData.loadProvinceData().catch(() => {});

router.get('/provinces', (req, res) => {
  try {
    const provinces = provinceData.getProvinces();
    res.json(provinces);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/amphures', (req, res) => {
  try {
    const { provinceId } = req.query;
    if (!provinceId) return res.status(400).json({ message: 'provinceId is required' });
    const amphures = provinceData.getAmphures(provinceId);
    res.json(amphures);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/tambons', (req, res) => {
  try {
    const { amphureId } = req.query;
    if (!amphureId) return res.status(400).json({ message: 'amphureId is required' });
    const tambons = provinceData.getTambons(amphureId);
    res.json(tambons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 