const mongoose = require("mongoose");
const { Schema } = mongoose;

const roomSchema = new Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partner",
      required: true,
      index: true
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "building",
      required: true,
      index: true
    },
    posId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "pos",
      required: true,
      index: true
    },
    //มาเพิ่มราคาที่ลดเเล้ว เเละสถานะปุ่ม radio
    roomNumber: {
      type: String,
      trim: true,
      required: true
    },
    price: {
      type: Number,
      default: 0,
    },
    
    // FIXME: เพิ่มมาเดี๋ยวกลับมาเเก้ไข
    // basePrice: {
    //   type: Number,
    //   default: 0,
    // },

    // serviceChargeAmount: { type: Number, default: 0 },
    // vatAmount: { type: Number, default: 0 },
    // basePrice: { type: Number, default: 0 },
    // isServiceChargeIncluded: { type: Boolean, default: false },
    // isVatIncluded: { type: Boolean, default: false },

    stayPeople: {
      type: Number,
      default: 0,
    },
    roomDetail: {
      type: String,
      trim: true,
    },
    imgrooms: {
      type: [String],
      default: [],
      validate: [arrayLimit, "{PATH} exceeds the limit of 10"],
    },

    typeRoomHotel: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "typeRoomHotel",
      },
    ],
    typeRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "typeRoom",
    },
    tag: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tagPOS",
      },
    ],
    status: {
      type: String,
      enum: ["SleepGunWeb", "Walkin"],
      default: "Walkin",
    },
    statusRoom: {
      type: String,
      enum: ["ว่าง", "ไม่ว่าง", "กำลังทำความสะอาด"],
      default: "ว่าง",
    },
    statusPromotion: {
      type: String,
      enum: ["openPromotion", "closePromotion"],
      default: "closePromotion",
    },
    air: {
      type: String,
      enum: ["ห้องเเอร์", "ห้องพัดลม", "ห้องเเอร์และพัดลม"],
      default: "ห้องพัดลม",
    },
    floor: {
      type: String,
      trim: true,
      required: true,
    },
    quota: {
      type: Number,
      default: 5, // โควต้าเริ่มต้น 5 ห้องต่อ partner
    },
  },
  {
    timestamps: true,
  }
);

// เพิ่ม index
roomSchema.index({ partnerId: 1, buildingId: 1 });
roomSchema.index({ partnerId: 1, status: 1 });
roomSchema.index({ partnerId: 1, statusRoom: 1 });
roomSchema.index({ buildingId: 1, floor: 1 });

// Virtual fields
roomSchema.virtual('isAvailable').get(function() {
  return this.statusRoom === 'ว่าง';
});

roomSchema.virtual('isSleepGun').get(function() {
  return this.status === 'SleepGunWeb';
});

roomSchema.virtual('isOccupied').get(function() {
  return this.statusRoom === 'ไม่ว่าง';
});

roomSchema.virtual('isCleaning').get(function() {
  return this.statusRoom === 'กำลังทำความสะอาด';
});

roomSchema.virtual('hasPromotion').get(function() {
  return this.statusPromotion === 'openPromotion';
});

// Pre-save middleware
roomSchema.pre('save', async function(next) {
  try {
    // อัปเดตสถิติใน pos และ building
    if (this.isModified()) {
      const pos = mongoose.model('pos');
      const building = mongoose.model('building');
      
      if (this.isNew) {
        // ตรวจสอบว่ามี POS อยู่แล้วหรือไม่ ถ้าไม่มีให้สร้างใหม่
        let posData = await pos.findOne({ partnerId: this.partnerId });
        if (!posData) {
          posData = new pos({
            partnerId: this.partnerId,
            buildingCount: 0,
            floorCount: 0,
            roomCount: 0,
            roomCountSleepGun: 0,
            quotaRoomSleepGun: 5
          });
          await posData.save();
          console.log('✅ Created new POS for partner:', this.partnerId);
        }
        
        // อัปเดต pos
        await pos.findOneAndUpdate(
          { partnerId: this.partnerId },
          { 
            $inc: { roomCount: 1 },
            $push: { rooms: this._id }
          }
        );
        
        // อัปเดต building floor roomCount
        if (this.buildingId && this.floor) {
          await building.findOneAndUpdate(
            { 
              _id: this.buildingId,
              'floors.name': this.floor 
            },
            { $inc: { 'floors.$.roomCount': 1 } }
          );
        }
      }
      
      // อัปเดต roomCountSleepGun ถ้าสถานะเปลี่ยน
      if (this.isModified('status')) {
        const oldStatus = this._original?.status || 'Walkin';
        const newStatus = this.status;
        
        if (oldStatus !== newStatus) {
          const increment = newStatus === 'SleepGunWeb' ? 1 : -1;
          await pos.findOneAndUpdate(
            { partnerId: this.partnerId },
            { $inc: { roomCountSleepGun: increment } }
          );
        }
      }
    }
    next();
  } catch (error) {
    console.error('❌ Error in room pre-save middleware:', error);
    next(error);
  }
});

roomSchema.pre('remove', async function(next) {
  try {
    const pos = mongoose.model('pos');
    const building = mongoose.model('building');
    
    // ลดจำนวน room ใน pos
    await pos.findOneAndUpdate(
      { partnerId: this.partnerId },
      { 
        $inc: { 
          roomCount: -1,
          roomCountSleepGun: this.status === 'SleepGunWeb' ? -1 : 0
        },
        $pull: { rooms: this._id }
      }
    );
    
    // ลดจำนวน room ใน building floor
    if (this.buildingId && this.floor) {
      await building.findOneAndUpdate(
        { 
          _id: this.buildingId,
          'floors.name': this.floor 
        },
        { $inc: { 'floors.$.roomCount': -1 } }
      );
    }
    
    next();
  } catch (error) {
    console.error('❌ Error in room pre-remove middleware:', error);
    next(error);
  }
});

function arrayLimit(val) {
  return val.length <= 10;
}

const room = mongoose.model("room", roomSchema);

module.exports = room;
