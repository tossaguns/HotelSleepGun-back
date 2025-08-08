const pos = require("../../models/POS/pos.schema");
const building = require("../../models/POS/building.schema");
const room = require("../../models/POS/room.schema");
const tagPOS = require("../../models/POS/tag.schema");
const aboutHotel = require("../../models/aboutHotel/aboutHotel.schema");
const typeRoom = require("../../models/typeHotel/typeRoom.schema");
const typeRoomHotel = require("../../models/typeHotel/typeRoomHotel.schema");

// ดึงข้อมูลทั้งหมดที่เกี่ยวข้องกับ partner
exports.getComprehensiveData = async (req, res) => {
  try {
    const partnerId = req.partner.id;

    // ดึงข้อมูล POS
    const posData = await pos.findOne({ partnerId });

    // ดึงข้อมูลตึก
    const buildings = await building.find({ partnerId });

    // ดึงข้อมูลห้อง
    const rooms = await room
      .find({ partnerId })
      .populate("typeRoom")
      .populate("typeRoomHotel")
      .populate("tag", "name color description")
      .populate("buildingId", "nameBuilding");

    // ดึงข้อมูลแท็ก
    const tags = await tagPOS.find({ partnerId });

    // ดึงข้อมูล aboutHotel
    const aboutHotelData = await aboutHotel
      .findOne({ partnerId })
      .populate("typeFacilityHotel")
      .populate("typeFoodHotel")
      .populate("typeHotel")
      .populate("typeHotelFor")
      .populate("typeHotelLocation")
      .populate("typePaymentPolicy")
      .populate("typeRoomHotel")
      .populate("typeRoom");

    // ดึงข้อมูล typeRoom และ typeRoomHotel
    const typeRooms = await typeRoom.find({ partnerId });
    const typeRoomHotels = await typeRoomHotel.find({ partnerId });

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูลทั้งหมดสำเร็จ",
      data: {
        pos: posData,
        buildings,
        rooms,
        tags,
        aboutHotel: aboutHotelData,
        typeRooms,
        typeRoomHotels,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลทั้งหมด",
      error: error.message,
    });
  }
};
