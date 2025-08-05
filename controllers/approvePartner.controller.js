/*const Partner = require("../models/user/partner.schema");
const sendEmail = require("../utils/sendEmail");
const generateEditEmailTemplate =
  require("../utils/emailTemplates").generateEditEmailTemplate;
const nodemailer = require("nodemailer");

// Config สำหรับส่งอีเมล
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // เช่น yourapp@gmail.com
    pass: process.env.EMAIL_PASS, // รหัสผ่านหรือ App password
  },
});

// อนุมัติ Partner
exports.approvePartner = async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await Partner.findByIdAndUpdate(
      id,
      { status: "approved" },
      { new: true }
    );

    if (!partner) return res.status(404).json({ message: "ไม่พบ Partner" });

    await sendEmail(
      partner.email,
      "การสมัครสำเร็จ",
      `ยินดีด้วย! บัญชีของคุณได้รับการอนุมัติแล้ว คุณสามารถเข้าสู่ระบบได้ที่เว็บไซต์ของเรา`
    );

    res.json({ message: "อนุมัติสำเร็จ", partner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ปฏิเสธ Partner
exports.rejectPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const partner = await Partner.findByIdAndUpdate(
      id,
      { status: "rejected" },
      { new: true }
    );

    if (!partner) return res.status(404).json({ message: "ไม่พบ Partner" });

    await sendEmail(
      partner.email,
      "การสมัครไม่ผ่าน",
      `ขออภัย บัญชีของคุณไม่ผ่านการอนุมัติ เนื่องจาก: ${reason}`
    );

    res.json({ message: "ปฏิเสธสำเร็จ", partner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ขอให้แก้ไขข้อมูล
exports.requestEditPartner = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const partner = await Partner.findById(id);
  if (!partner) return res.status(404).json({ message: "ไม่พบ Partner" });

  const editUrl = `http://localhost:9999/SleepGun/partner/request-edit/${id}`;
  const htmlContent = generateEditEmailTemplate(
    partner.firstname,
    reason,
    editUrl
  );

  await sendEmail(partner.email, "กรุณาแก้ไขข้อมูลการสมัคร", htmlContent);

  res.json({ message: "ส่งคำขอแก้ไขเรียบร้อย" });
};



TODO: ข้างบนเชื่อม email ข้างล่างยังไม่เชื่อม email
*/

const Partner = require("../models/user/partner.schema");
const AboutHotel = require('../models/aboutHotel/aboutHotel.schema');

// ✅ อนุมัติ Partner (ไม่ส่งอีเมล)
exports.approvePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json({ message: "ไม่พบ partner" });

    // อัปเดตสถานะเป็น approved
    partner.status = 'approved';
    await partner.save();

    res.status(200).json({
      message: "อนุมัติ partner สำเร็จ",
      partnerId: partner._id
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.rejectPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res
        .status(400)
        .json({ message: "กรุณาระบุ reason (เหตุผลในการปฏิเสธ)" });
    }

    const partner = await Partner.findByIdAndUpdate(
      id,
      { status: "rejected", rejectReason: reason },
      { new: true }
    );

    if (!partner) return res.status(404).json({ message: "ไม่พบ Partner" });

    res.json({ message: "ปฏิเสธสำเร็จ", partner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ ขอให้แก้ไขข้อมูล (ไม่ส่งอีเมล)
exports.requestEditPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const partner = await Partner.findByIdAndUpdate(
      id,
      { status: "edit-requested" },
      { new: true }
    );

    if (!partner) return res.status(404).json({ message: "ไม่พบ Partner" });

    res.json({ message: "ขอให้แก้ไขสำเร็จ", partner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ ดึงทั้งหมดตามสถานะ
exports.getAllByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const partners = await Partner.find({ status }).populate("hotelType");

    res.status(200).json(partners);
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
};

// ✅ ดึงข้อมูล 1 คน ตามสถานะ
exports.getOneByStatus = async (req, res) => {
  try {
    const { id, status } = req.params;
    const partner = await Partner.findOne({ _id: id, status }).populate(
      "hotelType"
    );
    const updatedPartner = await Partner.findByIdAndUpdate(
      req.params.id,
      { status: "approved", approvedAt: new Date() },
      { new: true }
    );
    if (!partner) return res.status(404).json({ message: "ไม่พบ Partner" });
    res.status(200).json(partner);
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
};

// ✅ ลบ Partner ตามสถานะ + ID
exports.deleteByStatus = async (req, res) => {
  try {
    const { id, status } = req.params;
    const deleted = await Partner.findOneAndDelete({ _id: id, status });
    if (!deleted)
      return res.status(404).json({ message: "ไม่พบ Partner เพื่อลบ" });
    res.status(200).json({ message: "ลบสำเร็จ" });
  } catch (error) {
    res.status(500).json({ message: "ลบไม่สำเร็จ", error: error.message });
  }
};
