const mongoose = require('mongoose');
const pos = require('../models/POS/pos.schema');
const building = require('../models/POS/building.schema');
const room = require('../models/POS/room.schema');
const tagPOS = require('../models/POS/tag.schema');
const aboutHotel = require('../models/aboutHotel/aboutHotel.schema');
const partner = require('../models/user/partner.schema');

// ฟังก์ชันสำหรับอัปเดตข้อมูลที่มีอยู่แล้ว
const updateExistingData = async () => {
  try {
    console.log('🔄 Starting migration to update existing data with posId...');

    // ดึงข้อมูล partner ทั้งหมดที่มีข้อมูล POS
    const partners = await partner.find({});
    
    for (const partner of partners) {
      console.log(`📋 Processing partner: ${partner._id}`);
      
      // สร้างหรือดึงข้อมูล POS สำหรับ partner นี้
      let posData = await pos.findOne({ partnerId: partner._id });
      
      if (!posData) {
        console.log(`📝 Creating new POS for partner: ${partner._id}`);
        posData = new pos({
          partnerId: partner._id,
          buildingCount: 0,
          floorCount: 0,
          roomCount: 0,
          roomCountSleepGun: 0,
          quotaRoomSleepGun: 5
        });
        await posData.save();
      }

      // อัปเดต buildings
      const buildings = await building.find({ partnerId: partner._id, posId: { $exists: false } });
      if (buildings.length > 0) {
        console.log(`🏢 Updating ${buildings.length} buildings for partner: ${partner._id}`);
        await building.updateMany(
          { partnerId: partner._id, posId: { $exists: false } },
          { posId: posData._id }
        );
      }

      // อัปเดต rooms
      const rooms = await room.find({ partnerId: partner._id, posId: { $exists: false } });
      if (rooms.length > 0) {
        console.log(`🏠 Updating ${rooms.length} rooms for partner: ${partner._id}`);
        await room.updateMany(
          { partnerId: partner._id, posId: { $exists: false } },
          { posId: posData._id }
        );
      }

      // อัปเดต tags
      const tags = await tagPOS.find({ partnerId: partner._id, posId: { $exists: false } });
      if (tags.length > 0) {
        console.log(`🏷️ Updating ${tags.length} tags for partner: ${partner._id}`);
        await tagPOS.updateMany(
          { partnerId: partner._id, posId: { $exists: false } },
          { posId: posData._id }
        );
      }

      // อัปเดต aboutHotel
      const aboutHotels = await aboutHotel.find({ partnerId: partner._id, posId: { $exists: false } });
      if (aboutHotels.length > 0) {
        console.log(`🏨 Updating ${aboutHotels.length} aboutHotel for partner: ${partner._id}`);
        await aboutHotel.updateMany(
          { partnerId: partner._id, posId: { $exists: false } },
          { posId: posData._id }
        );
      }

      // อัปเดตสถิติใน POS
      await posData.updateStatistics();
    }

    console.log('✅ Migration completed successfully!');
    
    // แสดงสรุปผลลัพธ์
    const totalPartners = await partner.countDocuments();
    const totalBuildings = await building.countDocuments();
    const totalRooms = await room.countDocuments();
    const totalTags = await tagPOS.countDocuments();
    const totalAboutHotels = await aboutHotel.countDocuments();
    const totalPos = await pos.countDocuments();

    console.log('📊 Migration Summary:');
    console.log(`- Total Partners: ${totalPartners}`);
    console.log(`- Total POS Records: ${totalPos}`);
    console.log(`- Total Buildings: ${totalBuildings}`);
    console.log(`- Total Rooms: ${totalRooms}`);
    console.log(`- Total Tags: ${totalTags}`);
    console.log(`- Total About Hotels: ${totalAboutHotels}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// ฟังก์ชันสำหรับตรวจสอบข้อมูล
const validateData = async () => {
  try {
    console.log('🔍 Validating data consistency...');

    const issues = [];

    // ตรวจสอบ buildings ที่ไม่มี posId
    const buildingsWithoutPosId = await building.countDocuments({ posId: { $exists: false } });
    if (buildingsWithoutPosId > 0) {
      issues.push(`Found ${buildingsWithoutPosId} buildings without posId`);
    }

    // ตรวจสอบ rooms ที่ไม่มี posId
    const roomsWithoutPosId = await room.countDocuments({ posId: { $exists: false } });
    if (roomsWithoutPosId > 0) {
      issues.push(`Found ${roomsWithoutPosId} rooms without posId`);
    }

    // ตรวจสอบ tags ที่ไม่มี posId
    const tagsWithoutPosId = await tagPOS.countDocuments({ posId: { $exists: false } });
    if (tagsWithoutPosId > 0) {
      issues.push(`Found ${tagsWithoutPosId} tags without posId`);
    }

    // ตรวจสอบ aboutHotels ที่ไม่มี posId
    const aboutHotelsWithoutPosId = await aboutHotel.countDocuments({ posId: { $exists: false } });
    if (aboutHotelsWithoutPosId > 0) {
      issues.push(`Found ${aboutHotelsWithoutPosId} aboutHotels without posId`);
    }

    if (issues.length > 0) {
      console.log('⚠️ Data validation issues found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('✅ All data is consistent!');
    }

    return issues.length === 0;
  } catch (error) {
    console.error('❌ Validation failed:', error);
    return false;
  }
};

// ฟังก์ชันหลัก
const runMigration = async () => {
  try {
    console.log('🚀 Starting POS migration...');
    
    // ตรวจสอบข้อมูลก่อน
    const isValid = await validateData();
    
    if (!isValid) {
      console.log('🔄 Running migration...');
      await updateExistingData();
      
      // ตรวจสอบข้อมูลหลัง migration
      console.log('🔍 Validating after migration...');
      await validateData();
    } else {
      console.log('✅ Data is already up to date!');
    }

    console.log('🎉 Migration process completed!');
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
};

// ถ้าเรียกไฟล์นี้โดยตรง
if (require.main === module) {
  runMigration();
}

module.exports = {
  updateExistingData,
  validateData,
  runMigration
}; 