const mongoose = require("mongoose");
const { Schema } = mongoose;

const typeHotelForSchema = new Schema(
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

const typeHotelFor = mongoose.model(
  "typeHotelFor",
  typeHotelForSchema
);

module.exports = typeHotelFor;
