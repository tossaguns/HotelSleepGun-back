const checkInOrder = require("../../models/POS/checkInOrder.schema");
const room = require("../../models/POS/room.schema");
const member = require("../../models/user/member.schema");
const employee = require("../../models/user/employee.schema");

// สร้าง checkInOrderId ในรูปแบบ CI-yyyymm-x
const generateCheckInOrderId = async (partnerId) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;
    
    // หา orderCheckIn สูงสุดของเดือนนี้
    const latestOrder = await checkInOrder.findOne({
      partnerId: partnerId,
      checkInOrderId: { $regex: `^CIN-${yearMonth}-` }
    }).sort({ orderCheckIn: -1 });
    
    let nextOrderNumber = 1;
    if (latestOrder) {
      nextOrderNumber = latestOrder.orderCheckIn + 1;
    }
    
    return `CIN-${yearMonth}-${String(nextOrderNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error('❌ Error generating checkInOrderId:', error);
    throw error;
  }
};

// สร้าง orderCheckIn (ออเดอร์ทั้งหมด)
const generateOrderCheckIn = async (partnerId) => {
  try {
    const latestOrder = await checkInOrder.findOne({
      partnerId: partnerId
    }).sort({ orderCheckIn: -1 });
    
    return latestOrder ? latestOrder.orderCheckIn + 1 : 1;
  } catch (error) {
    console.error('❌ Error generating orderCheckIn:', error);
    throw error;
  }
};

// สร้าง Check-in Order ใหม่
exports.createCheckInOrder = async (req, res) => {
  try {
    const { partnerId, roomIDs, memberIDs, orderBy, employeeId, aboutHotelId } = req.body;
    
    if (!partnerId || !roomIDs || !memberIDs || !orderBy) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน"
      });
    }

    // ตรวจสอบว่าห้องว่างหรือไม่
    const rooms = await room.find({
      _id: { $in: roomIDs },
      partnerId: partnerId,
      statusRoom: "ว่าง"
    });

    if (rooms.length !== roomIDs.length) {
      return res.status(400).json({
        success: false,
        message: "มีห้องที่ไม่ว่างหรือไม่พบในระบบ"
      });
    }

    // ตรวจสอบว่าสมาชิกมีอยู่จริงหรือไม่
    const members = await member.find({
      _id: { $in: memberIDs }
    });

    if (members.length !== memberIDs.length) {
      return res.status(400).json({
        success: false,
        message: "มีสมาชิกที่ไม่พบในระบบ"
      });
    }

    // ตรวจสอบ employee ถ้ามีการส่ง employeeId มา
    let employeeData = null;
    if (employeeId) {
      employeeData = await employee.findOne({
        _id: employeeId,
        partnerId: partnerId
      });

      if (!employeeData) {
        return res.status(400).json({
          success: false,
          message: "ไม่พบข้อมูลพนักงานในระบบ"
        });
      }
    }

    // สร้าง checkInOrderId และ orderCheckIn
    const checkInOrderId = await generateCheckInOrderId(partnerId);
    const orderCheckIn = await generateOrderCheckIn(partnerId);

    // สร้าง Check-in Order
    const newCheckInOrder = new checkInOrder({
      partnerId,
      checkInOrderId,
      orderCheckIn,
      orderDate: new Date(),
      orderTime: new Date(),
      orderBy,
      employeeId: employeeId || null,
      aboutHotelId: aboutHotelId || null,
      roomID: roomIDs,
      memberID: memberIDs
    });

    await newCheckInOrder.save();

    // อัปเดตสถานะห้องเป็น "ไม่ว่าง"
    await room.updateMany(
      { _id: { $in: roomIDs } },
      { statusRoom: "ไม่ว่าง" }
    );

    res.status(201).json({
      success: true,
      message: "สร้าง Check-in Order สำเร็จ",
      data: newCheckInOrder
    });

  } catch (error) {
    console.error('❌ Error creating check-in order:', error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้าง Check-in Order",
      error: error.message
    });
  }
};

// ดึง Check-in Order ทั้งหมดของ partner
exports.getAllCheckInOrders = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query = { partnerId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const checkInOrders = await checkInOrder.find(query)
      .populate('roomID', 'roomNumber price statusRoom')
      .populate('memberID', 'firstname lastname phone')
      .populate('employeeId', 'firstname lastname employeeCode positionEmployee')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await checkInOrder.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูล Check-in Orders สำเร็จ",
      data: {
        docs: checkInOrders,
        totalDocs: total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Error getting check-in orders:', error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล Check-in Orders",
      error: error.message
    });
  }
};

// ดึง Check-in Order ตาม ID
exports.getCheckInOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const checkInOrderData = await checkInOrder.findById(id)
      .populate('roomID', 'roomNumber price statusRoom floor')
      .populate('memberID', 'firstname lastname phone email')
      .populate('employeeId', 'firstname lastname employeeCode positionEmployee phone email')
      .populate('partnerId', 'companyName');

    if (!checkInOrderData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบ Check-in Order"
      });
    }

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูล Check-in Order สำเร็จ",
      data: checkInOrderData
    });

  } catch (error) {
    console.error('❌ Error getting check-in order by ID:', error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล Check-in Order",
      error: error.message
    });
  }
};

// ดึง Check-in Order ตาม checkInOrderId
exports.getCheckInOrderByOrderId = async (req, res) => {
  try {
    const { checkInOrderId } = req.params;
    const { partnerId } = req.query;

    const query = { checkInOrderId };
    if (partnerId) {
      query.partnerId = partnerId;
    }

    const checkInOrderData = await checkInOrder.findOne(query)
      .populate('roomID', 'roomNumber price statusRoom floor')
      .populate('memberID', 'firstname lastname phone email')
      .populate('employeeId', 'firstname lastname employeeCode positionEmployee phone email')
      .populate('partnerId', 'companyName');

    if (!checkInOrderData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบ Check-in Order"
      });
    }

    res.status(200).json({
      success: true,
      message: "ดึงข้อมูล Check-in Order สำเร็จ",
      data: checkInOrderData
    });

  } catch (error) {
    console.error('❌ Error getting check-in order by order ID:', error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล Check-in Order",
      error: error.message
    });
  }
};

// อัปเดต Check-in Order
exports.updateCheckInOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomIDs, memberIDs, orderBy, employeeId } = req.body;

    const checkInOrderData = await checkInOrder.findById(id);
    if (!checkInOrderData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบ Check-in Order"
      });
    }

    // ตรวจสอบห้องใหม่ถ้ามีการเปลี่ยนแปลง
    if (roomIDs && roomIDs.length > 0) {
      const rooms = await room.find({
        _id: { $in: roomIDs },
        partnerId: checkInOrderData.partnerId,
        statusRoom: "ว่าง"
      });

      if (rooms.length !== roomIDs.length) {
        return res.status(400).json({
          success: false,
          message: "มีห้องที่ไม่ว่างหรือไม่พบในระบบ"
        });
      }

      // ปลดล็อคห้องเก่า
      await room.updateMany(
        { _id: { $in: checkInOrderData.roomID } },
        { statusRoom: "ว่าง" }
      );

      // ล็อคห้องใหม่
      await room.updateMany(
        { _id: { $in: roomIDs } },
        { statusRoom: "ไม่ว่าง" }
      );
    }

    // ตรวจสอบสมาชิกใหม่ถ้ามีการเปลี่ยนแปลง
    if (memberIDs && memberIDs.length > 0) {
      const members = await member.find({
        _id: { $in: memberIDs }
      });

      if (members.length !== memberIDs.length) {
        return res.status(400).json({
          success: false,
          message: "มีสมาชิกที่ไม่พบในระบบ"
        });
      }
    }

    // ตรวจสอบ employee ใหม่ถ้ามีการเปลี่ยนแปลง
    if (employeeId) {
      const employeeData = await employee.findOne({
        _id: employeeId,
        partnerId: checkInOrderData.partnerId
      });

      if (!employeeData) {
        return res.status(400).json({
          success: false,
          message: "ไม่พบข้อมูลพนักงานในระบบ"
        });
      }
    }

    // อัปเดตข้อมูล
    const updateData = {};
    if (roomIDs) updateData.roomID = roomIDs;
    if (memberIDs) updateData.memberID = memberIDs;
    if (orderBy) updateData.orderBy = orderBy;
    if (employeeId !== undefined) updateData.employeeId = employeeId;

    const updatedCheckInOrder = await checkInOrder.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('roomID', 'roomNumber price statusRoom')
     .populate('memberID', 'firstname lastname phone')
     .populate('employeeId', 'firstname lastname employeeCode positionEmployee');

    res.status(200).json({
      success: true,
      message: "อัปเดต Check-in Order สำเร็จ",
      data: updatedCheckInOrder
    });

  } catch (error) {
    console.error('❌ Error updating check-in order:', error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดต Check-in Order",
      error: error.message
    });
  }
};

// ลบ Check-in Order
exports.deleteCheckInOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const checkInOrderData = await checkInOrder.findById(id);
    if (!checkInOrderData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบ Check-in Order"
      });
    }

    // ปลดล็อคห้อง
    await room.updateMany(
      { _id: { $in: checkInOrderData.roomID } },
      { statusRoom: "ว่าง" }
    );

    await checkInOrder.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "ลบ Check-in Order สำเร็จ"
    });

  } catch (error) {
    console.error('❌ Error deleting check-in order:', error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบ Check-in Order",
      error: error.message
    });
  }
};

// ดึงสถิติ Check-in Orders
exports.getCheckInOrderStats = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { partnerId };
    if (startDate && endDate) {
      query.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const totalOrders = await checkInOrder.countDocuments(query);
    const todayOrders = await checkInOrder.countDocuments({
      partnerId,
      orderDate: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999)
      }
    });

    const monthlyOrders = await checkInOrder.countDocuments({
      partnerId,
      orderDate: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
      }
    });

    res.status(200).json({
      success: true,
      message: "ดึงสถิติ Check-in Orders สำเร็จ",
      data: {
        totalOrders,
        todayOrders,
        monthlyOrders
      }
    });

  } catch (error) {
    console.error('❌ Error getting check-in order stats:', error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงสถิติ Check-in Orders",
      error: error.message
    });
  }
}; 