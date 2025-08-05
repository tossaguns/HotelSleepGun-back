const TypePaymentPolicy = require("../../models/typeHotel/typePaymentPolicy.schema");

// CREATE
exports.createPaymentPolicy = async (req, res) => {
  try {
    const { name, description } = req.body;
    const icon = req.file ? req.file.filename : "";

    const paymentPolicy = new TypePaymentPolicy({ name, icon, description });
    await paymentPolicy.save();
    res.status(201).json(paymentPolicy);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET ALL
exports.getAllPaymentPolicy = async (req, res) => {
  try {
    const paymentPolicy = await TypePaymentPolicy.find();
    res.status(200).json(paymentPolicy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE BY ID
exports.deletePaymentPolicyById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TypePaymentPolicy.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Not found" });
    }
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ALL
exports.deleteAllPaymentPolicy = async (req, res) => {
  try {
    await TypePaymentPolicy.deleteMany({});
    res.status(200).json({ message: "All PaymentPolicy deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE BY ID
exports.updatePaymentPolicyById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const icon = req.file ? req.file.filename : undefined;

    const updateData = { name, description };
    if (icon !== undefined) updateData.icon = icon;

    const updated = await TypePaymentPolicy.findByIdAndUpdate(id, updateData, {
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
