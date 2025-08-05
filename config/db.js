require('dotenv').config();

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('MONGO_URI:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
