const mongoose = require("mongoose");
const { Schema } = mongoose;

const tagPOSSchema = new Schema(
  {
    partnerId: { 
      type: Schema.Types.ObjectId, 
      ref: 'partner', 
      required: true,
      index: true
    },
    posId: { 
      type: Schema.Types.ObjectId, 
      ref: 'pos', 
      required: true,
      index: true
    },
    name: {
      type: String,
      trim: true,
      required: true,
      minlength: 1,
      maxlength: 50
    },
    description: {
      type: String,
      default: "",
      maxlength: 200
    },
    color: {
      type: String,
      default: "#FFBB00",
      validate: {
        validator: function(v) {
          return /^#[0-9A-F]{6}$/i.test(v);
        },
        message: 'Color must be a valid hex color code'
      }
    },
  },
  {
    timestamps: true,
  }
);

// เพิ่ม index
tagPOSSchema.index({ partnerId: 1, name: 1 });

// Virtual fields
tagPOSSchema.virtual('isDefaultColor').get(function() {
  return this.color === '#FFBB00';
});

// Pre-save middleware
tagPOSSchema.pre('save', async function(next) {
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
        
        // อัปเดต tags array
        await pos.findOneAndUpdate(
          { partnerId: this.partnerId },
          { $push: { tags: this._id } }
        );
      }
    }
    next();
  } catch (error) {
    console.error('❌ Error in tag pre-save middleware:', error);
    next(error);
  }
});

tagPOSSchema.pre('remove', async function(next) {
  try {
    // ลบ tag จาก pos
    const pos = mongoose.model('pos');
    await pos.findOneAndUpdate(
      { partnerId: this.partnerId },
      { $pull: { tags: this._id } }
    );
    next();
  } catch (error) {
    console.error('❌ Error in tag pre-remove middleware:', error);
    next(error);
  }
});

// Method สำหรับตรวจสอบว่า tag นี้ใช้กับห้องอื่นหรือไม่
tagPOSSchema.methods.isUsedByOtherRooms = async function() {
  const Room = mongoose.model('room');
  const count = await Room.countDocuments({
    tag: this._id,
    partnerId: this.partnerId
  });
  return count > 0;
};

const tagPOS = mongoose.model(
  "tagPOS",
  tagPOSSchema
);

module.exports = tagPOS;
