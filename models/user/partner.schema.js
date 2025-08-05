const mongoose = require("mongoose");
const { Schema } = mongoose;

const partnerSchema = new Schema(
  {
    //==============ส่วนบุคคล=============
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      default: "",
      select: false,
    },
    firstname: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },
    nickname: { type: String, trim: true },
    sex: { type: String, required: true },
    idenNumber: {
      type: String,
      required: true,
      unique: true,
      match: /^[0-9]{13}$/,
    },
    imageIden: { type: String, default: "" },
    visaNumber: {
      type: String,
      required: true,
      unique: true,
    },
    imageVisa: { type: String, default: "" },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: /^[0-9]{10}$/,
    },
    //=========ส่วนบริษัท===========
    companyName: { type: String, required: true, trim: true },
    hotelName: { type: String, required: true, trim: true },
    imageHotelOurDoor: { type: String, default: "" },

    businessLicense: { type: String, default: "" }, // PDF

    companyAddress: { type: String, default: "" },
    companySubdistrict: { type: String, default: "" },
    companyDistrict: { type: String, default: "" },
    companyProvince: { type: String, default: "" },
    companyPostcode: { type: String, match: /^[0-9]{5}$/, default: "" },

    hotelLatitude: {
      type: Number,
      required: true,
    },
    hotelLongitude: {
      type: Number,
      required: true,
    },

    //====== เอามารวมกับ  register ของบุคคล ========
    address: { type: String, default: "" },
    subdistrict: { type: String, default: "" },
    district: { type: String, default: "" },
    province: { type: String, default: "" },
    postcode: { type: String, match: /^[0-9]{5}$/, default: "" },

    //====== กรอกเพิ่มทีหลังของบริษัท ========
    companyEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    companyPhone: {
      type: String,
      unique: true,
      sparse: true,
      match: /^[0-9]{10}$/,
    },
    imageLogoCompany: { type: String, default: "" },
    imageBank: { type: String, default: "" },
    imageSignature: { type: String, default: "" },

    nameSignature: { type: String, default: "" },

    bankName: { type: String, default: "" },
    bankNumber: { type: String, default: "" },

    companyTaxId: { type: String, default: "", trim: true },

    //========= เรียกใช้ =============
    hotelType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "typeHotel",
      required: true,
    },

    aboutHotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "aboutHotel"
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "edit-request"],
      default: "pending",
    },
    rejectReason: { type: String, default: "" },
    editReason: { type: String, default: "" },

    approvedAt: { type: Date, default: null },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Partner = mongoose.model("Partner", partnerSchema);

module.exports = Partner;
