// loginEmployee.controller.js
const Employee = require("../../models/user/employee.schema");
const Login = require("../../models/historyLogin/employeeLoginHistory.schema");
const jwt = require("jsonwebtoken");

const loginEmployee = async (req, res) => {
  const { username, password } = req.body;

  try {
    const employee = await Employee.findOne({ username });

    if (!employee) {
      return res.status(400).json({ message: "ไม่พบผู้ใช้งานนี้" });
    }

    const isMatch = password === employee.password; // ควรใช้ bcrypt ใน production

    if (!isMatch) {
      return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });
    }

    // สร้าง token
    const token = jwt.sign(
      { id: employee._id, role: "employee" },
      "secretKey",
      { expiresIn: "1d" }
    );

    // บันทึก log เข้าใช้งาน
    const now = new Date();
    const dateLogin = now.toISOString().split("T")[0];
    const timeLogin = now.toTimeString().split(" ")[0];

    await Login.create({
      employeeCode: employee.employeeCode,
      name: employee.firstname + " " + employee.lastname,
      dateLogin,
      timeLogin,
    });

    return res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: {
        _id: employee._id,
        username: employee.username,
        role: "employee",
        employeeCode: employee.employeeCode,
        firstname: employee.firstname,
        lastname: employee.lastname,
        nickname: employee.nickname,
        positionEmployee: employee.positionEmployee,
        partnerId: employee.partnerId,
        aboutHotelId: employee.aboutHotelId || null,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
};

const createLogin = async (req, res) => {
  try {
    const { employeeCode, name, dateLogin, timeLogin } = req.body;

    if (!employeeCode || !name || !dateLogin || !timeLogin) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const login = new Login({ employeeCode, name, dateLogin, timeLogin });
    await login.save();

    res.status(201).json(login);
  } catch (error) {
    console.error("Error saving log-in:", error);
    res.status(500).json({ message: error.message });
  }
};

const getAllLogins = async (req, res) => {
  try {
    const logins = await Login.find().sort({ createdAt: -1 });
    res.status(200).json(logins);
  } catch (error) {
    console.error("❌ Error fetching all logins:", error);
    res.status(500).json({ message: error.message });
  }
};

// ดึง login ตาม employeeCode
const getLoginsByEmployeeCode = async (req, res) => {
  try {
    const { employeeCode } = req.params;

    const logins = await Login.find({ employeeCode }).sort({ createdAt: -1 });

    if (!logins.length) {
      return res
        .status(404)
        .json({ message: "ไม่พบประวัติการเข้าใช้งานของพนักงานนี้" });
    }

    res.status(200).json(logins);
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    res.status(500).json({ message: error.message });
  }
};

// แก้ไข login ตาม id
const updateLogin = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Login.findByIdAndUpdate(id, req.body, { new: true });

    if (!updated) {
      return res.status(404).json({ message: "ไม่พบข้อมูลที่จะอัปเดต" });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("❌ Error updating login:", error);
    res.status(500).json({ message: error.message });
  }
};

// ลบ login ตาม id
const deleteLogin = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Login.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "ไม่พบข้อมูลที่จะลบ" });
    }

    res.status(200).json({ message: "ลบสำเร็จ", deleted });
  } catch (error) {
    console.error("❌ Error deleting login:", error);
    res.status(500).json({ message: error.message });
  }
};

// ลบ login ทั้งหมด
const deleteAllLogins = async (req, res) => {
  try {
    const result = await Login.deleteMany({});
    res.status(200).json({
      message: "ลบข้อมูลทั้งหมดสำเร็จ",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ Error deleting all logins:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  loginEmployee,
  createLogin,
  getAllLogins,
  getLoginsByEmployeeCode,
  updateLogin,
  deleteLogin,
  deleteAllLogins,
};
