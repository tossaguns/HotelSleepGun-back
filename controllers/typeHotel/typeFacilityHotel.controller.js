const TypeFacilityHotel = require("../../models/typeHotel/typeFacilityHotel.schema");

// CREATE
exports.createFacility = async (req, res) => {
  try {
    const { name, description } = req.body;
    const icon = req.file ? req.file.filename : ""; // ชื่อไฟล์ที่อัปโหลด

    const facility = new TypeFacilityHotel({ name, icon, description });
    await facility.save();
    res.status(201).json(facility);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// GET ALL
exports.getAllFacilities = async (req, res) => {
  try {
    const facilities = await TypeFacilityHotel.find();
    res.status(200).json(facilities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE BY ID
exports.deleteFacilityById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TypeFacilityHotel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Not found" });
    }
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ALL
exports.deleteAllFacilities = async (req, res) => {
  try {
    await TypeFacilityHotel.deleteMany({});
    res.status(200).json({ message: "All facilities deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE BY ID
exports.updateFacilityById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const icon = req.file ? req.file.filename : undefined;

    const updateData = { name, description };
    if (icon !== undefined) updateData.icon = icon;

    const updated = await TypeFacilityHotel.findByIdAndUpdate(id, updateData, {
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
