const mongoose = require("mongoose");
const { Schema } = mongoose;

const employeeSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    firstname: { type: String, trim: true },
    lastname: { type: String, trim: true },
    nickname: { type: String, trim: true },

    sex: { type: String }, // เพศหญิง,เพศชาย
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    employeeCode: { type: String },
    positionEmployee: { type: String },
    imageIden: { type: String, default: "" },

    statusByPartner: { type: String, required: true }, // มี adminPartner, employee
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
    aboutHotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'aboutHotel' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const employee = mongoose.model("Employee", employeeSchema);

module.exports = employee;
