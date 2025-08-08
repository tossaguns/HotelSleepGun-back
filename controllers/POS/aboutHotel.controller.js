const pos = require("../../models/POS/pos.schema");
const aboutHotel = require("../../models/aboutHotel/aboutHotel.schema");

// Helper สำหรับอัปเดตสถิติ POS
const updatePosStatistics = async (partnerId) => {
  try {
    const aboutHotelData = await aboutHotel.findOne({ partnerId });
    const posData = await pos.findOne({ partnerId });
    if (posData) {
      posData.aboutHotel = aboutHotelData ? aboutHotelData._id : null;
      await posData.save();
    }
  } catch (error) {
    console.error("Error updating POS statistics:", error);
  }
};

exports.getAboutHotel = async (req, res) => {
  try {
    const partnerId = req.partner.id;
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

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูล about hotel เรียบร้อยแล้ว",
      data: aboutHotelData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล about hotel",
      error: error.message,
    });
  }
};

exports.createOrUpdateAboutHotel = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    const aboutHotelData = req.body;

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

    let existingAboutHotel = await aboutHotel.findOne({ partnerId });

    if (existingAboutHotel) {
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

      res.status(200).json({
        success: true,
        message: "อัปเดตข้อมูล about hotel เรียบร้อยแล้ว",
        data: updatedAboutHotel,
      });
    } else {
      const newAboutHotel = new aboutHotel({
        ...aboutHotelData,
        partnerId,
        posId: posData._id,
      });

      const savedAboutHotel = await newAboutHotel.save();
      await updatePosStatistics(partnerId);

      res.status(201).json({
        success: true,
        message: "สร้างข้อมูล about hotel เรียบร้อยแล้ว",
        data: savedAboutHotel,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้าง/อัปเดตข้อมูล about hotel",
      error: error.message,
    });
  }
};

exports.updateAboutHotel = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner.id;
    const updateData = req.body;

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

    res.status(200).json({
      success: true,
      message: "อัปเดตข้อมูล about hotel เรียบร้อยแล้ว",
      data: updatedAboutHotel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล about hotel",
      error: error.message,
    });
  }
};
exports.deleteAboutHotel = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner.id;

    const existingAboutHotel = await aboutHotel.findOne({ _id: id, partnerId });
    if (!existingAboutHotel) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูล about hotel",
      });
    }

    const deletedAboutHotel = await aboutHotel.findByIdAndDelete(id);
    await updatePosStatistics(partnerId);

    res.status(200).json({
      success: true,
      message: "ลบข้อมูล about hotel เรียบร้อยแล้ว",
      data: deletedAboutHotel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบข้อมูล about hotel",
      error: error.message
    });
  }
};