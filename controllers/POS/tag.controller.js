const pos = require("../../models/POS/pos.schema");
const tagPOS = require("../../models/POS/tag.schema");

// Helper สำหรับอัปเดตสถิติ POS
const updatePosStatistics = async (partnerId) => {
  try {
    const tags = await tagPOS.find({ partnerId });
    const posData = await pos.findOne({ partnerId });
    if (posData) {
      posData.tagsCount = tags.length;
      await posData.save();
    }
  } catch (error) {
    console.error("Error updating POS statistics:", error);
  }
};

exports.createTag = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const partnerId = req.partner.id;

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

    const newTag = new tagPOS({
      partnerId,
      posId: posData._id,
      name: name.trim(),
      description: description || "",
      color: color || "#FFBB00"
    });

    const savedTag = await newTag.save();
    await updatePosStatistics(partnerId);

    res.status(201).json({
      success: true,
      message: "สร้างแท็กสำเร็จ",
      data: savedTag
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างแท็ก",
      error: error.message
    });
  }
};

exports.getAllTags = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    const tags = await tagPOS.find({ partnerId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูลแท็กสำเร็จ",
      data: tags,
      count: tags.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลแท็ก",
      error: error.message
    });
  }
};

exports.getTagById = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner.id;

    const tag = await tagPOS.findOne({ _id: id, partnerId });
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบแท็กที่ต้องการ"
      });
    }

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูลแท็กสำเร็จ",
      data: tag
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลแท็ก",
      error: error.message
    });
  }
};

exports.updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;
    const partnerId = req.partner.id;

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

    res.status(200).json({
      success: true,
      message: "อัปเดตแท็กสำเร็จ",
      data: updatedTag
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตแท็ก",
      error: error.message
    });
  }
};

exports.deleteTagById = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner.id;

    const existingTag = await tagPOS.findOne({ _id: id, partnerId });
    if (!existingTag) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบแท็กที่ต้องการลบ"
      });
    }

    const deletedTag = await tagPOS.findByIdAndDelete(id);
    await updatePosStatistics(partnerId);

    res.status(200).json({
      success: true,
      message: "ลบแท็กสำเร็จ",
      data: deletedTag
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบแท็ก",
      error: error.message
    });
  }
};

exports.deleteAllTags = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    const result = await tagPOS.deleteMany({ partnerId });

    res.status(200).json({
      success: true,
      message: "ลบแท็กทั้งหมดสำเร็จ",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบแท็กทั้งหมด",
      error: error.message
    });
  }
};