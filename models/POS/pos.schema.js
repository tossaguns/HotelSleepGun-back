const mongoose = require("mongoose");
const { Schema } = mongoose;

const posSchema = new Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partner",
      required: true,
      index: true
    },
    // ข้อมูลสถิติ
    buildingCount: {
      type: Number,
      default: 0,
    },
    floorCount: {
      type: Number,
      default: 0,
    },
    floorDetail: {
      type: String,
      trim: true,
    },
    roomCount: {
      type: Number,
      default: 0,
    },
    roomCountSleepGun: {
      type: Number,
      default: 0,
    }, 
    quotaRoomSleepGun: {
      type: Number,
      default: 5, // โควต้าเริ่มต้น 5 ห้องต่อ partner
    },
    // การเชื่อมโยงกับไฟล์ลูก
    tags: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "tagPOS",
    }],
    buildings: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "building",
    }],
    rooms: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "room",
    }],
    aboutHotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "aboutHotel",
    },
    // ข้อมูลเพิ่มเติมสำหรับ POS
    posName: {
      type: String,
      trim: true,
      default: "POS System"
    },
    posStatus: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active"
    },
    lastSync: {
      type: Date,
      default: Date.now
    },
    dateStart: { 
      type: Date,
      default: null,
    },
    dateEnd: { 
      type: Date,
      default: null,
    },
    // ข้อมูลสำหรับการค้นหาห้องว่าง
    searchDateRange: {
      startDate: {
        type: Date,
        default: null,
      },
      endDate: {
        type: Date,
        default: null,
      },
      duration: {
        type: Number, // จำนวนวัน
        default: 0,
      }
    },
  },
  {
    timestamps: true,
  }
);

// เพิ่ม index
posSchema.index({ partnerId: 1, posStatus: 1 });
posSchema.index({ posStatus: 1 });

// Virtual fields สำหรับคำนวณสถิติ
posSchema.virtual('totalRooms').get(function() {
  return this.roomCount || 0;
});

posSchema.virtual('availableQuota').get(function() {
  return Math.max(0, this.quotaRoomSleepGun - this.roomCountSleepGun);
});

posSchema.virtual('quotaPercentage').get(function() {
  if (this.quotaRoomSleepGun === 0) return 0;
  return Math.round((this.roomCountSleepGun / this.quotaRoomSleepGun) * 100);
});

posSchema.virtual('isQuotaFull').get(function() {
  return this.roomCountSleepGun >= this.quotaRoomSleepGun;
});

// Pre-save middleware เพื่ออัปเดตสถิติ
posSchema.pre('save', async function(next) {
  try {
    // อัปเดตจำนวน buildings
    if (this.buildings && this.buildings.length > 0) {
      this.buildingCount = this.buildings.length;
    }
    
    // อัปเดตจำนวน rooms
    if (this.rooms && this.rooms.length > 0) {
      this.roomCount = this.rooms.length;
    }
    
    this.lastSync = new Date();
    next();
  } catch (error) {
    console.error('❌ Error in pos pre-save middleware:', error);
    next(error);
  }
});

// Method สำหรับอัปเดตสถิติจากข้อมูลจริง
posSchema.methods.updateStatistics = async function() {
  const Building = mongoose.model('building');
  const Room = mongoose.model('room');
  const TagPOS = mongoose.model('tagPOS');
  const AboutHotel = mongoose.model('aboutHotel');
  
  try {
    // นับจำนวน buildings
    this.buildingCount = await Building.countDocuments({ partnerId: this.partnerId });
    
    // นับจำนวน rooms
    this.roomCount = await Room.countDocuments({ partnerId: this.partnerId });
    
    // นับจำนวน rooms ที่เป็น SleepGunWeb
    this.roomCountSleepGun = await Room.countDocuments({ 
      partnerId: this.partnerId, 
      status: "SleepGunWeb" 
    });
    
    // นับจำนวน tags
    const tagCount = await TagPOS.countDocuments({ partnerId: this.partnerId });
    
    // ดึง aboutHotel
    const aboutHotelData = await AboutHotel.findOne({ partnerId: this.partnerId });
    if (aboutHotelData) {
      this.aboutHotel = aboutHotelData._id;
    }
    
    this.lastSync = new Date();
    await this.save();
    
    return {
      buildingCount: this.buildingCount,
      roomCount: this.roomCount,
      roomCountSleepGun: this.roomCountSleepGun,
      tagCount: tagCount,
      aboutHotel: this.aboutHotel,
      lastSync: this.lastSync
    };
  } catch (error) {
    throw error;
  }
};

// Method สำหรับดึงข้อมูลสรุป
posSchema.methods.getSummary = async function() {
  const Building = mongoose.model('building');
  const Room = mongoose.model('room');
  const TagPOS = mongoose.model('tagPOS');
  const AboutHotel = mongoose.model('aboutHotel');
  
  const [buildings, rooms, tags, aboutHotel] = await Promise.all([
    Building.find({ partnerId: this.partnerId }),
    Room.find({ partnerId: this.partnerId }),
    TagPOS.find({ partnerId: this.partnerId }),
    AboutHotel.findOne({ partnerId: this.partnerId })
  ]);
  
  return {
    buildingCount: buildings.length,
    roomCount: rooms.length,
    tagCount: tags.length,
    sleepGunRooms: rooms.filter(r => r.status === 'SleepGunWeb').length,
    availableRooms: rooms.filter(r => r.statusRoom === 'ว่าง').length,
    occupiedRooms: rooms.filter(r => r.statusRoom === 'ไม่ว่าง').length,
    cleaningRooms: rooms.filter(r => r.statusRoom === 'กำลังทำความสะอาด').length,
    hasAboutHotel: !!aboutHotel,
    quotaInfo: {
      current: rooms.filter(r => r.status === 'SleepGunWeb').length,
      max: this.quotaRoomSleepGun,
      available: Math.max(0, this.quotaRoomSleepGun - rooms.filter(r => r.status === 'SleepGunWeb').length)
    }
  };
};

const pos = mongoose.model("pos", posSchema);

module.exports = pos;
