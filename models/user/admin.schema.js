const mongoose = require("mongoose");
const { Schema } = mongoose;

const adminSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    plainPassword: {type: String},
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["superadmin", "admin"],
      default: "admin",
    },
  },
  {
    timestamps: true,
  }
);

const admin = mongoose.model("Admin", adminSchema);
module.exports = admin;
