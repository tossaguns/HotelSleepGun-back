const mongoose = require("mongoose");
const { Schema } = mongoose;

const promotionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    detail: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    reducedPrice: {
      type: Number,
      default: null,
    },
    percentPrice: {
      type: Number,
      default: null,
    },
    dateStart: {
      type: Date,
      required: true,
    },
    dateFinish: {
      type: Date,
      default: null,
    },
   
    discountType: {
      type: String,
      enum: ["reduced", "percent", null],
      default: null,
    },
    wantToReduce: {
      type: String,
      enum: ["yesReduced", "noReduced", null],
      default: null,
    },
    nameUpdate: {
      type: String,
      default: null,
    },
    finalPrice: {
      type: Number,
      default: null,
    },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  },
  {
    timestamps: true,
  }
);

const promotion = mongoose.model("promotion", promotionSchema);
module.exports = promotion;
