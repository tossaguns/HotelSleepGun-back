const mongoose = require("mongoose");
const { Schema } = mongoose;

// ประกาศ cashPledgeSchema ก่อน
const cashPledgeSchema = new Schema({
  price: { type: Number, default: 0 },
  note: { type: String, default: '' }
});

// ประกาศ typeBedPriceSchema
const typeBedPriceSchema = new Schema({
  child: { type: Number, default: 0 },
  normal: { type: Number, default: 0 }
});

const aboutHotelSchema = new Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partner",
      required: true,
      index: true
    },
    posId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "pos",
      required: true,
      index: true
    },
    manageHotelSleepGun: { type: String, enum: ['open', 'close'], default: 'open' },
    hasExtraBed: { type: String, enum: ['yes', 'no'], default: 'no' },
    hasExtraCashPledge: { type: String, enum: ['yes', 'no'], default: 'no' },
    checkInForm: { type: String },
    checkInTo: { type: String },
    checkOutForm: { type: String },
    checkOutTo: { type: String },
    VerifyIden_checkIn: { type: String },

    AboutFacilityHotel: { type: String },
    AboutHotelLocation: { type: String },
    AboutRoomHotel: { type: String },
    AboutHotelFor: { type: String },
    AboutFoodHotel: { type: String },

  checkInEarlyPricePerHour: { type: Number },
  checkOutEarlyPricePerHour: { type: Number },

  //FIXME: เพิ่ม serviceCharge  vat
    serviceCharge: { type: Number },
    vat: { type: Number },
    
    typeBedPrice: {
      type: typeBedPriceSchema,
      default: () => ({ child: 0, normal: 0 })
    },
    cashPledge: {
      type: cashPledgeSchema,
      default: () => ({ price: 0, note: '' })
    },
    typeFacilityHotel: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "typeFacilityHotel"
    }],
    typeFoodHotel: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "typeFoodHotel"
    }],
    typeHotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "typeHotel"
    },
    typeHotelFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "typeHotelFor"
    }],
    typeHotelLocation: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "typeHotelLocation"
    }],
    typePaymentPolicy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "typePaymentPolicy"
    },
    typeRoomHotel: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "typeRoomHotel"
    }],
    typeRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "typeRoom"
    },
    // เพิ่ม field สำหรับเก็บ detailByPartner ของแต่ละ hotel location
    hotelLocationDetails: {
      type: Map,
      of: String,
      default: {}
    },

  },
  { timestamps: true }
);

// เพิ่ม index
aboutHotelSchema.index({ partnerId: 1, posId: 1 });

// Virtual fields
aboutHotelSchema.virtual('hasExtraServices').get(function() {
  return this.hasExtraBed === 'yes' || this.hasExtraCashPledge === 'yes';
});

aboutHotelSchema.virtual('isSleepGunEnabled').get(function() {
  return this.manageHotelSleepGun === 'open';
});

aboutHotelSchema.virtual('hasEarlyCheckIn').get(function() {
  return this.checkInEarlyPricePerHour && this.checkInEarlyPricePerHour > 0;
});

aboutHotelSchema.virtual('hasEarlyCheckOut').get(function() {
  return this.checkOutEarlyPricePerHour && this.checkOutEarlyPricePerHour > 0;
});

// Pre-save middleware
aboutHotelSchema.pre('save', async function(next) {
  try {
    // อัปเดต aboutHotel ใน pos เมื่อมีการเปลี่ยนแปลง
    if (this.isModified()) {
      const pos = mongoose.model('pos');
      await pos.findOneAndUpdate(
        { partnerId: this.partnerId },
        { aboutHotel: this._id }
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method สำหรับดึงข้อมูลสรุป
aboutHotelSchema.methods.getSummary = function() {
  return {
    hasExtraBed: this.hasExtraBed === 'yes',
    hasExtraCashPledge: this.hasExtraCashPledge === 'yes',
    isSleepGunEnabled: this.manageHotelSleepGun === 'open',
    hasEarlyCheckIn: this.hasEarlyCheckIn,
    hasEarlyCheckOut: this.hasEarlyCheckOut,
    facilityCount: this.typeFacilityHotel ? this.typeFacilityHotel.length : 0,
    foodCount: this.typeFoodHotel ? this.typeFoodHotel.length : 0,
    locationCount: this.typeHotelLocation ? this.typeHotelLocation.length : 0,
    roomTypeCount: this.typeRoomHotel ? this.typeRoomHotel.length : 0
  };
};

const aboutHotel = mongoose.model("aboutHotel", aboutHotelSchema);
module.exports = aboutHotel;
