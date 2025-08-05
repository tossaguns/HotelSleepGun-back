const Member = require("../models/user/member.schema");
const { S3Client, PutObjectCommand , DeleteObjectCommand } = require("@aws-sdk/client-s3");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
// const Partner = require("../models/user/partner"); // Comment out for now
const axios = require("axios");
const jwt = require("jsonwebtoken");


const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const generateMemberId = async () => {
  const lastMember = await Member.findOne({}, {}, { sort: { createdAt: -1 } });

  let lastId = 0;
  if (lastMember && lastMember.memberId) {
    const numberPart = lastMember.memberId.replace(/^M/, "");
    if (!isNaN(numberPart)) {
      lastId = parseInt(numberPart);
    } else {
      console.warn("Invalid memberId format:", lastMember.memberId);
    }
  }

  return "M" + String(lastId + 1).padStart(6, "0");
};

// ฟังก์ชันตรวจสอบข้อมูลที่ซ้ำ
const checkDuplicate = async (field, value) => {
  const memberUser = await Member.findOne({ [field]: value });
  // const partnerUser = await Partner.findOne({ [field]: value }); // Comment out for now
  return { exists: !!memberUser }; // || !!partnerUser
};



// สำหรับ Google Login
exports.googleLogin = async (req, res) => {
  const { id_token } = req.body;
  console.log('[Backend] รับ request Google Login:', id_token)
  try {
    // ตรวจสอบ id_token กับ Google
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`
    );

    const { sub, email, name, picture } = response.data;

    let user = await Member.findOne({ provider: "google", providerId: sub });

    if (!user) {
      user = await Member.create({
        provider: "google",
        providerId: sub,
        email,
        name,
        picture,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    console.log('[Backend] Google Login success:', user)
    res.json({ token, user });
  } catch (err) {
    console.error('[Backend] Google Login error:', err)
    res.status(401).json({ error: "Invalid Google token" });
  }
};


exports.facebookLogin = async (req, res) => {
  const { access_token } = req.body;
  console.log('[Backend] รับ request Facebook Login:', access_token)

  try {
    // ดึงข้อมูลโปรไฟล์จาก Facebook
    const fbRes = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${access_token}`
    );

    const { id, name, email, picture } = fbRes.data;

    let user = await Member.findOne({ provider: "facebook", providerId: id });

    if (!user) {
      user = await Member.create({
        provider: "facebook",
        providerId: id,
        email,
        name,
        picture: picture?.data?.url || "",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    console.log('[Backend] Facebook Login success:', user)
    res.json({ token, user });
  } catch (err) {
    console.error('[Backend] Facebook Login error:', err)
    res.status(401).json({ error: "Invalid Facebook token" });
  }
};



exports.lineLogin = async (req, res) => {
  const { id_token } = req.body;
  console.log('[Backend] รับ request Line Login:', id_token)

  try {
    // ตรวจสอบ id_token กับ LINE
    const lineRes = await axios.post(
      "https://api.line.me/oauth2/v2.1/verify",
      new URLSearchParams({
        id_token,
        client_id: process.env.LINE_CHANNEL_ID,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { sub, name, email, picture } = lineRes.data;

    let user = await Member.findOne({ provider: "line", providerId: sub });

    if (!user) {
      user = await Member.create({
        provider: "line",
        providerId: sub,
        email,
        name,
        picture,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    console.log('[Backend] Line Login success:', user)
    res.json({ token, user });
  } catch (err) {
    console.error('[Backend] Line Login error:', err)
    res.status(401).json({ error: "Invalid LINE token" });
  }
};
