require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { createServer } = require("http");
const { Server } = require("socket.io");
const connection = require("./config/db");

connection();

const app = express();
const httpServer = createServer(app);

// Init Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Routes
const prefix = "/HotelSleepGun";
//app.use(prefix + "/partners", require("./routes/user/partnerRoutes"));
app.use(prefix + "/employee", require("./routes/user/employeeRoutes"));
app.use(
  prefix + "/employeeLogin",
  require("./routes/login/employeeLoginRoutes")
);

app.use(
  prefix + "/adminApprovePartner",
  require("./routes/approvePartnerRoutes")
);

// ใช้ POS routes ที่รวมทุกฟังก์ชันไว้ด้วยกัน
app.use(prefix + "/pos", require("./routes/POS/pos.routes"));
app.use(prefix + "/checkInOrder", require("./routes/POS/checkInOrder.routes"));
app.use(prefix + "/partner", require("./routes/user/partnerRoutes"));
app.use(prefix + "/partnerLogin", require("./routes/login/partnerLoginRoutes"));

app.use(prefix + "/registerLogin", require("./routes/registerLogin.Routes"));
app.use(prefix + "/auth", require("./routes/authRoutes"));

app.use(prefix + "/registerLoginEmail", require("./routes/otp.Routes"));

app.use(prefix + "/typeHotel", require("./routes/typeHotel/typeHotelRoutes"));
app.use(
  prefix + "/typeFacilityHotel",
  require("./routes/typeHotel/typeFacilityHotelRoutes")
);
app.use(
  prefix + "/typeRoomHotel",
  require("./routes/typeHotel/typeRoomHotelRoutes")
);
app.use(
  prefix + "/typeFoodHotel",
  require("./routes/typeHotel/typeFoodHotelRoutes")
);
app.use(
  prefix + "/typeHotelFor",
  require("./routes/typeHotel/typeHotelForRoutes")
);
app.use(
  prefix + "/typeHotelLocation",
  require("./routes/typeHotel/typeHotelLocationRoutes")
);
app.use(
  prefix + "/typeRoom",
  require("./routes/typeHotel/typeRoomRoutes")
);
app.use(
  prefix + "/typePaymentPolicy",
  require("./routes/typeHotel/typePaymentPolicyRoutes")
);
app.use(prefix + "/promotion", require("./routes/promotionRoutes"));
app.use(prefix + "/provinceData", require("./routes/provinceDataRoutes"));

app.get(prefix + "/test", (req, res) => res.send("✅ Test OK with prefix"));

// Socket.IO Events
io.on("connection", (socket) => {
  console.log("👤 User connected:", socket.id);

  console.log("✅ Socket connected with id:", socket.id);
  socket.on("join", (roomName) => {
    socket.join(roomName);
    console.log(`🔌 ${socket.id} joined room: ${roomName}`);
    console.log("📦 ห้องทั้งหมดของ client:", [...socket.rooms]);
  });

  socket.on("send_message", async (data) => {
    const { senderId, receiverId, text, timestamp } = data;

    const roomName = [senderId, receiverId].sort().join("_");

    console.log(
      `📨 Message from ${senderId} to ${receiverId} (room: ${roomName}): ${text}`
    );

    try {
      const savedMessage =
        await require("./controllers/chatController").saveMessage(data);
      console.log("💾 ข้อความถูกบันทึกแล้ว:", savedMessage._id);

      io.to(roomName).emit("receive_message", savedMessage);
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการบันทึกข้อความ:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("👋 User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 9999;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
