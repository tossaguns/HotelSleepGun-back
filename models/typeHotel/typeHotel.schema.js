const mongoose = require("mongoose");
const { Schema } = mongoose;

const typeHotelSchema = new Schema(
  {
    name: {
      type: String,
    
      unique: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const typeHotel = mongoose.model("typeHotel", typeHotelSchema);

module.exports = typeHotel;
