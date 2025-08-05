const mongoose = require("mongoose");
const { Schema } = mongoose;

const typePaymentPolicySchema = new Schema(
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

const typePaymentPolicy = mongoose.model(
  "typePaymentPolicy",
  typePaymentPolicySchema
);

module.exports = typePaymentPolicy;
