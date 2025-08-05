const TypeFoodHotel = require("../../models/typeHotel/typeFoodHotel.schema");

// CREATE
exports.createFoodHotel = async (req, res) => {
  try {
    const { name, description } = req.body;
    const icon = req.file ? req.file.filename : "";

    const food = new TypeFoodHotel({ name, icon, description });
    await food.save();
    res.status(201).json(food);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET ALL
exports.getAllFoodHotel = async (req, res) => {
  try {
    const foodHotel = await TypeFoodHotel.find();
    res.status(200).json(foodHotel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE BY ID
exports.deleteFoodHotelById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TypeFoodHotel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Not found" });
    }
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ALL
exports.deleteAllFoodHotel = async (req, res) => {
  try {
    await TypeFoodHotel.deleteMany({});
    res.status(200).json({ message: "All foodHotel deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE BY ID
exports.updateFoodHotelById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const icon = req.file ? req.file.filename : undefined;

    const updateData = { name, description };
    if (icon !== undefined) updateData.icon = icon;

    const updated = await TypeFoodHotel.findByIdAndUpdate(id, updateData, {
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
