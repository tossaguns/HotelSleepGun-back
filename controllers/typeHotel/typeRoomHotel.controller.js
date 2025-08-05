const typeRoomHotel = require("../../models/typeHotel/typeRoomHotel.schema");

exports.createRoomType = async (req, res) => {
  try {
    const { name, description } = req.body;
    const icon = req.file ? req.file.filename : "";
    const room = new typeRoomHotel({ name, icon, description });
    await room.save();
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// GET ALL
exports.getAllRoomType = async (req, res) => {
  try {
    const room = await typeRoomHotel.find();
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE BY ID
exports.deleteRoomTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await typeRoomHotel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Not found" });
    }
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ALL
exports.deleteAllRoomType = async (req, res) => {
  try {
    await typeRoomHotel.deleteMany({});
    res.status(200).json({ message: "All room deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE BY ID
exports.updateRoomTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const icon = req.file ? req.file.filename : undefined;

    const updateData = { name, description };
    if (icon !== undefined) updateData.icon = icon;

    const updated = await typeRoomHotel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
