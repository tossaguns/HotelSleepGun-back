const mongoose = require("mongoose");
const { Schema } = mongoose;

const typeRoomSchema = new Schema(
  {
    name: {
      type: String,
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

const typeRoom = mongoose.model("typeRoom", typeRoomSchema);

module.exports = typeRoom;
