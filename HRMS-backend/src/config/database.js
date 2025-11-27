const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGO_URI;

    if (!uri) {
      logger.error("❌ MONGO_URI is not defined");
      process.exit(1);
    }

    await mongoose.connect(uri);

    logger.info("✅ MongoDB Connected Successfully");
  } catch (error) {
    logger.error("❌ MongoDB Connection Failed: " + error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
