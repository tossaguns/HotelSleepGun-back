const mongoose = require("mongoose");
const { Schema } = mongoose;

const typeFoodHotelSchema = new Schema(
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

const typeFoodHotel = mongoose.model("typeFoodHotel", typeFoodHotelSchema);

module.exports = typeFoodHotel;

