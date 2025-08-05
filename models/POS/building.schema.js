const mongoose = require("mongoose");
const { Schema } = mongoose;

const buildingSchema = new Schema(
  {
    posId: { 
      type: Schema.Types.ObjectId, 
      ref: 'pos', 
      required: true,
      index: true
    },
    partnerId: { 
      type: Schema.Types.ObjectId, 
      ref: 'partner', 
      required: true,
      index: true
    },
    hascolorBG: { type: String, enum: ['colorBG', 'imgBG'], default: 'colorBG' },
    nameBuilding: { 
      type: String,
      required: true,
      trim: true
    },

    colorText: { type: String },
    colorBG: {
      type: String,
      default: "#FFBB00",
    },
    imgBG: { type: String },

    // เพิ่ม floors field เพื่อเก็บข้อมูลชั้นในแต่ละตึก
    floors: [{
      name: { type: String, required: true },
      description: { type: String },
      roomCount: { type: Number, default: 0 },
      createdAt: { type: Date, default: Date.now }
    }],

  },
  { timestamps: true }
);

// เพิ่ม index
buildingSchema.index({ partnerId: 1, posId: 1 });

// Virtual fields
buildingSchema.virtual('totalRooms').get(function() {
  return this.floors.reduce((total, floor) => total + (floor.roomCount || 0), 0);
});

buildingSchema.virtual('totalFloors').get(function() {
  return this.floors ? this.floors.length : 0;
});

buildingSchema.virtual('hasRooms').get(function() {
  return this.totalRooms > 0;
});

// Pre-save middleware
buildingSchema.pre('save', async function(next) {
  try {
    // อัปเดตสถิติใน pos เมื่อมีการเปลี่ยนแปลง
    if (this.isModified()) {
      const pos = mongoose.model('pos');
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
        
        await pos.findOneAndUpdate(
          { partnerId: this.partnerId },
          { 
            $inc: { buildingCount: 1 },
            $push: { buildings: this._id }
          }
        );
      }
    }
    next();
  } catch (error) {
    console.error('❌ Error in building pre-save middleware:', error);
    next(error);
  }
});

buildingSchema.pre('remove', async function(next) {
  try {
    // ลดจำนวน building ใน pos
    const pos = mongoose.model('pos');
    await pos.findOneAndUpdate(
      { partnerId: this.partnerId },
      { 
        $inc: { buildingCount: -1 },
        $pull: { buildings: this._id }
      }
    );
    next();
  } catch (error) {
    console.error('❌ Error in building pre-remove middleware:', error);
    next(error);
  }
});

// Method สำหรับอัปเดตจำนวนห้องในชั้น
buildingSchema.methods.updateFloorRoomCount = async function(floorName, increment = 1) {
  const floorIndex = this.floors.findIndex(floor => floor.name === floorName);
  if (floorIndex !== -1) {
    this.floors[floorIndex].roomCount = Math.max(0, (this.floors[floorIndex].roomCount || 0) + increment);
    await this.save();
  }
  return this;
};

const building = mongoose.model("building", buildingSchema);
module.exports = building; 