const mongoose = require('mongoose');
const Building = require('../models/POS/building.schema');
const TagPOS = require('../models/POS/tag.schema');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function migrateData() {
  try {
    console.log('🔄 Starting migration...');

    // Get a default partner ID (you may need to adjust this based on your data)
    // For now, we'll use a placeholder - you should replace this with an actual partner ID
    const defaultPartnerId = '507f1f77bcf86cd799439011'; // Replace with actual partner ID

    // Migrate buildings
    const buildingsWithoutPartnerId = await Building.find({ partnerId: { $exists: false } });
    console.log(`📦 Found ${buildingsWithoutPartnerId.length} buildings without partnerId`);

    if (buildingsWithoutPartnerId.length > 0) {
      await Building.updateMany(
        { partnerId: { $exists: false } },
        { $set: { partnerId: defaultPartnerId } }
      );
      console.log('✅ Updated buildings with default partnerId');
    }

    // Migrate tags
    const tagsWithoutPartnerId = await TagPOS.find({ partnerId: { $exists: false } });
    console.log(`📦 Found ${tagsWithoutPartnerId.length} tags without partnerId`);

    if (tagsWithoutPartnerId.length > 0) {
      await TagPOS.updateMany(
        { partnerId: { $exists: false } },
        { $set: { partnerId: defaultPartnerId } }
      );
      console.log('✅ Updated tags with default partnerId');
    }

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run migration
migrateData(); 