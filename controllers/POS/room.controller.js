const pos = require("../../models/POS/pos.schema");
const building = require("../../models/POS/building.schema");
const room = require("../../models/POS/room.schema");
const aboutHotel = require("../../models/aboutHotel/aboutHotel.schema");
const checkInOrder = require("../../models/POS/checkInOrder.schema");

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
const ensureBuildingPosId = async (buildingDoc, partnerId) => {
  if (!buildingDoc.posId) {
    let posData = await pos.findOne({ partnerId });
    if (!posData) {
      posData = new pos({
        partnerId,
        buildingCount: 0,
        floorCount: 0,
        roomCount: 0,
        roomCountSleepGun: 0,
        quotaRoomSleepGun: 5,
      });
      await posData.save();
    }
    buildingDoc.posId = posData._id;
  }
  return buildingDoc;
};

const updatePosStatistics = async (partnerId) => {
  try {
    const [buildings, rooms] = await Promise.all([
      building.find({ partnerId }),
      room.find({ partnerId }),
    ]);
    const sleepGunRooms = rooms.filter((room) => room.status === "SleepGunWeb");
    let totalFloorCount = 0;
    buildings.forEach((buildingDoc) => {
      if (buildingDoc.floors && Array.isArray(buildingDoc.floors)) {
        totalFloorCount += buildingDoc.floors.length;
      }
    });
    const posData = await pos.findOne({ partnerId });
    if (posData) {
      posData.buildingCount = buildings.length;
      posData.floorCount = totalFloorCount;
      posData.roomCount = rooms.length;
      posData.roomCountSleepGun = sleepGunRooms.length;
      posData.quotaRoomSleepGun = 5;
      await posData.save();
    } else {
      const newPos = new pos({
        partnerId,
        buildingCount: buildings.length,
        floorCount: totalFloorCount,
        roomCount: rooms.length,
        roomCountSleepGun: sleepGunRooms.length,
        quotaRoomSleepGun: 5,
      });
      await newPos.save();
    }
  } catch (error) {
    console.error("Error updating POS statistics:", error);
  }
};

// ==================== ROOM CONTROLLERS ====================
exports.createRoom = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    try {
      const imgrooms = req.files ? req.files.map((file) => file.filename) : [];

      if (!req.body.typeRoom) {
        return res.status(400).json({
          success: false,
          message: "typeRoom เป็นข้อมูลที่จำเป็น",
        });
      }

      if (!req.body.buildingId) {
        return res.status(400).json({
          success: false,
          message: "buildingId เป็นข้อมูลที่จำเป็น",
        });
      }

      if (!req.body.floor) {
        return res.status(400).json({
          success: false,
          message: "floor เป็นข้อมูลที่จำเป็น",
        });
      }

      let posData = await pos.findOne({ partnerId: req.partner.id });
      if (!posData) {
        posData = new pos({
          partnerId: req.partner.id,
          buildingCount: 0,
          floorCount: 0,
          roomCount: 0,
          roomCountSleepGun: 0,
          quotaRoomSleepGun: 5,
        });
        await posData.save();
      }

      // คำนวณ service charge และ VAT
      let totalPrice = parseFloat(req.body.price) || 0;
      let basePrice = totalPrice;
      let serviceChargeAmount = 0;
      let vatAmount = 0;
      let isServiceChargeIncluded = req.body.isServiceCharge === "true";
      let isVatIncluded = req.body.isVat === "true";

      const aboutHotelData = await aboutHotel.findOne({
        partnerId: req.partner.id,
      });
      if (aboutHotelData && (isServiceChargeIncluded || isVatIncluded)) {
        const serviceChargePercent = aboutHotelData.serviceCharge || 0;
        const vatPercent = aboutHotelData.vat || 0;
        const totalPercentage =
          (isServiceChargeIncluded ? serviceChargePercent : 0) +
          (isVatIncluded ? vatPercent : 0);
        if (totalPercentage > 0) {
          basePrice = Math.round(totalPrice / (1 + totalPercentage / 100));
        }
        if (isServiceChargeIncluded && serviceChargePercent > 0) {
          serviceChargeAmount = Math.round(
            (basePrice * serviceChargePercent) / 100
          );
        }
        if (isVatIncluded && vatPercent > 0) {
          vatAmount = Math.round((basePrice * vatPercent) / 100);
        }
      }

      const roomData = {
        roomNumber: req.body.roomNumber,
        price: req.body.price,
        basePrice: basePrice,
        serviceChargeAmount: serviceChargeAmount,
        vatAmount: vatAmount,
        isServiceChargeIncluded: isServiceChargeIncluded,
        isVatIncluded: isVatIncluded,
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
        tag: req.body.tag
          ? Array.isArray(req.body.tag)
            ? req.body.tag
            : [req.body.tag]
          : [],
        partnerId: req.partner.id,
      };

      const newRoom = new room(roomData);
      const savedRoom = await newRoom.save();

      // อัปเดต roomCount ในชั้น
      const buildingData = await building.findById(req.body.buildingId);
      if (buildingData) {
        await ensureBuildingPosId(buildingData, req.partner.id);
        const floorIndex = buildingData.floors.findIndex(
          (floor) => floor.name === req.body.floor
        );
        if (floorIndex !== -1) {
          buildingData.floors[floorIndex].roomCount += 1;
          await buildingData.save();
        }
      }

      await updatePosStatistics(req.partner.id);

      res.status(201).json({
        success: true,
        message: "สร้างห้องพักเรียบร้อยแล้ว",
        data: savedRoom,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการสร้างห้องพัก",
        error: error.message,
      });
    }
  });
};

exports.getAllRooms = async (req, res) => {
  try {
    const partnerId = req.partner?.id;
    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบ Partner ID",
      });
    }
    if (!room) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลด model",
      });
    }
    const rooms = await room
      .find({ partnerId })
      .populate("typeRoom")
      .populate("typeRoomHotel")
      .populate("tag", "name color description")
      .populate("buildingId", "nameBuilding")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูลห้องพักเรียบร้อยแล้ว",
      data: rooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก",
      error: error.message,
    });
  }
};

exports.getRoomsByBuildingAndFloor = async (req, res) => {
  try {
    const { buildingId, floor } = req.params;
    const partnerId = req.partner.id;
    const rooms = await room
      .find({
        partnerId: partnerId,
        buildingId: buildingId,
        floor: floor,
      })
      .populate("typeRoom")
      .populate("typeRoomHotel")
      .populate("buildingId", "nameBuilding")
      .populate("tag", "name color description");
    res.status(200).json({
      success: true,
      message: `ดึงข้อมูลห้องพักในตึก ${buildingId} ชั้น ${floor} เรียบร้อยแล้ว`,
      data: rooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก",
      error: error.message,
    });
  }
};

exports.getRoomsByFloor = async (req, res) => {
  try {
    const { buildingId, floor } = req.params;
    const partnerId = req.partner.id;
    const rooms = await room
      .find({
        partnerId: partnerId,
        buildingId: buildingId,
        floor: floor,
      })
      .populate("typeRoom")
      .populate("typeRoomHotel")
      .populate("buildingId", "nameBuilding")
      .populate("tag", "name color description");
    res.status(200).json({
      success: true,
      message: `ดึงข้อมูลห้องพักในตึก ${buildingId} ชั้น ${floor} เรียบร้อยแล้ว`,
      data: rooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก",
      error: error.message,
    });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const roomData = await room
      .findById(id)
      .populate("typeRoom")
      .populate("typeRoomHotel")
      .populate("tag", "name color description");
    if (!roomData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลห้องพัก",
      });
    }
    res.status(200).json({
      success: true,
      message: "ดึงข้อมูลห้องพักเรียบร้อยแล้ว",
      data: roomData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก",
      error: error.message,
    });
  }
};

exports.updateRoom = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    try {
      const { id } = req.params;
      const roomData = await room.findById(id);
      if (!roomData) {
        return res.status(404).json({
          success: false,
          message: "ไม่พบข้อมูลห้องพัก",
        });
      }

      let totalPrice = parseFloat(req.body.price) || roomData.price || 0;
      let basePrice = totalPrice;
      let serviceChargeAmount = 0;
      let vatAmount = 0;
      let isServiceChargeIncluded = req.body.isServiceCharge === "true";
      let isVatIncluded = req.body.isVat === "true";

      const aboutHotelData = await aboutHotel.findOne({
        partnerId: req.partner.id,
      });
      if (aboutHotelData && (isServiceChargeIncluded || isVatIncluded)) {
        const serviceChargePercent = aboutHotelData.serviceCharge || 0;
        const vatPercent = aboutHotelData.vat || 0;
        const totalPercentage =
          (isServiceChargeIncluded ? serviceChargePercent : 0) +
          (isVatIncluded ? vatPercent : 0);
        if (totalPercentage > 0) {
          basePrice = Math.round(totalPrice / (1 + totalPercentage / 100));
        }
        if (isServiceChargeIncluded && serviceChargePercent > 0) {
          serviceChargeAmount = Math.round(
            (basePrice * serviceChargePercent) / 100
          );
        }
        if (isVatIncluded && vatPercent > 0) {
          vatAmount = Math.round((basePrice * vatPercent) / 100);
        }
      }

      roomData.roomNumber = req.body.roomNumber ?? roomData.roomNumber;
      roomData.price = req.body.price ?? roomData.price;
      roomData.basePrice = basePrice;
      roomData.serviceChargeAmount = serviceChargeAmount;
      roomData.vatAmount = vatAmount;
      roomData.isServiceChargeIncluded = isServiceChargeIncluded;
      roomData.isVatIncluded = isVatIncluded;
      roomData.stayPeople = req.body.stayPeople ?? roomData.stayPeople;
      roomData.roomDetail = req.body.roomDetail ?? roomData.roomDetail;
      roomData.air = req.body.air ?? roomData.air;
      roomData.floor = req.body.floor ?? roomData.floor;
      roomData.typeRoom = req.body.typeRoom ?? roomData.typeRoom;
      roomData.typeRoomHotel = req.body.typeRoomHotel
        ? Array.isArray(req.body.typeRoomHotel)
          ? req.body.typeRoomHotel
          : [req.body.typeRoomHotel]
        : roomData.typeRoomHotel;

      if (req.body.tag !== undefined) {
        roomData.tag = req.body.tag
          ? Array.isArray(req.body.tag)
            ? req.body.tag
            : [req.body.tag]
          : [];
      }

      if (req.files && req.files.length > 0) {
        roomData.imgrooms = req.files.map((file) => file.filename);
      }

      const updatedRoom = await roomData.save();
      await updatePosStatistics(req.partner.id);

      res.status(200).json({
        success: true,
        message: "อัปเดตข้อมูลห้องพักเรียบร้อยแล้ว",
        data: updatedRoom,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลห้องพัก",
        error: error.message,
      });
    }
  });
};

exports.updateRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ["SleepGunWeb", "Walkin"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "ค่าสถานะไม่ถูกต้อง",
      });
    }
    const roomData = await room.findById(id);
    if (!roomData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลห้องพัก",
      });
    }
    if (status === "SleepGunWeb" && roomData.status !== "SleepGunWeb") {
      const sleepGunCount = await room.countDocuments({
        partnerId: req.partner.id,
        status: "SleepGunWeb",
      });
      if (sleepGunCount >= 5) {
        return res.status(400).json({
          success: false,
          message: "โควต้าห้อง SleepGun เต็มแล้ว (สูงสุด 5 ห้องต่อ partner)",
          data: {
            currentCount: sleepGunCount,
            maxQuota: 5,
          },
        });
      }
    }
    roomData.status = status;
    const updatedRoom = await roomData.save();
    await updatePosStatistics(req.partner.id);
    res.status(200).json({
      success: true,
      message: "อัปเดตสถานะห้องพักเรียบร้อยแล้ว",
      data: updatedRoom,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตสถานะห้องพัก",
      error: error.message,
    });
  }
};

exports.updateRoomStatusRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusRoom } = req.body;
    const allowedStatusRoom = ["ว่าง", "ไม่ว่าง", "กำลังทำความสะอาด"];
    if (!allowedStatusRoom.includes(statusRoom)) {
      return res.status(400).json({
        success: false,
        message: "ค่าสถานะห้องไม่ถูกต้อง",
      });
    }
    const roomData = await room.findById(id);
    if (!roomData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลห้องพัก",
      });
    }
    roomData.statusRoom = statusRoom;
    const updatedRoom = await roomData.save();
    await updatePosStatistics(req.partner.id);
    res.status(200).json({
      success: true,
      message: "อัปเดตสถานะห้องพักเรียบร้อยแล้ว",
      data: updatedRoom,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตสถานะห้องพัก",
      error: error.message,
    });
  }
};

exports.updateRoomStatusPromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusPromotion } = req.body;
    const allowedStatusPromotion = ["openPromotion", "closePromotion"];
    if (!allowedStatusPromotion.includes(statusPromotion)) {
      return res.status(400).json({
        success: false,
        message: "ค่าสถานะโปรโมชั่นไม่ถูกต้อง",
      });
    }
    const roomData = await room.findById(id);
    if (!roomData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลห้องพัก",
      });
    }
    roomData.statusPromotion = statusPromotion;
    const updatedRoom = await roomData.save();
    await updatePosStatistics(req.partner.id);
    res.status(200).json({
      success: true,
      message: "อัปเดตสถานะโปรโมชั่นเรียบร้อยแล้ว",
      data: updatedRoom,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตสถานะโปรโมชั่น",
      error: error.message,
    });
  }
};

exports.deleteAllRooms = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    const result = await room.deleteMany({ partnerId });
    res.status(200).json({
      success: true,
      message: "ลบห้องพักทั้งหมดเรียบร้อยแล้ว",
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบห้องพักทั้งหมด",
      error: error.message,
    });
  }
};

exports.deleteRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner.id;
    const roomData = await room.findOneAndDelete({ _id: id, partnerId });
    if (!roomData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลห้องพัก",
      });
    }
    await updatePosStatistics(partnerId);
    res.status(200).json({
      success: true,
      message: "ลบห้องพักเรียบร้อยแล้ว",
      data: roomData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบห้องพัก",
      error: error.message,
    });
  }
};

exports.getStatusOptions = (req, res) => {
  try {
    const statusOptions = ["SleepGunWeb", "Walkin"];
    res.status(200).json({
      success: true,
      message: "ดึงตัวเลือกสถานะเรียบร้อยแล้ว",
      data: statusOptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงตัวเลือกสถานะ",
      error: error.message,
    });
  }
};

exports.getSleepGunQuota = async (req, res) => {
  try {
    const partnerId = req.partner.id;

    const sleepGunCount = await room.countDocuments({
      partnerId,
      status: "SleepGunWeb",
    });

    const quota = 5;
    const remaining = Math.max(0, quota - sleepGunCount);

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูลโควต้า SleepGun เรียบร้อยแล้ว",
      data: {
        currentCount: sleepGunCount,
        maxQuota: quota,
        remaining: remaining,
        isFull: sleepGunCount >= quota,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลโควต้า SleepGun",
      error: error.message,
    });
  }
};



































// ฟังก์ชันค้นหาห้องว่างตามช่วงวันที่
exports.searchAvailableRoomsByDateRange = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    const { startDate, endDate } = req.body;

    console.log('🔍 Searching available rooms by date range:', { partnerId, startDate, endDate });

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

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

    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    const allRooms = await room.find({ partnerId }).populate([
      { path: 'buildingId', select: 'nameBuilding' },
      { path: 'typeRoom', select: 'name mainName' },
      { path: 'tag', select: 'name color' },
      { path: 'typeRoomHotel', select: 'name' }
    ]);

    const bookings = await checkInOrder.find({
      partnerId,
      orderDate: {
        $gte: start,
        $lte: end
      }
    }).populate('roomID');

    const bookedRoomIds = new Set();
    bookings.forEach(booking => {
      booking.roomID.forEach(roomId => {
        bookedRoomIds.add(roomId.toString());
      });
    });

    const availableRooms = allRooms.filter(room => {
      const isAvailable = room.statusRoom === 'ว่าง';
      const isNotBooked = !bookedRoomIds.has(room._id.toString());
      return isAvailable && isNotBooked;
    });

    const posData = await pos.findOne({ partnerId });
    if (posData) {
      posData.searchDateRange = {
        startDate: start,
        endDate: end,
        duration: duration
      };
      await posData.save();
    }

    const roomsByBuilding = {};
    availableRooms.forEach(room => {
      const buildingId = room.buildingId._id.toString();
      const buildingName = room.buildingId.nameBuilding;
      const floor = room.floor;

      if (!roomsByBuilding[buildingId]) {
        roomsByBuilding[buildingId] = {
          buildingId,
          buildingName,
          floors: {}
        };
      }

      if (!roomsByBuilding[buildingId].floors[floor]) {
        roomsByBuilding[buildingId].floors[floor] = [];
      }

      roomsByBuilding[buildingId].floors[floor].push(room);
    });

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
          duration
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
exports.clearRoomSearch = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    console.log('🧹 Clearing room search for partner:', partnerId);

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
exports.searchCheckedOutRooms = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    const { startDate, endDate } = req.body;

    console.log('🔍 Searching checked out rooms:', { partnerId, startDate, endDate });

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

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

    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    const checkedOutRooms = await room.find({ 
      partnerId,
      statusRoom: 'ไม่ว่าง'
    }).populate([
      { path: 'buildingId', select: 'nameBuilding' },
      { path: 'typeRoom', select: 'name mainName' },
      { path: 'tag', select: 'name color' },
      { path: 'typeRoomHotel', select: 'name' }
    ]);

    const roomsByBuilding = {};
    checkedOutRooms.forEach(room => {
      const buildingId = room.buildingId._id.toString();
      const buildingName = room.buildingId.nameBuilding;
      const floor = room.floor;

      if (!roomsByBuilding[buildingId]) {
        roomsByBuilding[buildingId] = {
          buildingId,
          buildingName,
          floors: {}
        };
      }

      if (!roomsByBuilding[buildingId].floors[floor]) {
        roomsByBuilding[buildingId].floors[floor] = [];
      }

      roomsByBuilding[buildingId].floors[floor].push(room);
    });

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
          duration
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
exports.searchCleaningRooms = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    const { startDate, endDate } = req.body;

    console.log('🔍 Searching cleaning rooms:', { partnerId, startDate, endDate });

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

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

    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    const cleaningRooms = await room.find({ 
      partnerId,
      statusRoom: 'กำลังทำความสะอาด'
    }).populate([
      { path: 'buildingId', select: 'nameBuilding' },
      { path: 'typeRoom', select: 'name mainName' },
      { path: 'tag', select: 'name color' },
      { path: 'typeRoomHotel', select: 'name' }
    ]);

    const roomsByBuilding = {};
    cleaningRooms.forEach(room => {
      const buildingId = room.buildingId._id.toString();
      const buildingName = room.buildingId.nameBuilding;
      const floor = room.floor;

      if (!roomsByBuilding[buildingId]) {
        roomsByBuilding[buildingId] = {
          buildingId,
          buildingName,
          floors: {}
        };
      }

      if (!roomsByBuilding[buildingId].floors[floor]) {
        roomsByBuilding[buildingId].floors[floor] = [];
      }

      roomsByBuilding[buildingId].floors[floor].push(room);
    });

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
          duration
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
