const mongoose = require("mongoose");
const { Schema } = mongoose;

const typeRoomHotelSchema = new Schema(
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

const typeRoomHotel = mongoose.model(
  "typeRoomHotel",
  typeRoomHotelSchema
);

module.exports = typeRoomHotel;
