const mongoose = require('mongoose');
const tagPOS = require('../models/POS/tag.schema');

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
const removeRoomIdFromTags = async () => {
  try {
    console.log('🔄 Starting migration: Remove roomId from tags...');
    
    // ดึงข้อมูล tags ทั้งหมด
    const tags = await tagPOS.find({});
    console.log(`📊 Found ${tags.length} tags to process`);
    
    let updatedCount = 0;
    
    for (const tag of tags) {
      // ตรวจสอบว่ามี roomId หรือไม่
      if (tag.roomId) {
        console.log(`🔄 Processing tag: ${tag.name} (ID: ${tag._id})`);
        console.log(`   - Current roomId: ${tag.roomId}`);
        
        // ลบ roomId ออกจาก document
        await tagPOS.findByIdAndUpdate(tag._id, {
          $unset: { roomId: 1 }
        });
        
        updatedCount++;
        console.log(`   ✅ Removed roomId from tag: ${tag.name}`);
      }
    }
    
    console.log(`✅ Migration completed! Updated ${updatedCount} tags`);
    
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
  await removeRoomIdFromTags();
};

runMigration(); 