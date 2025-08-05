const pos = require("../../models/POS/pos.schema");
const building = require("../../models/POS/building.schema");
const room = require("../../models/POS/room.schema");
const tagPOS = require("../../models/POS/tag.schema");
const checkInOrder = require("../../models/POS/checkInOrder.schema");
const aboutHotel = require("../../models/aboutHotel/aboutHotel.schema");
const typeRoom = require("../../models/typeHotel/typeRoom.schema");
const typeRoomHotel = require("../../models/typeHotel/typeRoomHotel.schema");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==================== MULTER CONFIGURATION ====================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/room");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { files: 10 },
}).array("imgrooms", 10);

// ==================== HELPER FUNCTIONS ====================
// ฟังก์ชัน helper สำหรับตรวจสอบและอัปเดต posId ของ building
const ensureBuildingPosId = async (buildingDoc, partnerId) => {
  if (!buildingDoc.posId) {
    // หา POS data สำหรับ partner นี้
    let posData = await pos.findOne({ partnerId });
    if (!posData) {
      // สร้าง POS ใหม่ถ้าไม่มี
      posData = new pos({
        partnerId,
        buildingCount: 0,
        floorCount: 0,
        roomCount: 0,
        roomCountSleepGun: 0,
        quotaRoomSleepGun: 5
      });
      await posData.save();
      console.log('✅ Created new POS for partner:', partnerId);
    }
    buildingDoc.posId = posData._id;
    console.log('🔧 Updated building posId:', buildingDoc.posId);
  }
  return buildingDoc;
};

const updatePosStatistics = async (partnerId) => {
  try {
    console.log('🔄 Updating POS statistics for partnerId:', partnerId);
    
    // ดึงข้อมูลปัจจุบัน
    const [buildings, rooms, aboutHotelData] = await Promise.all([
      building.find({ partnerId }).catch(err => {
        console.log('⚠️ Error fetching buildings for statistics:', err.message);
        return [];
      }),
      room.find({ partnerId }).catch(err => {
        console.log('⚠️ Error fetching rooms for statistics:', err.message);
        return [];
      }),
      aboutHotel.findOne({ partnerId }).catch(err => {
        console.log('⚠️ Error fetching aboutHotel for statistics:', err.message);
        return null;
      })
    ]);
    
    const sleepGunRooms = rooms.filter(room => room.status === 'SleepGunWeb');
    
    let totalFloorCount = 0;
    buildings.forEach(buildingDoc => {
      if (buildingDoc.floors && Array.isArray(buildingDoc.floors)) {
        totalFloorCount += buildingDoc.floors.length;
      }
    });
    
    // อัปเดตหรือสร้างข้อมูล POS
    const posData = await pos.findOne({ partnerId });
    if (posData) {
      posData.buildingCount = buildings.length;
      posData.floorCount = totalFloorCount;
      posData.roomCount = rooms.length;
      posData.roomCountSleepGun = sleepGunRooms.length;
      posData.quotaRoomSleepGun = 5;
      posData.aboutHotel = aboutHotelData ? aboutHotelData._id : null;
      await posData.save();
      console.log('✅ Updated existing POS statistics');
    } else {
      // สร้างข้อมูล POS ใหม่
      const newPos = new pos({
        partnerId,
        buildingCount: buildings.length,
        floorCount: totalFloorCount,
        roomCount: rooms.length,
        roomCountSleepGun: sleepGunRooms.length,
        quotaRoomSleepGun: 5,
        aboutHotel: aboutHotelData ? aboutHotelData._id : null
      });
      await newPos.save();
      console.log('✅ Created new POS statistics');
    }
  } catch (error) {
    console.error("❌ Error updating POS statistics:", error);
  }
};

// ==================== POS CONTROLLERS ====================
const createPos = async (req, res) => {
  try {
    const { buildingCount, floorCount, floorDetail, roomCount, roomCountSleepGun, quotaRoomSleepGun, tag, building, room } = req.body;
    const partnerId = req.partner.id;
    console.log('🔍 Creating POS for partnerId:', partnerId);

    if (buildingCount === undefined || floorCount === undefined || roomCount === undefined) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
      });
    }

    const newPos = new pos({
      partnerId,
      buildingCount: buildingCount || 0,
      floorCount: floorCount || 0,
      floorDetail: floorDetail || '',
      roomCount: roomCount || 0,
      roomCountSleepGun: roomCountSleepGun || 0,
      quotaRoomSleepGun: quotaRoomSleepGun || 5,
      tags: tag ? [tag] : [],
      buildings: building ? [building] : [],
      rooms: room ? [room] : [],
    });

    const savedPos = await newPos.save();
    console.log('✅ POS created successfully for partner:', partnerId);
    
    res.status(201).json({
      success: true,
      message: "สร้าง POS เรียบร้อยแล้ว",
      data: savedPos,
    });
  } catch (error) {
    console.error("❌ Error creating POS:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้าง POS",
      error: error.message,
    });
  }
};

const getAllPos = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    console.log('🔍 Getting POS data for partnerId:', partnerId);
    
    // ดึงข้อมูล POS พื้นฐาน
    const posData = await pos.find({ partnerId }).sort({ createdAt: -1 });
    console.log('📊 Found POS records:', posData.length);

    // ดึงข้อมูลที่เกี่ยวข้องแยกกัน
    const [tags, buildings, rooms, aboutHotelData] = await Promise.all([
      tagPOS.find({ partnerId }).catch(err => {
        console.log('⚠️ Error fetching tags:', err.message);
        return [];
      }),
      building.find({ partnerId }).catch(err => {
        console.log('⚠️ Error fetching buildings:', err.message);
        return [];
      }),
      room.find({ partnerId })
        .populate('typeRoom')
        .populate('typeRoomHotel')
        .populate('tag', 'name color description')
        .catch(err => {
          console.log('⚠️ Error fetching rooms:', err.message);
          return [];
        }),
      aboutHotel.findOne({ partnerId }).catch(err => {
        console.log('⚠️ Error fetching aboutHotel:', err.message);
        return null;
      })
    ]);

    console.log('📦 Fetched related data:', {
      tags: tags.length,
      buildings: buildings.length,
      rooms: rooms.length,
      hasAboutHotel: !!aboutHotelData
    });

    // รวมข้อมูลเข้าด้วยกัน
    const enrichedPosData = posData.map(posItem => ({
      ...posItem.toObject(),
      tags: tags,
      buildings: buildings,
      rooms: rooms,
      aboutHotel: aboutHotelData
    }));

    console.log('✅ Enriched POS data ready, sending response');

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูล POS เรียบร้อยแล้ว",
      data: enrichedPosData,
    });
  } catch (error) {
    console.error("❌ Error fetching POS:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล POS",
      error: error.message,
    });
  }
};

const getPosById = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner.id;
    console.log('🔍 Getting POS by ID:', id, 'for partnerId:', partnerId);
    
    const posData = await pos.findOne({ _id: id, partnerId });

    if (!posData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูล POS",
      });
    }

    // ดึงข้อมูลที่เกี่ยวข้อง
    const [tags, buildings, rooms, aboutHotelData] = await Promise.all([
      tagPOS.find({ partnerId }).catch(err => {
        console.log('⚠️ Error fetching tags for POS by ID:', err.message);
        return [];
      }),
      building.find({ partnerId }).catch(err => {
        console.log('⚠️ Error fetching buildings for POS by ID:', err.message);
        return [];
      }),
      room.find({ partnerId })
        .populate('typeRoom')
        .populate('typeRoomHotel')
        .populate('tag', 'name color description')
        .catch(err => {
          console.log('⚠️ Error fetching rooms for POS by ID:', err.message);
          return [];
        }),
      aboutHotel.findOne({ partnerId }).catch(err => {
        console.log('⚠️ Error fetching aboutHotel for POS by ID:', err.message);
        return null;
      })
    ]);

    console.log('📦 Fetched related data for POS by ID:', {
      tags: tags.length,
      buildings: buildings.length,
      rooms: rooms.length,
      hasAboutHotel: !!aboutHotelData
    });

    // รวมข้อมูลเข้าด้วยกัน
    const enrichedPosData = {
      ...posData.toObject(),
      tags: tags,
      buildings: buildings,
      rooms: rooms,
      aboutHotel: aboutHotelData
    };

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูล POS เรียบร้อยแล้ว",
      data: enrichedPosData,
    });
  } catch (error) {
    console.error("❌ Error fetching POS:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล POS",
      error: error.message,
    });
  }
};

const getPosSummary = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    console.log('🔍 Getting POS summary for partnerId:', partnerId);
    
    // ดึงข้อมูลจริงจากตารางต่างๆ
    const [buildings, rooms, aboutHotelData] = await Promise.all([
      building.find({ partnerId }).catch(err => {
        console.log('⚠️ Error fetching buildings for summary:', err.message);
        return [];
      }),
      room.find({ partnerId }).catch(err => {
        console.log('⚠️ Error fetching rooms for summary:', err.message);
        return [];
      }),
      aboutHotel.findOne({ partnerId }).catch(err => {
        console.log('⚠️ Error fetching aboutHotel for summary:', err.message);
        return null;
      })
    ]);
    
    console.log('🏢 Found buildings:', buildings.length);
    console.log('🏠 Found rooms:', rooms.length);
    
    // นับจำนวนห้องที่เป็น SleepGunWeb
    const sleepGunRooms = rooms.filter(room => room.status === 'SleepGunWeb');
    console.log('💤 SleepGun rooms:', sleepGunRooms.length);
    
    // คำนวณจำนวนชั้นทั้งหมด
    let totalFloorCount = 0;
    buildings.forEach(buildingDoc => {
      if (buildingDoc.floors && Array.isArray(buildingDoc.floors)) {
        totalFloorCount += buildingDoc.floors.length;
      }
    });
    console.log('🏢 Total floors:', totalFloorCount);
    
    const summary = {
      totalBuildingCount: buildings.length,
      totalFloorCount: totalFloorCount,
      totalRoomCount: rooms.length,
      totalRoomCountSleepGun: sleepGunRooms.length,
      totalQuotaRoomSleepGun: 5, // โควต้าเริ่มต้น
      totalPosRecords: buildings.length + rooms.length,
      hasAboutHotel: !!aboutHotelData,
      aboutHotelSummary: aboutHotelData && typeof aboutHotelData.getSummary === 'function' ? aboutHotelData.getSummary() : null,
      roomStatusSummary: {
        available: rooms.filter(r => r.statusRoom === 'ว่าง').length,
        occupied: rooms.filter(r => r.statusRoom === 'ไม่ว่าง').length,
        cleaning: rooms.filter(r => r.statusRoom === 'กำลังทำความสะอาด').length
      }
    };

    console.log('📊 POS Summary:', summary);

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูลสรุป POS เรียบร้อยแล้ว",
      data: summary,
    });
  } catch (error) {
    console.error("❌ Error fetching POS summary:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลสรุป POS",
      error: error.message,
    });
  }
};

const updatePos = async (req, res) => {
  try {
    const { id } = req.params;
    const { buildingCount, floorCount, floorDetail, roomCount, roomCountSleepGun, quotaRoomSleepGun, tag, building, room } = req.body;
    const partnerId = req.partner.id;
    console.log('🔍 Updating POS by ID:', { id, partnerId, updateData: req.body });

    const existingPos = await pos.findOne({ _id: id, partnerId });
    if (!existingPos) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูล POS",
      });
    }

    const updatedPos = await pos.findByIdAndUpdate(
      id,
      { buildingCount, floorCount, floorDetail, roomCount, roomCountSleepGun, quotaRoomSleepGun, tag, building, room },
      { new: true }
    ).populate('tag', 'name color')
     .populate('building', 'nameBuilding colorText hascolorBG colorBG imgBG')
     .populate('room', 'roomNumber price typeRoom air statusRoom status statusPromotion');

    console.log('✅ POS updated successfully:', id);

    res.status(200).json({
      success: true,
      message: "อัปเดตข้อมูล POS เรียบร้อยแล้ว",
      data: updatedPos,
    });
  } catch (error) {
    console.error("❌ Error updating POS:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล POS",
      error: error.message,
    });
  }
};

const deletePos = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner.id;
    console.log('🔍 Deleting POS by ID:', { id, partnerId });

    const existingPos = await pos.findOne({ _id: id, partnerId });
    if (!existingPos) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูล POS",
      });
    }

    const deletedPos = await pos.findByIdAndDelete(id);

    console.log('🗑️ Deleted POS:', id);

    res.status(200).json({
      success: true,
      message: "ลบ POS เรียบร้อยแล้ว",
      data: deletedPos,
    });
  } catch (error) {
    console.error("❌ Error deleting POS:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบ POS",
      error: error.message,
    });
  }
};

const deleteAllPos = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    console.log('🔍 Deleting all POS for partnerId:', partnerId);
    
    const deletedPos = await pos.deleteMany({ partnerId });

    console.log('🗑️ Deleted POS count:', deletedPos.deletedCount);

    res.status(200).json({
      success: true,
      message: "ลบ POS ทั้งหมดเรียบร้อยแล้ว",
      data: { deletedCount: deletedPos.deletedCount },
    });
  } catch (error) {
    console.error("❌ Error deleting all POS:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบ POS ทั้งหมด",
      error: error.message,
    });
  }
};

// ==================== BUILDING CONTROLLERS ====================
const createBuilding = async (req, res) => {
  try {
    const { nameBuilding, colorText, hascolorBG, colorBG, imgBG } = req.body;
    const partnerId = req.partner.id;
    console.log('🔍 Creating building:', { nameBuilding, partnerId });

    if (!nameBuilding || !colorText || !hascolorBG) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
      });
    }

    if (hascolorBG === 'imgBG' && imgBG && !imgBG.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: "รูปแบบรูปภาพไม่ถูกต้อง กรุณาเลือกรูปภาพใหม่",
      });
    }

    // ดึงหรือสร้าง posId จาก partner
    let posData = await pos.findOne({ partnerId });
    if (!posData) {
      // สร้างข้อมูล POS ใหม่สำหรับ partner นี้
      posData = new pos({
        partnerId,
        buildingCount: 0,
        floorCount: 0,
        roomCount: 0,
        roomCountSleepGun: 0,
        quotaRoomSleepGun: 5
      });
      await posData.save();
      console.log('✅ Created new POS for partner:', partnerId);
    }

    const newBuilding = new building({
      partnerId,
      posId: posData._id,
      nameBuilding,
      colorText,
      hascolorBG,
      colorBG: hascolorBG === 'colorBG' ? colorBG : undefined,
      imgBG: hascolorBG === 'imgBG' ? imgBG : undefined,
      floors: [] // เริ่มต้นด้วยชั้นว่าง
    });

    const savedBuilding = await newBuilding.save();
    console.log('✅ Building saved, updating statistics...');
    await updatePosStatistics(partnerId);

    console.log('✅ Building created successfully:', savedBuilding.nameBuilding);

    res.status(201).json({
      success: true,
      message: "สร้างตึกเรียบร้อยแล้ว",
      data: savedBuilding,
    });
  } catch (error) {
    console.error("❌ Error creating building:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างตึก",
      error: error.message,
    });
  }
};

// เพิ่มฟังก์ชันสำหรับเพิ่มชั้นในตึก
const addFloorToBuilding = async (req, res) => {
  try {
    const { buildingId } = req.params;
    const { name, description } = req.body;
    const partnerId = req.partner.id;
    console.log('🔍 Adding floor to building:', { buildingId, name, partnerId });

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "ชื่อชั้นเป็นข้อมูลที่จำเป็น",
      });
    }

    const buildingData = await building.findOne({ _id: buildingId, partnerId });
    if (!buildingData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลตึก",
      });
    }

    // ตรวจสอบและอัปเดต posId ถ้าจำเป็น
    await ensureBuildingPosId(buildingData, partnerId);

    // ตรวจสอบว่าชั้นนี้มีอยู่แล้วหรือไม่
    const existingFloor = buildingData.floors.find(floor => floor.name === name.trim());
    if (existingFloor) {
      return res.status(400).json({
        success: false,
        message: "ชั้นนี้มีอยู่แล้วในตึกนี้",
      });
    }

    // เพิ่มชั้นใหม่
    buildingData.floors.push({
      name: name.trim(),
      description: description || "",
      roomCount: 0
    });

    const updatedBuilding = await buildingData.save();
    console.log('✅ Floor added, updating statistics...');
    await updatePosStatistics(partnerId);

    console.log('✅ Floor added successfully:', { buildingName: buildingData.nameBuilding, floorName: name.trim() });

    res.status(200).json({
      success: true,
      message: "เพิ่มชั้นเรียบร้อยแล้ว",
      data: updatedBuilding,
    });
  } catch (error) {
    console.error("❌ Error adding floor to building:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการเพิ่มชั้น",
      error: error.message,
    });
  }
};

// เพิ่มฟังก์ชันสำหรับลบชั้นจากตึก
const removeFloorFromBuilding = async (req, res) => {
  try {
    const { buildingId, floorName } = req.params;
    const partnerId = req.partner.id;
    console.log('🔍 Removing floor from building:', { buildingId, floorName, partnerId });

    const buildingData = await building.findOne({ _id: buildingId, partnerId });
    if (!buildingData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลตึก",
      });
    }

    // ตรวจสอบและอัปเดต posId ถ้าจำเป็น
    await ensureBuildingPosId(buildingData, partnerId);

    // ตรวจสอบว่ามีห้องในชั้นนี้หรือไม่
    const roomCount = await room.countDocuments({ 
      buildingId: buildingId, 
      floor: floorName,
      partnerId: partnerId 
    });

    if (roomCount > 0) {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถลบชั้นได้ เนื่องจากมีห้อง ${roomCount} ห้องในชั้นนี้`,
      });
    }

    // ลบชั้นออก
    buildingData.floors = buildingData.floors.filter(floor => floor.name !== floorName);
    const updatedBuilding = await buildingData.save();
    console.log('✅ Floor removed, updating statistics...');
    await updatePosStatistics(partnerId);

    console.log('✅ Floor removed successfully:', { buildingName: buildingData.nameBuilding, floorName });

    res.status(200).json({
      success: true,
      message: "ลบชั้นเรียบร้อยแล้ว",
      data: updatedBuilding,
    });
  } catch (error) {
    console.error("❌ Error removing floor from building:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบชั้น",
      error: error.message,
    });
  }
};

// เพิ่มฟังก์ชันสำหรับดึงชั้นในตึก
const getFloorsByBuilding = async (req, res) => {
  try {
    const { buildingId } = req.params;
    const partnerId = req.partner.id;
    console.log('🔍 Getting floors by building:', { buildingId, partnerId });

    const buildingData = await building.findOne({ _id: buildingId, partnerId });
    if (!buildingData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลตึก",
      });
    }

    console.log('🏢 Found floors for building:', buildingData.nameBuilding, 'floors:', buildingData.floors?.length || 0);

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูลชั้นเรียบร้อยแล้ว",
      data: buildingData.floors,
    });
  } catch (error) {
    console.error("❌ Error getting floors by building:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลชั้น",
      error: error.message,
    });
  }
};

// แก้ไขฟังก์ชัน getAllBuildings เพื่อ populate floors
const getAllBuildings = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    console.log('🔍 Getting buildings for partnerId:', partnerId);
    
    const buildings = await building.find({ partnerId }).sort({ createdAt: -1 });

    console.log('🏢 Found buildings:', buildings.length);

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูลตึกเรียบร้อยแล้ว",
      data: buildings,
    });
  } catch (error) {
    console.error("❌ Error fetching buildings:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลตึก",
      error: error.message,
    });
  }
};

const getBuildingById = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner.id;
    console.log('🔍 Getting building by ID:', id, 'for partnerId:', partnerId);
    
    const buildingData = await building.findOne({ _id: id, partnerId });

    if (!buildingData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลตึก",
      });
    }

    console.log('🏢 Found building by ID:', buildingData.nameBuilding);

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูลตึกเรียบร้อยแล้ว",
      data: buildingData,
    });
  } catch (error) {
    console.error("❌ Error fetching building:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลตึก",
      error: error.message,
    });
  }
};

const updateBuilding = async (req, res) => {
  try {
    const { id } = req.params;
    const { nameBuilding, colorText, hascolorBG, colorBG, imgBG } = req.body;
    const partnerId = req.partner.id;
    console.log('🔍 Updating building by ID:', { id, partnerId, updateData: req.body });

    const existingBuilding = await building.findOne({ _id: id, partnerId });
    if (!existingBuilding) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลตึก",
      });
    }

    const updatedBuilding = await building.findByIdAndUpdate(
      id,
      {
        nameBuilding,
        colorText,
        hascolorBG,
        colorBG: hascolorBG === 'colorBG' ? colorBG : undefined,
        imgBG: hascolorBG === 'imgBG' ? imgBG : undefined,
      },
      { new: true }
    );

    console.log('✅ Building updated, updating statistics...');
    await updatePosStatistics(partnerId);

    console.log('✅ Building updated successfully:', updatedBuilding.nameBuilding);

    res.status(200).json({
      success: true,
      message: "อัปเดตข้อมูลตึกเรียบร้อยแล้ว",
      data: updatedBuilding,
    });
  } catch (error) {
    console.error("❌ Error updating building:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลตึก",
      error: error.message,
    });
  }
};

const deleteBuilding = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner.id;
    console.log('🔍 Deleting building by ID:', { id, partnerId });

    const existingBuilding = await building.findOne({ _id: id, partnerId });
    if (!existingBuilding) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลตึก",
      });
    }

    const deletedBuilding = await building.findByIdAndDelete(id);
    console.log('✅ Building deleted, updating statistics...');
    await updatePosStatistics(partnerId);

    console.log('🗑️ Deleted building:', existingBuilding.nameBuilding);

    res.status(200).json({
      success: true,
      message: "ลบตึกเรียบร้อยแล้ว",
      data: deletedBuilding,
    });
  } catch (error) {
    console.error("❌ Error deleting building:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบตึก",
      error: error.message,
    });
  }
};

// ==================== ROOM CONTROLLERS ====================
const createRoom = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      const imgrooms = req.files ? req.files.map((file) => file.filename) : [];
      console.log('🔍 Creating room:', { roomNumber: req.body.roomNumber, buildingId: req.body.buildingId, floor: req.body.floor });

      if (!req.body.typeRoom) {
        return res.status(400).json({
          success: false,
          message: "typeRoom เป็นข้อมูลที่จำเป็น"
        });
      }

      if (!req.body.buildingId) {
        return res.status(400).json({
          success: false,
          message: "buildingId เป็นข้อมูลที่จำเป็น"
        });
      }

      if (!req.body.floor) {
        return res.status(400).json({
          success: false,
          message: "floor เป็นข้อมูลที่จำเป็น"
        });
      }

      // ดึงหรือสร้าง posId จาก partner
      let posData = await pos.findOne({ partnerId: req.partner.id });
      if (!posData) {
        // สร้างข้อมูล POS ใหม่สำหรับ partner นี้
        posData = new pos({
          partnerId: req.partner.id,
          buildingCount: 0,
          floorCount: 0,
          roomCount: 0,
          roomCountSleepGun: 0,
          quotaRoomSleepGun: 5
        });
        await posData.save();
        console.log('✅ Created new POS for partner:', req.partner.id);
      }

      const roomData = {
        roomNumber: req.body.roomNumber,
        price: req.body.price,
        stayPeople: req.body.stayPeople,
        roomDetail: req.body.roomDetail,
        air: req.body.air,
        floor: req.body.floor,
        buildingId: req.body.buildingId,
        posId: posData._id,
        imgrooms: imgrooms,
        typeRoom: req.body.typeRoom,
        typeRoomHotel: req.body.typeRoomHotel
          ? Array.isArray(req.body.typeRoomHotel)
            ? req.body.typeRoomHotel
            : [req.body.typeRoomHotel]
          : [],
        tag: req.body.tag ? (Array.isArray(req.body.tag) ? req.body.tag : [req.body.tag]) : [],
        partnerId: req.partner.id,
      };

      const newRoom = new room(roomData);
      const savedRoom = await newRoom.save();

      // อัปเดต roomCount ในชั้น
      const buildingData = await building.findById(req.body.buildingId);
      if (buildingData) {
        // ตรวจสอบและอัปเดต posId ถ้าจำเป็น
        await ensureBuildingPosId(buildingData, req.partner.id);
        
        const floorIndex = buildingData.floors.findIndex(floor => floor.name === req.body.floor);
        if (floorIndex !== -1) {
          buildingData.floors[floorIndex].roomCount += 1;
          await buildingData.save();
        }
      }

      console.log('✅ Room created, updating statistics...');
      await updatePosStatistics(req.partner.id);

      console.log('✅ Room created successfully:', savedRoom.roomNumber);

      res.status(201).json({
        success: true,
        message: "สร้างห้องพักเรียบร้อยแล้ว",
        data: savedRoom,
      });
    } catch (error) {
      console.error("❌ Error creating room:", error);
      res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการสร้างห้องพัก",
        error: error.message,
      });
    }
  });
};

const getAllRooms = async (req, res) => {
  try {
    console.log('🔍 getAllRooms function called');
    console.log('🔍 req.partner:', req.partner);
    
    const partnerId = req.partner?.id;
    console.log('🔍 Getting rooms for partnerId:', partnerId);
    
    // ตรวจสอบว่า partnerId มีค่าหรือไม่
    if (!partnerId) {
      console.error('❌ Partner ID is missing');
      return res.status(400).json({
        success: false,
        message: "ไม่พบ Partner ID",
      });
    }

    // ตรวจสอบว่า room model ถูก import มาหรือไม่
    if (!room) {
      console.error('❌ Room model is not imported');
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลด model",
      });
    }

    console.log('🔍 About to query database for rooms');
    const rooms = await room.find({ partnerId })
      .populate("typeRoom")
      .populate("typeRoomHotel")
      .populate("tag", "name color description")
      .populate("buildingId", "nameBuilding")
      .sort({ createdAt: -1 });

    console.log('🏠 Found rooms:', rooms.length);
    console.log('🏠 First room sample:', rooms[0]);

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูลห้องพักเรียบร้อยแล้ว",
      data: rooms,
    });
  } catch (error) {
    console.error("❌ Error fetching rooms:", error);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก",
      error: error.message,
    });
  }
};

// เพิ่มฟังก์ชันสำหรับดึงห้องตามตึกและชั้น
const getRoomsByBuildingAndFloor = async (req, res) => {
  try {
    const { buildingId, floor } = req.params;
    const partnerId = req.partner.id;
    console.log('🔍 Getting rooms by building and floor:', { buildingId, floor, partnerId });
    
    const rooms = await room.find({ 
      partnerId: partnerId,
      buildingId: buildingId,
      floor: floor 
    })
      .populate("typeRoom")
      .populate("typeRoomHotel")
      .populate("buildingId", "nameBuilding")
      .populate("tag", "name color description");
      
    console.log('🏠 Found rooms by building and floor:', rooms.length);
      
    res.status(200).json({
      success: true,
      message: `ดึงข้อมูลห้องพักในตึก ${buildingId} ชั้น ${floor} เรียบร้อยแล้ว`,
      data: rooms
    });
  } catch (error) {
    console.error("❌ Error fetching rooms by building and floor:", error);
    res.status(500).json({ 
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก",
      error: error.message 
    });
  }
};

const getRoomsByFloor = async (req, res) => {
  try {
    const { buildingId, floor } = req.params;
    const partnerId = req.partner.id;
    console.log('🔍 Getting rooms by floor:', { buildingId, floor, partnerId });
    
    const rooms = await room.find({ 
      partnerId: partnerId,
      buildingId: buildingId,
      floor: floor 
    })
      .populate("typeRoom")
      .populate("typeRoomHotel")
      .populate("buildingId", "nameBuilding")
      .populate("tag", "name color description");
      
    console.log('🏠 Found rooms by floor:', rooms.length);
      
    res.status(200).json({
      success: true,
      message: `ดึงข้อมูลห้องพักในตึก ${buildingId} ชั้น ${floor} เรียบร้อยแล้ว`,
      data: rooms
    });
  } catch (error) {
    console.error("❌ Error fetching rooms by floor:", error);
    res.status(500).json({ 
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก",
      error: error.message 
    });
  }
};

const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Getting room by ID:', id);
    
    const roomData = await room.findById(id)
      .populate("typeRoom")
      .populate("typeRoomHotel")
      .populate("tag", "name color description");
    
    if (!roomData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลห้องพัก",
      });
    }
    
    console.log('🏠 Found room by ID:', roomData.roomNumber);
    
    res.status(200).json({
      success: true,
      message: "ดึงข้อมูลห้องพักเรียบร้อยแล้ว",
      data: roomData,
    });
  } catch (error) {
    console.error("❌ Error fetching room by ID:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก",
      error: error.message,
    });
  }
};

const updateRoom = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    try {
      const { id } = req.params;
      console.log('🔍 Updating room by ID:', { id, updateData: req.body });
      
      const roomData = await room.findById(id);
      if (!roomData) {
        return res.status(404).json({
          success: false,
          message: "ไม่พบข้อมูลห้องพัก"
        });
      }

      roomData.roomNumber = req.body.roomNumber ?? roomData.roomNumber;
      roomData.price = req.body.price ?? roomData.price;
      roomData.stayPeople = req.body.stayPeople ?? roomData.stayPeople;
      roomData.roomDetail = req.body.roomDetail ?? roomData.roomDetail;
      roomData.air = req.body.air ?? roomData.air;
      roomData.floor = req.body.floor ?? roomData.floor; // เพิ่ม floor field
      roomData.typeRoom = req.body.typeRoom ?? roomData.typeRoom;
      roomData.typeRoomHotel = req.body.typeRoomHotel
        ? Array.isArray(req.body.typeRoomHotel)
          ? req.body.typeRoomHotel
          : [req.body.typeRoomHotel]
        : roomData.typeRoomHotel;

      // อัปเดต tag
      if (req.body.tag !== undefined) {
        roomData.tag = req.body.tag ? (Array.isArray(req.body.tag) ? req.body.tag : [req.body.tag]) : [];
      }

      if (req.files && req.files.length > 0) {
        roomData.imgrooms = req.files.map((file) => file.filename);
      }

      const updatedRoom = await roomData.save();
      console.log('✅ Room updated, updating statistics...');
      await updatePosStatistics(req.partner.id);

      console.log('✅ Room updated successfully:', updatedRoom.roomNumber);

      res.status(200).json({
        success: true,
        message: "อัปเดตข้อมูลห้องพักเรียบร้อยแล้ว",
        data: updatedRoom,
      });
    } catch (error) {
      console.error("❌ Error updating room:", error);
      res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลห้องพัก",
        error: error.message,
      });
    }
  });
};

const updateRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.log('🔍 Updating room status:', { id, status });

    const allowedStatuses = ["SleepGunWeb", "Walkin"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "ค่าสถานะไม่ถูกต้อง"
      });
    }

    const roomData = await room.findById(id);
    if (!roomData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลห้องพัก"
      });
    }

    if (status === "SleepGunWeb" && roomData.status !== "SleepGunWeb") {
      const sleepGunCount = await room.countDocuments({
        partnerId: req.partner.id,
        status: "SleepGunWeb"
      });

      if (sleepGunCount >= 5) {
        return res.status(400).json({
          success: false,
          message: "โควต้าห้อง SleepGun เต็มแล้ว (สูงสุด 5 ห้องต่อ partner)",
          data: {
            currentCount: sleepGunCount,
            maxQuota: 5
          }
        });
      }
    }

    roomData.status = status;
    const updatedRoom = await roomData.save();
    console.log('✅ Room status updated, updating statistics...');
    await updatePosStatistics(req.partner.id);

    console.log('✅ Room status updated successfully:', { roomNumber: updatedRoom.roomNumber, newStatus: updatedRoom.status });

    res.status(200).json({
      success: true,
      message: "อัปเดตสถานะห้องพักเรียบร้อยแล้ว",
      data: updatedRoom,
    });
  } catch (error) {
    console.error("❌ Error updating room status:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตสถานะห้องพัก",
      error: error.message,
    });
  }
};

const updateRoomStatusRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusRoom } = req.body;
    console.log('🔍 Updating room status room:', { id, statusRoom });
    
    const allowedStatusRoom = ["ว่าง", "ไม่ว่าง", "กำลังทำความสะอาด"];
    if (!allowedStatusRoom.includes(statusRoom)) {
      return res.status(400).json({
        success: false,
        message: "ค่าสถานะห้องไม่ถูกต้อง"
      });
    }
    const roomData = await room.findById(id);
    if (!roomData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลห้องพัก"
      });
    }
    roomData.statusRoom = statusRoom;
    const updatedRoom = await roomData.save();
    await updatePosStatistics(req.partner.id);

    console.log('✅ Room status room updated successfully:', { roomNumber: updatedRoom.roomNumber, newStatusRoom: updatedRoom.statusRoom });

    res.status(200).json({
      success: true,
      message: "อัปเดตสถานะห้องพักเรียบร้อยแล้ว",
      data: updatedRoom,
    });
  } catch (error) {
    console.error("❌ Error updating room status room:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตสถานะห้องพัก",
      error: error.message,
    });
  }
};

const updateRoomStatusPromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusPromotion } = req.body;
    console.log('🔍 Updating room status promotion:', { id, statusPromotion });
    
    const allowedStatusPromotion = ["openPromotion", "closePromotion"];
    if (!allowedStatusPromotion.includes(statusPromotion)) {
      return res.status(400).json({
        success: false,
        message: "ค่าสถานะโปรโมชั่นไม่ถูกต้อง"
      });
    }
    const roomData = await room.findById(id);
    if (!roomData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลห้องพัก"
      });
    }
    roomData.statusPromotion = statusPromotion;
    const updatedRoom = await roomData.save();
    await updatePosStatistics(req.partner.id);

    console.log('✅ Room status promotion updated successfully:', { roomNumber: updatedRoom.roomNumber, newStatusPromotion: updatedRoom.statusPromotion });

    res.status(200).json({
      success: true,
      message: "อัปเดตสถานะโปรโมชั่นเรียบร้อยแล้ว",
      data: updatedRoom,
    });
  } catch (error) {
    console.error("❌ Error updating room status promotion:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตสถานะโปรโมชั่น",
      error: error.message,
    });
  }
};

const deleteAllRooms = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    console.log('🔍 Deleting all rooms for partnerId:', partnerId);
    
    const result = await room.deleteMany({ partnerId });
    
    console.log('🗑️ Deleted rooms count:', result.deletedCount);
    
    res.status(200).json({
      success: true,
      message: "ลบห้องพักทั้งหมดเรียบร้อยแล้ว",
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    console.error("❌ Error deleting all rooms:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบห้องพักทั้งหมด",
      error: error.message,
    });
  }
};

const deleteRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner.id;
    console.log('🔍 Deleting room by ID:', { id, partnerId });
    
    const roomData = await room.findOneAndDelete({ _id: id, partnerId });
    if (!roomData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลห้องพัก",
      });
    }
    
    await updatePosStatistics(partnerId);
    
    console.log('🗑️ Deleted room:', roomData.roomNumber);
    
    res.status(200).json({
      success: true,
      message: "ลบห้องพักเรียบร้อยแล้ว",
      data: roomData,
    });
  } catch (error) {
    console.error("❌ Error deleting room by ID:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบห้องพัก",
      error: error.message,
    });
  }
};

const getStatusOptions = (req, res) => {
  try {
    console.log('🔍 Getting status options');
    const statusOptions = ["SleepGunWeb", "Walkin"];
    console.log('📋 Status options:', statusOptions);
    
    res.status(200).json({
      success: true,
      message: "ดึงตัวเลือกสถานะเรียบร้อยแล้ว",
      data: statusOptions,
    });
  } catch (error) {
    console.error("❌ Error getting status options:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงตัวเลือกสถานะ",
      error: error.message,
    });
  }
};

const getSleepGunQuota = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    console.log('🔍 Getting SleepGun quota for partnerId:', partnerId);
    
    const sleepGunCount = await room.countDocuments({
      partnerId,
      status: "SleepGunWeb"
    });

    const quota = 5;
    const remaining = Math.max(0, quota - sleepGunCount);

    console.log('💤 SleepGun quota info:', {
      currentCount: sleepGunCount,
      maxQuota: quota,
      remaining: remaining,
      isFull: sleepGunCount >= quota
    });

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูลโควต้า SleepGun เรียบร้อยแล้ว",
      data: {
        currentCount: sleepGunCount,
        maxQuota: quota,
        remaining: remaining,
        isFull: sleepGunCount >= quota
      }
    });
  } catch (error) {
    console.error("❌ Error getting SleepGun quota:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลโควต้า SleepGun",
      error: error.message,
    });
  }
};

// ==================== TAG CONTROLLERS ====================
const createTag = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const partnerId = req.partner.id;
    console.log('🔍 Creating tag:', { name, partnerId });

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "ชื่อแท็กเป็นข้อมูลที่จำเป็น"
      });
    }

    const existingTag = await tagPOS.findOne({ 
      name: name.trim(), 
      partnerId 
    });
    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: "ชื่อแท็กนี้มีอยู่แล้ว"
      });
    }

    // ดึงหรือสร้าง posId จาก partner
    let posData = await pos.findOne({ partnerId });
    if (!posData) {
      // สร้างข้อมูล POS ใหม่สำหรับ partner นี้
      posData = new pos({
        partnerId,
        buildingCount: 0,
        floorCount: 0,
        roomCount: 0,
        roomCountSleepGun: 0,
        quotaRoomSleepGun: 5
      });
      await posData.save();
      console.log('✅ Created new POS for partner:', partnerId);
    }

    const newTag = new tagPOS({
      partnerId,
      posId: posData._id,
      name: name.trim(),
      description: description || "",
      color: color || "#FFBB00"
    });

    const savedTag = await newTag.save();
    await updatePosStatistics(partnerId);

    console.log('✅ Tag created successfully:', savedTag.name);

    res.status(201).json({
      success: true,
      message: "สร้างแท็กสำเร็จ",
      data: savedTag
    });

  } catch (error) {
    console.error("❌ Error creating tag:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างแท็ก",
      error: error.message
    });
  }
};

const getAllTags = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    console.log('🔍 Getting tags for partnerId:', partnerId);
    
    const tags = await tagPOS.find({ partnerId }).sort({ createdAt: -1 });

    console.log('🏷️ Found tags:', tags.length);

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูลแท็กสำเร็จ",
      data: tags,
      count: tags.length
    });

  } catch (error) {
    console.error("❌ Error getting tags:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลแท็ก",
      error: error.message
    });
  }
};

const getTagById = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner.id;
    console.log('🔍 Getting tag by ID:', id, 'for partnerId:', partnerId);

    const tag = await tagPOS.findOne({ _id: id, partnerId });
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบแท็กที่ต้องการ"
      });
    }

    console.log('🏷️ Found tag by ID:', tag.name);

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูลแท็กสำเร็จ",
      data: tag
    });

  } catch (error) {
    console.error("❌ Error getting tag by ID:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลแท็ก",
      error: error.message
    });
  }
};

const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;
    const partnerId = req.partner.id;
    console.log('🔍 Updating tag by ID:', { id, partnerId, updateData: req.body });

    const existingTag = await tagPOS.findOne({ _id: id, partnerId });
    if (!existingTag) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบแท็กที่ต้องการอัปเดต"
      });
    }

    if (name && name.trim() !== existingTag.name) {
      const duplicateTag = await tagPOS.findOne({ 
        name: name.trim(),
        partnerId,
        _id: { $ne: id }
      });
      if (duplicateTag) {
        return res.status(400).json({
          success: false,
          message: "ชื่อแท็กนี้มีอยู่แล้ว"
        });
      }
    }

    const updatedTag = await tagPOS.findByIdAndUpdate(
      id,
      {
        name: name ? name.trim() : existingTag.name,
        description: description !== undefined ? description : existingTag.description,
        color: color || existingTag.color
      },
      { new: true, runValidators: true }
    );

    await updatePosStatistics(partnerId);

    console.log('✅ Tag updated successfully:', updatedTag.name);

    res.status(200).json({
      success: true,
      message: "อัปเดตแท็กสำเร็จ",
      data: updatedTag
    });

  } catch (error) {
    console.error("❌ Error updating tag:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตแท็ก",
      error: error.message
    });
  }
};

const deleteTagById = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner.id;
    console.log('🔍 Deleting tag by ID:', { id, partnerId });

    const existingTag = await tagPOS.findOne({ _id: id, partnerId });
    if (!existingTag) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบแท็กที่ต้องการลบ"
      });
    }

    const deletedTag = await tagPOS.findByIdAndDelete(id);
    await updatePosStatistics(partnerId);

    console.log('🗑️ Deleted tag:', existingTag.name);

    res.status(200).json({
      success: true,
      message: "ลบแท็กสำเร็จ",
      data: deletedTag
    });

  } catch (error) {
    console.error("❌ Error deleting tag:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบแท็ก",
      error: error.message
    });
  }
};

const deleteAllTags = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    console.log('🔍 Deleting all tags for partnerId:', partnerId);
    
    const result = await tagPOS.deleteMany({ partnerId });

    console.log('🗑️ Deleted tags count:', result.deletedCount);

    res.status(200).json({
      success: true,
      message: "ลบแท็กทั้งหมดสำเร็จ",
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error("❌ Error deleting all tags:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบแท็กทั้งหมด",
      error: error.message
    });
  }
};

// ==================== COMPREHENSIVE DATA FETCHING ====================
const getCompletePosData = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    console.log('🔍 Getting complete POS data for partnerId:', partnerId);
    
    // ดึงข้อมูลทั้งหมดพร้อมกัน
    const [posData, buildings, rooms, tags, aboutHotelData] = await Promise.all([
      pos.find({ partnerId }).populate('tags').populate('buildings').populate('rooms').populate('aboutHotel').catch(err => {
        console.log('⚠️ Error fetching pos data:', err.message);
        return [];
      }),
      building.find({ partnerId }).catch(err => {
        console.log('⚠️ Error fetching buildings:', err.message);
        return [];
      }),
      room.find({ partnerId }).populate('typeRoom').populate('typeRoomHotel').populate('tag', 'name color description').catch(err => {
        console.log('⚠️ Error fetching rooms:', err.message);
        return [];
      }),
      tagPOS.find({ partnerId }).catch(err => {
        console.log('⚠️ Error fetching tags:', err.message);
        return [];
      }),
      aboutHotel.findOne({ partnerId }).catch(err => {
        console.log('⚠️ Error fetching aboutHotel:', err.message);
        return null;
      })
    ]);

    console.log('📦 Fetched complete data:', {
      pos: posData.length,
      buildings: buildings.length,
      rooms: rooms.length,
      tags: tags.length,
      hasAboutHotel: !!aboutHotelData
    });

    // คำนวณสถิติ
    const statistics = {
      totalBuildings: buildings.length,
      totalRooms: rooms.length,
      totalTags: tags.length,
      sleepGunRooms: rooms.filter(r => r.status === 'SleepGunWeb').length,
      availableRooms: rooms.filter(r => r.statusRoom === 'ว่าง').length,
      occupiedRooms: rooms.filter(r => r.statusRoom === 'ไม่ว่าง').length,
      cleaningRooms: rooms.filter(r => r.statusRoom === 'กำลังทำความสะอาด').length,
      hasAboutHotel: !!aboutHotelData
    };

    console.log('📊 Statistics calculated:', statistics);

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูล POS ครบถ้วนเรียบร้อยแล้ว",
      data: {
        pos: posData,
        buildings,
        rooms,
        tags,
        aboutHotel: aboutHotelData,
        statistics
      }
    });
  } catch (error) {
    console.error("❌ Error fetching complete POS data:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล POS",
      error: error.message,
    });
  }
};

// ==================== FLOOR MANAGEMENT ====================
const updateFloorName = async (req, res) => {
  try {
    const { buildingId, oldFloorName } = req.params;
    const { newFloorName } = req.body;
    const partnerId = req.partner.id;

    console.log('🏢 Updating floor name:', { buildingId, oldFloorName, newFloorName, partnerId });

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!newFloorName || !newFloorName.trim()) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกชื่อชั้นใหม่"
      });
    }

    // ค้นหาตึก
    const buildingDoc = await building.findOne({ _id: buildingId, partnerId });
    if (!buildingDoc) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบตึกที่ต้องการแก้ไข"
      });
    }

    // ตรวจสอบและอัปเดต posId ถ้าจำเป็น
    await ensureBuildingPosId(buildingDoc, partnerId);

    // ตรวจสอบว่าชั้นที่ต้องการแก้ไขมีอยู่หรือไม่
    const floorIndex = buildingDoc.floors.findIndex(floor => floor.name === oldFloorName);
    if (floorIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบชั้นที่ต้องการแก้ไข"
      });
    }

    // ตรวจสอบว่าชื่อชั้นใหม่ซ้ำกับชั้นอื่นหรือไม่
    const isDuplicate = buildingDoc.floors.some(floor => floor.name === newFloorName.trim());
    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: "ชื่อชั้นนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น"
      });
    }

    // อัปเดตชื่อชั้น
    buildingDoc.floors[floorIndex].name = newFloorName.trim();
    await buildingDoc.save();

    // อัปเดตชื่อชั้นในห้องที่เกี่ยวข้อง
    await room.updateMany(
      { 
        buildingId: buildingId, 
        floor: oldFloorName,
        partnerId 
      },
      { 
        $set: { floor: newFloorName.trim() } 
      }
    );

    // อัปเดตสถิติ
    await updatePosStatistics(partnerId);

    console.log('✅ Floor name updated successfully:', { buildingName: buildingDoc.nameBuilding, oldFloorName, newFloorName: newFloorName.trim() });

    res.status(200).json({
      success: true,
      message: "อัปเดตชื่อชั้นเรียบร้อยแล้ว",
      data: {
        buildingId,
        oldFloorName,
        newFloorName: newFloorName.trim()
      }
    });

  } catch (error) {
    console.error("❌ Error updating floor name:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตชื่อชั้น",
      error: error.message
    });
  }
};

// ==================== ABOUT HOTEL CONTROLLERS ====================
const getAboutHotel = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    console.log('🔍 Getting about hotel for partnerId:', partnerId);
    
    const aboutHotelData = await aboutHotel.findOne({ partnerId })
      .populate('typeFacilityHotel')
      .populate('typeFoodHotel')
      .populate('typeHotel')
      .populate('typeHotelFor')
      .populate('typeHotelLocation')
      .populate('typePaymentPolicy')
      .populate('typeRoomHotel')
      .populate('typeRoom');

    if (!aboutHotelData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูล about hotel",
      });
    }

    console.log('🏨 Found about hotel data for partner:', partnerId);

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูล about hotel เรียบร้อยแล้ว",
      data: aboutHotelData,
    });
  } catch (error) {
    console.error("❌ Error fetching about hotel:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล about hotel",
      error: error.message,
    });
  }
};

const createOrUpdateAboutHotel = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    const aboutHotelData = req.body;
    console.log('🔍 Creating or updating about hotel for partnerId:', partnerId);

    // ดึงหรือสร้าง posId จาก partner
    let posData = await pos.findOne({ partnerId });
    if (!posData) {
      // สร้างข้อมูล POS ใหม่สำหรับ partner นี้
      posData = new pos({
        partnerId,
        buildingCount: 0,
        floorCount: 0,
        roomCount: 0,
        roomCountSleepGun: 0,
        quotaRoomSleepGun: 5
      });
      await posData.save();
      console.log('✅ Created new POS for partner:', partnerId);
    }

    // ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
    let existingAboutHotel = await aboutHotel.findOne({ partnerId });

    if (existingAboutHotel) {
      // อัปเดตข้อมูลที่มีอยู่
      const updatedAboutHotel = await aboutHotel.findByIdAndUpdate(
        existingAboutHotel._id,
        { ...aboutHotelData, posId: posData._id },
        { new: true, runValidators: true }
      ).populate('typeFacilityHotel')
       .populate('typeFoodHotel')
       .populate('typeHotel')
       .populate('typeHotelFor')
       .populate('typeHotelLocation')
       .populate('typePaymentPolicy')
       .populate('typeRoomHotel')
       .populate('typeRoom');

      await updatePosStatistics(partnerId);

      console.log('✅ About hotel updated successfully');

      res.status(200).json({
        success: true,
        message: "อัปเดตข้อมูล about hotel เรียบร้อยแล้ว",
        data: updatedAboutHotel,
      });
    } else {
      // สร้างข้อมูลใหม่
      const newAboutHotel = new aboutHotel({
        ...aboutHotelData,
        partnerId,
        posId: posData._id,
      });

      const savedAboutHotel = await newAboutHotel.save();
      await updatePosStatistics(partnerId);

      console.log('✅ About hotel created successfully');

      res.status(201).json({
        success: true,
        message: "สร้างข้อมูล about hotel เรียบร้อยแล้ว",
        data: savedAboutHotel,
      });
    }
  } catch (error) {
    console.error("❌ Error creating/updating about hotel:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้าง/อัปเดตข้อมูล about hotel",
      error: error.message,
    });
  }
};

const updateAboutHotel = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner.id;
    const updateData = req.body;
    console.log('🔍 Updating about hotel by ID:', { id, partnerId, updateData });

    const existingAboutHotel = await aboutHotel.findOne({ _id: id, partnerId });
    if (!existingAboutHotel) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูล about hotel",
      });
    }

    const updatedAboutHotel = await aboutHotel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('typeFacilityHotel')
     .populate('typeFoodHotel')
     .populate('typeHotel')
     .populate('typeHotelFor')
     .populate('typeHotelLocation')
     .populate('typePaymentPolicy')
     .populate('typeRoomHotel')
     .populate('typeRoom');

    await updatePosStatistics(partnerId);

    console.log('✅ About hotel updated successfully:', id);

    res.status(200).json({
      success: true,
      message: "อัปเดตข้อมูล about hotel เรียบร้อยแล้ว",
      data: updatedAboutHotel,
    });
  } catch (error) {
    console.error("❌ Error updating about hotel:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล about hotel",
      error: error.message,
    });
  }
};

const deleteAboutHotel = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner.id;
    console.log('🔍 Deleting about hotel:', { id, partnerId });

    const existingAboutHotel = await aboutHotel.findOne({ _id: id, partnerId });
    if (!existingAboutHotel) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูล about hotel",
      });
    }

    const deletedAboutHotel = await aboutHotel.findByIdAndDelete(id);
    await updatePosStatistics(partnerId);

    console.log('🗑️ Deleted about hotel:', id);

    res.status(200).json({
      success: true,
      message: "ลบข้อมูล about hotel เรียบร้อยแล้ว",
      data: deletedAboutHotel,
    });
  } catch (error) {
    console.error("❌ Error deleting about hotel:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบข้อมูล about hotel",
      error: error.message,
    });
  }
};

// ฟังก์ชันค้นหาห้องว่างตามช่วงวันที่
const searchAvailableRoomsByDateRange = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    const { startDate, endDate } = req.body;

    console.log('🔍 Searching available rooms by date range:', { partnerId, startDate, endDate });

    // ตรวจสอบข้อมูลที่ส่งมา
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด",
      });
    }

    // แปลงวันที่เป็น Date object
    const start = new Date(startDate);
    const end = new Date(endDate);

    // ตรวจสอบความถูกต้องของวันที่
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "รูปแบบวันที่ไม่ถูกต้อง",
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด",
      });
    }

    // คำนวณจำนวนวัน
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // ดึงข้อมูลห้องทั้งหมดของ partner
    const allRooms = await room.find({ partnerId }).populate([
      { path: 'buildingId', select: 'nameBuilding' },
      { path: 'typeRoom', select: 'name mainName' },
      { path: 'tag', select: 'name color' },
      { path: 'typeRoomHotel', select: 'name' }
    ]);

    // ดึงข้อมูลการจองในช่วงวันที่ที่ระบุ
    const bookings = await checkInOrder.find({
      partnerId,
      orderDate: {
        $gte: start,
        $lte: end
      }
    }).populate('roomID');

    // สร้าง Set ของห้องที่ถูกจองในช่วงวันที่
    const bookedRoomIds = new Set();
    bookings.forEach(booking => {
      booking.roomID.forEach(roomId => {
        bookedRoomIds.add(roomId.toString());
      });
    });

    // กรองห้องที่ว่างและไม่ถูกจองในช่วงวันที่
    const availableRooms = allRooms.filter(room => {
      const isAvailable = room.statusRoom === 'ว่าง';
      const isNotBooked = !bookedRoomIds.has(room._id.toString());
      return isAvailable && isNotBooked;
    });

    // อัปเดตข้อมูลการค้นหาใน POS
    const posData = await pos.findOne({ partnerId });
    if (posData) {
      posData.searchDateRange = {
        startDate: start,
        endDate: end,
        duration: duration
      };
      await posData.save();
    }

    // จัดกลุ่มห้องตามตึกและชั้น
    const roomsByBuilding = {};
    availableRooms.forEach(room => {
      const buildingId = room.buildingId._id.toString();
      const buildingName = room.buildingId.nameBuilding;
      const floor = room.floor;

      if (!roomsByBuilding[buildingId]) {
        roomsByBuilding[buildingId] = {
          buildingId: buildingId,
          buildingName: buildingName,
          floors: {}
        };
      }

      if (!roomsByBuilding[buildingId].floors[floor]) {
        roomsByBuilding[buildingId].floors[floor] = [];
      }

      roomsByBuilding[buildingId].floors[floor].push(room);
    });

    // แปลงเป็น array
    const result = Object.values(roomsByBuilding).map(building => ({
      ...building,
      floors: Object.entries(building.floors).map(([floorName, rooms]) => ({
        floorName,
        rooms
      }))
    }));

    console.log('✅ Found available rooms:', {
      totalRooms: allRooms.length,
      availableRooms: availableRooms.length,
      dateRange: { start: start.toISOString(), end: end.toISOString(), duration }
    });

    res.status(200).json({
      success: true,
      message: "ค้นหาห้องว่างสำเร็จ",
      data: {
        searchCriteria: {
          startDate: start,
          endDate: end,
          duration: duration
        },
        summary: {
          totalRooms: allRooms.length,
          availableRooms: availableRooms.length,
          bookedRooms: bookedRoomIds.size
        },
        rooms: result
      }
    });

  } catch (error) {
    console.error("❌ Error searching available rooms by date range:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการค้นหาห้องว่าง",
      error: error.message,
    });
  }
};

// ฟังก์ชันล้างการค้นหาห้องว่าง
const clearRoomSearch = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    console.log('🧹 Clearing room search for partner:', partnerId);

    // ล้างข้อมูลการค้นหาใน POS
    const posData = await pos.findOne({ partnerId });
    if (posData) {
      posData.searchDateRange = {
        startDate: null,
        endDate: null,
        duration: 0
      };
      await posData.save();
    }

    console.log('✅ Room search cleared successfully');

    res.status(200).json({
      success: true,
      message: "ล้างการค้นหาห้องว่างเรียบร้อยแล้ว",
    });

  } catch (error) {
    console.error("❌ Error clearing room search:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการล้างการค้นหา",
      error: error.message,
    });
  }
};

// ฟังก์ชันค้นหาห้องที่ check-out (ห้องไม่ว่าง)
const searchCheckedOutRooms = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    const { startDate, endDate } = req.body;

    console.log('🔍 Searching checked out rooms:', { partnerId, startDate, endDate });

    // ตรวจสอบข้อมูลที่ส่งมา
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด",
      });
    }

    // แปลงวันที่เป็น Date object
    const start = new Date(startDate);
    const end = new Date(endDate);

    // ตรวจสอบความถูกต้องของวันที่
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "รูปแบบวันที่ไม่ถูกต้อง",
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด",
      });
    }

    // คำนวณจำนวนวัน
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // ดึงข้อมูลห้องที่ check-out (ห้องไม่ว่าง) ของ partner
    const checkedOutRooms = await room.find({ 
      partnerId,
      statusRoom: 'ไม่ว่าง'
    }).populate([
      { path: 'buildingId', select: 'nameBuilding' },
      { path: 'typeRoom', select: 'name mainName' },
      { path: 'tag', select: 'name color' },
      { path: 'typeRoomHotel', select: 'name' }
    ]);

    // จัดกลุ่มห้องตามตึกและชั้น
    const roomsByBuilding = {};
    checkedOutRooms.forEach(room => {
      const buildingId = room.buildingId._id.toString();
      const buildingName = room.buildingId.nameBuilding;
      const floor = room.floor;

      if (!roomsByBuilding[buildingId]) {
        roomsByBuilding[buildingId] = {
          buildingId: buildingId,
          buildingName: buildingName,
          floors: {}
        };
      }

      if (!roomsByBuilding[buildingId].floors[floor]) {
        roomsByBuilding[buildingId].floors[floor] = [];
      }

      roomsByBuilding[buildingId].floors[floor].push(room);
    });

    // แปลงเป็น array
    const result = Object.values(roomsByBuilding).map(building => ({
      ...building,
      floors: Object.entries(building.floors).map(([floorName, rooms]) => ({
        floorName,
        rooms
      }))
    }));

    console.log('✅ Found checked out rooms:', {
      checkedOutRooms: checkedOutRooms.length,
      dateRange: { start: start.toISOString(), end: end.toISOString(), duration }
    });

    res.status(200).json({
      success: true,
      message: "ค้นหาห้องที่ check-out สำเร็จ",
      data: {
        searchCriteria: {
          startDate: start,
          endDate: end,
          duration: duration
        },
        summary: {
          checkedOutRooms: checkedOutRooms.length
        },
        rooms: result
      }
    });

  } catch (error) {
    console.error("❌ Error searching checked out rooms:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการค้นหาห้องที่ check-out",
      error: error.message,
    });
  }
};

// ฟังก์ชันค้นหาห้องกำลังทำความสะอาด
const searchCleaningRooms = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    const { startDate, endDate } = req.body;

    console.log('🔍 Searching cleaning rooms:', { partnerId, startDate, endDate });

    // ตรวจสอบข้อมูลที่ส่งมา
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด",
      });
    }

    // แปลงวันที่เป็น Date object
    const start = new Date(startDate);
    const end = new Date(endDate);

    // ตรวจสอบความถูกต้องของวันที่
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "รูปแบบวันที่ไม่ถูกต้อง",
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด",
      });
    }

    // คำนวณจำนวนวัน
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // ดึงข้อมูลห้องกำลังทำความสะอาดของ partner
    const cleaningRooms = await room.find({ 
      partnerId,
      statusRoom: 'กำลังทำความสะอาด'
    }).populate([
      { path: 'buildingId', select: 'nameBuilding' },
      { path: 'typeRoom', select: 'name mainName' },
      { path: 'tag', select: 'name color' },
      { path: 'typeRoomHotel', select: 'name' }
    ]);

    // จัดกลุ่มห้องตามตึกและชั้น
    const roomsByBuilding = {};
    cleaningRooms.forEach(room => {
      const buildingId = room.buildingId._id.toString();
      const buildingName = room.buildingId.nameBuilding;
      const floor = room.floor;

      if (!roomsByBuilding[buildingId]) {
        roomsByBuilding[buildingId] = {
          buildingId: buildingId,
          buildingName: buildingName,
          floors: {}
        };
      }

      if (!roomsByBuilding[buildingId].floors[floor]) {
        roomsByBuilding[buildingId].floors[floor] = [];
      }

      roomsByBuilding[buildingId].floors[floor].push(room);
    });

    // แปลงเป็น array
    const result = Object.values(roomsByBuilding).map(building => ({
      ...building,
      floors: Object.entries(building.floors).map(([floorName, rooms]) => ({
        floorName,
        rooms
      }))
    }));

    console.log('✅ Found cleaning rooms:', {
      cleaningRooms: cleaningRooms.length,
      dateRange: { start: start.toISOString(), end: end.toISOString(), duration }
    });

    res.status(200).json({
      success: true,
      message: "ค้นหาห้องกำลังทำความสะอาดสำเร็จ",
      data: {
        searchCriteria: {
          startDate: start,
          endDate: end,
          duration: duration
        },
        summary: {
          cleaningRooms: cleaningRooms.length
        },
        rooms: result
      }
    });

  } catch (error) {
    console.error("❌ Error searching cleaning rooms:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการค้นหาห้องกำลังทำความสะอาด",
      error: error.message,
    });
  }
};

module.exports = {
  // POS Controllers
  createPos,
  getAllPos,
  getPosById,
  getPosSummary,
  updatePos,
  deletePos,
  deleteAllPos,
  
  // Building Controllers
  createBuilding,
  getAllBuildings,
  getBuildingById,
  updateBuilding,
  deleteBuilding,
  addFloorToBuilding,
  removeFloorFromBuilding,
  getFloorsByBuilding,
  updateFloorName,
  
  // Room Controllers
  createRoom,
  getAllRooms,
  getRoomsByFloor,
  getRoomsByBuildingAndFloor,
  getRoomById,
  updateRoom,
  updateRoomStatus,
  updateRoomStatusRoom,
  updateRoomStatusPromotion,
  deleteAllRooms,
  deleteRoomById,
  getStatusOptions,
  getSleepGunQuota,
  
  // Tag Controllers
  createTag,
  getAllTags,
  getTagById,
  updateTag,
  deleteTagById,
  deleteAllTags,
  
  // About Hotel Controllers
  getAboutHotel,
  createOrUpdateAboutHotel,
  updateAboutHotel,
  deleteAboutHotel,
  
  // Room Search Controllers
  searchAvailableRoomsByDateRange,
  searchCheckedOutRooms,
  searchCleaningRooms,
  clearRoomSearch,
  
  // Comprehensive Data
  getCompletePosData
}; 