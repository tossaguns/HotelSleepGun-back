const pos = require("../../models/POS/pos.schema");
const building = require("../../models/POS/building.schema");
const room = require("../../models/POS/room.schema");

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
        quotaRoomSleepGun: 5
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
      room.find({ partnerId })
    ]);
    const sleepGunRooms = rooms.filter(room => room.status === 'SleepGunWeb');
    let totalFloorCount = 0;
    buildings.forEach(buildingDoc => {
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
        quotaRoomSleepGun: 5
      });
      await newPos.save();
    }
  } catch (error) {
    console.error("Error updating POS statistics:", error);
  }
};

// ==================== BUILDING CONTROLLERS ====================
exports.createBuilding = async (req, res) => {
  try {
    const { nameBuilding, colorText, hascolorBG, colorBG, imgBG } = req.body;
    const partnerId = req.partner.id;

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

    let posData = await pos.findOne({ partnerId });
    if (!posData) {
      posData = new pos({
        partnerId,
        buildingCount: 0,
        floorCount: 0,
        roomCount: 0,
        roomCountSleepGun: 0,
        quotaRoomSleepGun: 5
      });
      await posData.save();
    }

    const newBuilding = new building({
      partnerId,
      posId: posData._id,
      nameBuilding,
      colorText,
      hascolorBG,
      colorBG: hascolorBG === 'colorBG' ? colorBG : undefined,
      imgBG: hascolorBG === 'imgBG' ? imgBG : undefined,
      floors: []
    });

    const savedBuilding = await newBuilding.save();
    await updatePosStatistics(partnerId);

    res.status(201).json({
      success: true,
      message: "สร้างตึกเรียบร้อยแล้ว",
      data: savedBuilding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างตึก",
      error: error.message,
    });
  }
};

exports.addFloorToBuilding = async (req, res) => {
  try {
    const { buildingId } = req.params;
    const { name, description } = req.body;
    const partnerId = req.partner.id;

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

    await ensureBuildingPosId(buildingData, partnerId);

    const existingFloor = buildingData.floors.find(floor => floor.name === name.trim());
    if (existingFloor) {
      return res.status(400).json({
        success: false,
        message: "ชั้นนี้มีอยู่แล้วในตึกนี้",
      });
    }

    buildingData.floors.push({
      name: name.trim(),
      description: description || "",
      roomCount: 0
    });

    const updatedBuilding = await buildingData.save();
    await updatePosStatistics(partnerId);

    res.status(200).json({
      success: true,
      message: "เพิ่มชั้นเรียบร้อยแล้ว",
      data: updatedBuilding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการเพิ่มชั้น",
      error: error.message,
    });
  }
};

exports.removeFloorFromBuilding = async (req, res) => {
  try {
    const { buildingId, floorName } = req.params;
    const partnerId = req.partner.id;

    const buildingData = await building.findOne({ _id: buildingId, partnerId });
    if (!buildingData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลตึก",
      });
    }

    await ensureBuildingPosId(buildingData, partnerId);

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

    buildingData.floors = buildingData.floors.filter(floor => floor.name !== floorName);
    const updatedBuilding = await buildingData.save();
    await updatePosStatistics(partnerId);

    res.status(200).json({
      success: true,
      message: "ลบชั้นเรียบร้อยแล้ว",
      data: updatedBuilding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบชั้น",
      error: error.message,
    });
  }
};

exports.getFloorsByBuilding = async (req, res) => {
  try {
    const { buildingId } = req.params;
    const partnerId = req.partner.id;

    const buildingData = await building.findOne({ _id: buildingId, partnerId });
    if (!buildingData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลตึก",
      });
    }

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูลชั้นเรียบร้อยแล้ว",
      data: buildingData.floors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลชั้น",
      error: error.message,
    });
  }
};

exports.getAllBuildings = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    const buildings = await building.find({ partnerId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูลตึกเรียบร้อยแล้ว",
      data: buildings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลตึก",
      error: error.message,
    });
  }
};

exports.getBuildingById = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner.id;
    const buildingData = await building.findOne({ _id: id, partnerId });

    if (!buildingData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลตึก",
      });
    }

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูลตึกเรียบร้อยแล้ว",
      data: buildingData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลตึก",
      error: error.message,
    });
  }
};

exports.updateBuilding = async (req, res) => {
  try {
    const { id } = req.params;
    const { nameBuilding, colorText, hascolorBG, colorBG, imgBG } = req.body;
    const partnerId = req.partner.id;

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

    await updatePosStatistics(partnerId);

    res.status(200).json({
      success: true,
      message: "อัปเดตข้อมูลตึกเรียบร้อยแล้ว",
      data: updatedBuilding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลตึก",
      error: error.message,
    });
  }
};

exports.deleteBuilding = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner.id;

    const existingBuilding = await building.findOne({ _id: id, partnerId });
    if (!existingBuilding) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลตึก",
      });
    }

    const deletedBuilding = await building.findByIdAndDelete(id);
    await updatePosStatistics(partnerId);

    res.status(200).json({
      success: true,
      message: "ลบตึกเรียบร้อยแล้ว",
      data: deletedBuilding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบตึก",
      error: error.message,
    });
  }
};

exports.updateFloorName = async (req, res) => {
  try {
    const { buildingId, oldFloorName } = req.params;
    const { newFloorName } = req.body;
    const partnerId = req.partner.id;

    if (!newFloorName || !newFloorName.trim()) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกชื่อชั้นใหม่"
      });
    }

    const buildingDoc = await building.findOne({ _id: buildingId, partnerId });
    if (!buildingDoc) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบตึกที่ต้องการแก้ไข"
      });
    }

    await ensureBuildingPosId(buildingDoc, partnerId);

    const floorIndex = buildingDoc.floors.findIndex(floor => floor.name === oldFloorName);
    if (floorIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบชั้นที่ต้องการแก้ไข"
      });
    }

    const isDuplicate = buildingDoc.floors.some(floor => floor.name === newFloorName.trim());
    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: "ชื่อชั้นนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น"
      });
    }

    buildingDoc.floors[floorIndex].name = newFloorName.trim();
    await buildingDoc.save();

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

    await updatePosStatistics(partnerId);

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
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตชื่อชั้น",
      error: error.message
    });
  }
};