const TypeHotelFor = require("../../models/typeHotel/typeHotelfor.schema");

// CREATE
exports.createHotelFor = async (req, res) => {
  try {
    const { name, description } = req.body;
    const icon = req.file ? req.file.filename : "";

    const hotelFor = new TypeHotelFor({ name, icon, description });
    await hotelFor.save();
    res.status(201).json(hotelFor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET ALL
exports.getAllHotelFor = async (req, res) => {
  try {
    const hotelFor = await TypeHotelFor.find();
    res.status(200).json(hotelFor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE BY ID
exports.deleteHotelForById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TypeHotelFor.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Not found" });
    }
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ALL
exports.deleteAllHotelFor = async (req, res) => {
  try {
    await TypeHotelFor.deleteMany({});
    res.status(200).json({ message: "All HotelFor deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE BY ID
exports.updateHotelForById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const icon = req.file ? req.file.filename : undefined;

    const updateData = { name, description };
    if (icon !== undefined) updateData.icon = icon;

    const updated = await TypeHotelFor.findByIdAndUpdate(id, updateData, {
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
