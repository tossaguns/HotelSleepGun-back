const mongoose = require('mongoose');
const Employee = require('../models/user/employee.schema');
const AboutHotel = require('../models/aboutHotel/aboutHotel.schema');

const addAboutHotelIdToEmployee = async () => {
  try {
    console.log('🔄 เริ่มต้น migration: เพิ่ม aboutHotelId ให้กับ employee...');

    // เชื่อมต่อ MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel');
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ');

    // ดึงข้อมูล employee ทั้งหมด
    const employees = await Employee.find({});
    console.log(`📊 พบ employee ทั้งหมด ${employees.length} คน`);

    let updatedCount = 0;

    for (const emp of employees) {
      try {
        // หา aboutHotel ที่ตรงกับ partnerId ของ employee
        const aboutHotel = await AboutHotel.findOne({ partnerId: emp.partnerId });
        
        if (aboutHotel) {
          // อัปเดต employee ด้วย aboutHotelId
          await Employee.findByIdAndUpdate(emp._id, {
            aboutHotelId: aboutHotel._id
          });
          
          console.log(`✅ อัปเดต employee ${emp.username} (${emp.firstname} ${emp.lastname}) ด้วย aboutHotelId: ${aboutHotel._id}`);
          updatedCount++;
        } else {
          console.log(`⚠️ ไม่พบ aboutHotel สำหรับ employee ${emp.username} (partnerId: ${emp.partnerId})`);
        }
      } catch (error) {
        console.error(`❌ เกิดข้อผิดพลาดในการอัปเดต employee ${emp.username}:`, error.message);
      }
    }

    console.log(`🎉 Migration เสร็จสิ้น! อัปเดต employee ทั้งหมด ${updatedCount} คน`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการ migration:', error);
  } finally {
    // ปิดการเชื่อมต่อ
    await mongoose.disconnect();
    console.log('🔌 ปิดการเชื่อมต่อ MongoDB');
  }
};

// รัน migration ถ้าเรียกไฟล์นี้โดยตรง
if (require.main === module) {
  addAboutHotelIdToEmployee();
}

module.exports = addAboutHotelIdToEmployee; 