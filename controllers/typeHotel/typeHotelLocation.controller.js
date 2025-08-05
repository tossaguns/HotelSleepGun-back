const TypeHotelLocation = require("../../models/typeHotel/typeHotelLocation.schema");

// CREATE
exports.createHotelLocation = async (req, res) => {
  try {
    const { name, description } = req.body;
    const icon = req.file ? req.file.filename : "";

    const hotelLocation = new TypeHotelLocation({ name, icon, description });
    await hotelLocation.save();
    res.status(201).json(hotelLocation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET ALL
exports.getAllHotelLocation = async (req, res) => {
  try {
    const hotelLocation = await TypeHotelLocation.find().sort({
      createdAt: -1,
    });
    res.status(200).json(hotelLocation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE BY ID
exports.deleteHotelLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TypeHotelLocation.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Not found" });
    }
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ALL
exports.deleteAllHotelLocation = async (req, res) => {
  try {
    await TypeHotelLocation.deleteMany({});
    res.status(200).json({ message: "All HotelLocation deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE BY ID
exports.updateHotelLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const icon = req.file ? req.file.filename : undefined;

    const updateData = { name, description };
    if (icon !== undefined) updateData.icon = icon;

    const updated = await TypeHotelLocation.findByIdAndUpdate(id, updateData, {
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
