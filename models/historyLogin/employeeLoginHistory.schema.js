
const mongoose = require("mongoose");
const { Schema } = mongoose;

const loginSchema = new Schema(
  {
    name: { type: String, required: true },
    dateLogin: { type: String, required: true }, 
    timeLogin: { type: String, required: true }, 
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const login = mongoose.model("login", loginSchema);
module.exports = login;
