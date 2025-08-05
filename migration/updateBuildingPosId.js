const mongoose = require('mongoose');
const building = require('../models/POS/building.schema');
const pos = require('../models/POS/pos.schema');

// เชื่อมต่อฐานข้อมูล
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/hotel', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration function
const updateBuildingPosId = async () => {
  try {
    console.log('🔄 Starting migration: Update posId for buildings...');

    // ดึงข้อมูล buildings ทั้งหมดที่ไม่มี posId
    const buildingsWithoutPosId = await building.find({ posId: { $exists: false } });
    console.log(`📊 Found ${buildingsWithoutPosId.length} buildings without posId`);

    let updatedCount = 0;

    for (const buildingDoc of buildingsWithoutPosId) {
      console.log(`🔄 Processing building: ${buildingDoc.nameBuilding} (ID: ${buildingDoc._id})`);
      console.log(`   - Partner ID: ${buildingDoc.partnerId}`);

      // หา POS data สำหรับ partner นี้
      let posData = await pos.findOne({ partnerId: buildingDoc.partnerId });
      
      if (!posData) {
        // สร้าง POS ใหม่ถ้าไม่มี
        posData = new pos({
          partnerId: buildingDoc.partnerId,
          buildingCount: 0,
          floorCount: 0,
          roomCount: 0,
          roomCountSleepGun: 0,
          quotaRoomSleepGun: 5
        });
        await posData.save();
        console.log(`   ✅ Created new POS for partner: ${buildingDoc.partnerId}`);
      }

      // อัปเดต building ด้วย posId
      await building.findByIdAndUpdate(buildingDoc._id, {
        posId: posData._id
      });

      updatedCount++;
      console.log(`   ✅ Updated building with posId: ${posData._id}`);
    }

    // ตรวจสอบ buildings ที่มี posId เป็น null หรือ undefined
    const buildingsWithNullPosId = await building.find({
      $or: [
        { posId: null },
        { posId: undefined }
      ]
    });
    
    console.log(`📊 Found ${buildingsWithNullPosId.length} buildings with null/undefined posId`);

    for (const buildingDoc of buildingsWithNullPosId) {
      console.log(`🔄 Processing building with null posId: ${buildingDoc.nameBuilding} (ID: ${buildingDoc._id})`);
      
      // หา POS data สำหรับ partner นี้
      let posData = await pos.findOne({ partnerId: buildingDoc.partnerId });
      
      if (!posData) {
        // สร้าง POS ใหม่ถ้าไม่มี
        posData = new pos({
          partnerId: buildingDoc.partnerId,
          buildingCount: 0,
          floorCount: 0,
          roomCount: 0,
          roomCountSleepGun: 0,
          quotaRoomSleepGun: 5
        });
        await posData.save();
        console.log(`   ✅ Created new POS for partner: ${buildingDoc.partnerId}`);
      }

      // อัปเดต building ด้วย posId
      await building.findByIdAndUpdate(buildingDoc._id, {
        posId: posData._id
      });

      updatedCount++;
      console.log(`   ✅ Updated building with posId: ${posData._id}`);
    }

    console.log(`✅ Migration completed! Updated ${updatedCount} buildings`);

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    // ปิดการเชื่อมต่อฐานข้อมูล
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// รัน migration
const runMigration = async () => {
  await connectDB();
  await updateBuildingPosId();
};

runMigration(); 