const OtpToken = require("../models/otp.schema");
const User = require("../models/user/member.schema");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

exports.sendOtp = async (req, res) => {
  const { email, name } = req.body;
  console.log('[Backend] รับ request ส่ง OTP:', email, name)
 
  const otp = Math.floor(100000 + Math.random() * 900000).toString();


  const expiresAt = new Date(Date.now() + 60 * 1000);

  await OtpToken.findOneAndDelete({ email }); 

  await OtpToken.create({ email, otp, expiresAt });

  const transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "รหัสยืนยัน OTP เว็บไซต์ TOSSAGUN",
    html: `<h2>OTP ของคุณคือ ${otp}</h2><p>หมดอายุใน 60 วินาที</p>`,
  });

  res.json({ message: "ส่ง OTP เรียบร้อย" });
};


exports.verifyOtp = async (req, res) => {
  const { email, otp, name } = req.body;
  console.log('[Backend] รับ request verify OTP:', email, otp, name)

  const record = await OtpToken.findOne({ email, otp });

  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ error: "OTP ไม่ถูกต้องหรือหมดอายุแล้ว" });
  }

  // ลบ OTP ทิ้ง
  await OtpToken.deleteOne({ email });

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({ email, name });
  }

  // ออก token
  const jwt = require("jsonwebtoken");
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.json({ token, user });
};
