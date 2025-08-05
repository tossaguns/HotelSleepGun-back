const mongoose = require("mongoose");
const { Schema } = mongoose;

const typeHotelLocationSchema = new Schema(
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
    detailByPartner: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const typeHotelLocation = mongoose.model(
  "typeHotelLocation",
  typeHotelLocationSchema
);

module.exports = typeHotelLocation;
