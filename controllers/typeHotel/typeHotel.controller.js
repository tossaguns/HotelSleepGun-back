const TypeHotel = require("../../models/typeHotel/typeHotel.schema");

// CREATE
exports.createHotel = async (req, res) => {
  try {
    const { name, description } = req.body;
    const icon = req.file ? req.file.filename : "";

    const hotel = new TypeHotel({ name, icon, description });
    await hotel.save();
    res.status(201).json(hotel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET ALL
exports.getAllHotel = async (req, res) => {
  try {
    const hotel = await TypeHotel.find();
    res.status(200).json(hotel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE BY ID
exports.deleteHotelById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TypeHotel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Not found" });
    }
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ALL
exports.deleteAllHotel = async (req, res) => {
  try {
    await TypeHotel.deleteMany({});
    res.status(200).json({ message: "All Hotel deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE BY ID
exports.updateHotelById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const icon = req.file ? req.file.filename : undefined;

    const updateData = { name, description };
    if (icon !== undefined) updateData.icon = icon;

    const updated = await TypeHotel.findByIdAndUpdate(id, updateData, {
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
