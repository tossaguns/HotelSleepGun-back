const Partner = require("../../models/user/partner.schema");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const AboutHotel = require("../../models/aboutHotel/aboutHotel.schema");

// ==== Multer Config ====
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/partners/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

exports.uploadPartnerFiles = upload.fields([
  { name: "imageHotelOurDoor", maxCount: 1 },
  { name: "imageIden", maxCount: 1 },
  { name: "imageVisa", maxCount: 1 },
  { name: "businessLicense", maxCount: 1 },
  { name: "imageLogoCompany", maxCount: 1 },
  { name: "imageSignature", maxCount: 1 },
  { name: "imageBank", maxCount: 1 },
]);

exports.registerPartnerBasic = async (req, res) => {
  try {
    const {
      username,
      firstname,
      lastname,
      sex,
      email,
      phone,
      idenNumber,
      visaNumber,
      companyName,
      hotelName,
      address,
      subdistrict,
      district,
      province,
      postcode,
      companyAddress,
      companySubdistrict,
      companyDistrict,
      companyProvince,
      companyPostcode,
      hotelLatitude,
      hotelLongitude,
      hotelType,
    } = req.body;

    const password = req.body.password;

    if (!password) {
      return res.status(400).json({ message: "กรุณากรอกรหัสผ่าน" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ อ่านไฟล์จาก local disk
    const getPath = (field) =>
      req.files?.[field]?.[0]
        ? `/uploads/partners/${req.files[field][0].filename}`
        : "";

    const newPartner = new Partner({
      username,
      password: hashedPassword,
      firstname,
      lastname,
      sex,
      email,
      phone,
      idenNumber,
      visaNumber,
      companyName,
      hotelName,
      imageIden: getPath("imageIden"),
      imageVisa: getPath("imageVisa"),
      imageHotelOurDoor: getPath("imageHotelOurDoor"),
      businessLicense: getPath("businessLicense"),
      imageLogoCompany: getPath("imageLogoCompany"),
      imageSignature: getPath("imageSignature"),
      imageBank: getPath("imageBank"),
      address,
      subdistrict,
      district,
      province,
      postcode,
      companyAddress,
      companySubdistrict,
      companyDistrict,
      companyProvince,
      companyPostcode,
      hotelLatitude: parseFloat(hotelLatitude),
      hotelLongitude: parseFloat(hotelLongitude),
      hotelType,
    });
    const savedPartner = await newPartner.save();

    res.status(201).json({
      message: "สมัครสำเร็จ",
      partnerId: savedPartner._id
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ..
// ... (โค้ดอื่น ๆ เหมือนเดิม)

// ดึงพาทเนอร์ทั้งหมด
exports.getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find()
    .populate("aboutHotel")
      .populate("hotelType")
      .sort({ createdAt: -1 });

    res.status(200).json(partners);
  } catch (err) {
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล", error: err.message });
  }
};

// ดึงพาทเนอร์ตาม ID

exports.getPartnerById = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID ไม่ถูกต้อง" });
    }

    const partner = await Partner.findById(id);
    if (!partner) {
      return res.status(404).json({ message: "ไม่พบพาร์ทเนอร์" });
    }
    res.json(partner);
  } catch (error) {
    console.error("Error in getPartnerById:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" });
  }
};

// อัปเดตข้อมูลพาทเนอร์
exports.updatePartnerById = async (req, res) => {
  try {
    const updatedPartner = await Partner.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedPartner) {
      return res.status(404).json({ message: "ไม่พบพาทเนอร์เพื่ออัปเดต" });
    }
    res.status(200).json({ message: "อัปเดตสำเร็จ", data: updatedPartner });
  } catch (err) {
    res.status(500).json({ message: "อัปเดตล้มเหลว", error: err.message });
  }
};

// ลบพาทเนอร์ตาม ID
exports.deletePartnerById = async (req, res) => {
  try {
    const deletedPartner = await Partner.findByIdAndDelete(req.params.id);
    if (!deletedPartner) {
      return res.status(404).json({ message: "ไม่พบพาทเนอร์เพื่อทำการลบ" });
    }
    res.status(200).json({ message: "ลบพาทเนอร์เรียบร้อยแล้ว" });
  } catch (err) {
    res.status(500).json({ message: "ลบไม่สำเร็จ", error: err.message });
  }
};

// ลบพาทเนอร์ทั้งหมด
exports.deleteAllPartners = async (req, res) => {
  try {
    await Partner.deleteMany({});
    res.status(200).json({ message: "ลบพาทเนอร์ทั้งหมดเรียบร้อยแล้ว" });
  } catch (err) {
    res.status(500).json({ message: "ลบทั้งหมดล้มเหลว", error: err.message });
  }
};

exports.getAllByStatus = async (req, res) => {
  try {
    const status = req.params.status;
    const partners = await Partner.find({ status });
    res.json(partners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getOneByStatus = async (req, res) => {
  try {
    const { id, status } = req.params;
    const partner = await Partner.findOne({ _id: id, status });
    if (!partner) {
      return res.status(404).json({ error: "Partner not found" });
    }
    res.json(partner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteByStatus = async (req, res) => {
  try {
    const { id, status } = req.params;
    const deleted = await Partner.findOneAndDelete({ _id: id, status });
    if (!deleted) {
      return res
        .status(404)
        .json({ error: "Partner not found or status mismatch" });
    }
    res.json({ message: "Partner deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ ดึงพาทเนอร์ที่ยังไม่ได้อนุมัติ/แก้ไข/ปฏิเสธ
exports.getAllPendingPartners = async (req, res) => {
  try {
    const pendingPartners = await Partner.find({
      $or: [
        { status: { $exists: false } },
        { status: { $nin: ["approved", "rejected", "edit-requested"] } },
      ],
    });

    res.status(200).json(pendingPartners);
  } catch (err) {
    console.error("❌ Error fetching pending partners:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
};

//=====================หลังจาก Login เสร็จเเล้ว======================
// ฟังก์ชันอัปเดตข้อมูล partner พร้อมอัปโหลดรูป
exports.updatePartnerProfileAfterLogin = async (req, res) => {
  try {
    console.log("✅ isProfileComplete from req.body:", req.body.isProfileComplete);
    console.log("✅ files:", req.files);

    // ดึงชื่อไฟล์จาก multer (ถ้ามี)
    const imageLogoCompany = req.files?.imageLogoCompany?.[0]?.filename;
    const imageSignature = req.files?.imageSignature?.[0]?.filename;
    const imageBank = req.files?.imageBank?.[0]?.filename;

    // เตรียมข้อมูลอัปเดต
    const updateFields = {
      companyEmail: req.body.companyEmail,
      companyPhone: req.body.companyPhone,
      nameSignature: req.body.nameSignature,
      bankName: req.body.bankName,
      bankNumber: req.body.bankNumber,
      companyTaxId: req.body.companyTaxId,
      isProfileComplete: req.body.isProfileComplete === "true",
      companyAddress: req.body.companyAddress,
      companySubdistrict: req.body.companySubdistrict,
      companyDistrict: req.body.companyDistrict,
      companyProvince: req.body.companyProvince,
      companyPostcode: req.body.companyPostcode,
      hotelLatitude: req.body.hotelLatitude,
      hotelLongitude: req.body.hotelLongitude,
    };

    // เพิ่มชื่อไฟล์รูปถ้ามีการอัปโหลด
    if (imageLogoCompany) updateFields.imageLogoCompany = imageLogoCompany;
    if (imageSignature) updateFields.imageSignature = imageSignature;
    if (imageBank) updateFields.imageBank = imageBank;

    const updated = await Partner.findByIdAndUpdate(req.params.id, updateFields, { new: true });

    res.status(200).json({ message: "อัปเดตโปรไฟล์สำเร็จ", data: updated });
  } catch (err) {
    console.error("❌ UPDATE ERROR:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
};

/*exports.registerPartnerBasic = async (req, res) => {
  try {
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);

    const {
      username,
      password,
      firstname,
      lastname,
      sex,
      email,
      phone,
      idenNumber,
      visaNumber,
      companyName,
      hotelName,
      address,
      subdistrict,
      district,
      province,
      postcode,
      companyAddress,
      companySubdistrict,
      companyDistrict,
      companyProvince,
      companyPostcode,
      hotelLatitude,
      hotelLongitude,
      hotelType,
    } = req.body;

    // ✅ เข้ารหัสรหัสผ่านก่อนบันทึก
    const hashedPassword = await bcrypt.hash(password, 10);

    const imageIden = req.files?.imageIden?.[0]?.location || "";
    const imageVisa = req.files?.imageVisa?.[0]?.location || "";
    const imageHotelOurDoor = req.files?.imageHotelOurDoor?.[0]?.location || "";
    const businessLicense = req.files?.businessLicense?.[0]?.location || "";

    const newPartner = new Partner({
      username,
      password: hashedPassword, // ⬅️ ใส่รหัสผ่านที่ถูกเข้ารหัส
      firstname,
      lastname,
      sex,
      email,
      phone,
      idenNumber,
      visaNumber,
      companyName,
      hotelName,
      imageIden,
      imageVisa,
      imageHotelOurDoor,
      businessLicense,
      address,
      subdistrict,
      district,
      province,
      postcode,
      companyAddress,
      companySubdistrict,
      companyDistrict,
      companyProvince,
      companyPostcode,
      hotelLatitude,
      hotelLongitude,
      hotelType: hotelType,
    });

    await newPartner.save();

    res.status(201).json({ message: "สมัครสำเร็จ", partnerId: newPartner._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการสมัคร", error });
  }


  
};*/

// ดึงข้อมูล hotel login สำหรับหน้า LoginCompany
exports.getHotelLoginData = async (req, res) => {
  try {
    const partnerId = req.params.partnerId;
    
    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      return res.status(400).json({ message: "ID ไม่ถูกต้อง" });
    }

    const partner = await Partner.findById(partnerId).select('companyName imageHotelOurDoor hotelName status');
    
    if (!partner) {
      return res.status(404).json({ message: "ไม่พบข้อมูลโรงแรม" });
    }

    // ตรวจสอบว่า partner นี้ได้รับการอนุมัติแล้วหรือไม่
    if (partner.status !== "approved") {
      return res.status(403).json({ message: "บัญชีของคุณยังไม่ผ่านการอนุมัติ" });
    }

    // ส่งข้อมูลที่จำเป็นสำหรับหน้า login
    const hotelData = {
      companyName: partner.companyName || '',
      hotelName: partner.hotelName || '',
      imageHotelOurDoor: partner.imageHotelOurDoor || '/imgHotel/hotel/loginCompany.jpg' // default image
    };

    res.status(200).json(hotelData);
  } catch (error) {
    console.error("Error in getHotelLoginData:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" });
  }
};

// สร้างข้อมูลทดสอบสำหรับ hotel login
exports.createTestHotelData = async (req, res) => {
  try {
    // ตรวจสอบว่ามี partner อยู่แล้วหรือไม่
    const existingPartner = await Partner.findOne();
    
    if (existingPartner) {
      // อัปเดตข้อมูลที่มีอยู่
      const updatedPartner = await Partner.findByIdAndUpdate(
        existingPartner._id,
        {
          companyName: "โรงแรมสวัสดีรีสอร์ท",
          hotelName: "สวัสดีรีสอร์ท",
          imageHotelOurDoor: "/imgHotel/hotel/loginCompany.jpg",
          status: "approved",
          isProfileComplete: true
        },
        { new: true }
      );
      
      return res.status(200).json({
        message: "อัปเดตข้อมูลทดสอบสำเร็จ",
        partner: updatedPartner
      });
    } else {
      // สร้างข้อมูลใหม่
      const testPartner = new Partner({
        username: "testhotel",
        password: await bcrypt.hash("123456", 10),
        firstname: "ทดสอบ",
        lastname: "โรงแรม",
        sex: "ชาย",
        email: "test@hotel.com",
        phone: "0812345678",
        idenNumber: "1234567890123",
        visaNumber: "V123456789",
        companyName: "โรงแรมสวัสดีรีสอร์ท",
        hotelName: "สวัสดีรีสอร์ท",
        imageHotelOurDoor: "/imgHotel/hotel/loginCompany.jpg",
        hotelLatitude: 13.7563,
        hotelLongitude: 100.5018,
        status: "approved",
        isProfileComplete: true
      });
      
      const savedPartner = await testPartner.save();
      
      return res.status(201).json({
        message: "สร้างข้อมูลทดสอบสำเร็จ",
        partner: savedPartner
      });
    }
  } catch (error) {
    console.error("Error creating test data:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" });
  }
};

