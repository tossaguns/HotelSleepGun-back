const mongoose = require("mongoose");
const { Schema } = mongoose;

const typeFacilityHotelSchema = new Schema(
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

const typeFacilityHotel = mongoose.model(
  "typeFacilityHotel",
  typeFacilityHotelSchema
);

module.exports = typeFacilityHotel;
