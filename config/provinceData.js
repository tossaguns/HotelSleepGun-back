const axios = require('axios');

let provinceData = null;

const loadProvinceData = async () => {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province_with_amphure_tambon.json');
    provinceData = response.data;
    console.log('Province data loaded successfully');
  } catch (error) {
    console.error('Failed to load province data:', error.message);
    throw error;
  }
};

const getProvinces = () => {
  if (!provinceData) throw new Error('Province data not loaded');
  return provinceData.map(p => ({ id: p.id, name: p.name }));
};

const getAmphures = (provinceId) => {
  if (!provinceData) throw new Error('Province data not loaded');
  const province = provinceData.find(p => p.id === provinceId);
  return province ? province.amphure.map(a => ({ id: a.id, name: a.name })) : [];
};

const getTambons = (amphureId) => {
  if (!provinceData) throw new Error('Province data not loaded');
  for (const province of provinceData) {
    const amphure = province.amphure.find(a => a.id === amphureId);
    if (amphure) {
      return amphure.tambon.map(t => ({ id: t.id, name: t.name, zip_code: t.zip_code }));
    }
  }
  return [];
};

module.exports = {
  loadProvinceData,
  getProvinces,
  getAmphures,
  getTambons
};