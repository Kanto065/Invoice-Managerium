const mongoose = require("mongoose");
const logger = require("./logger.config");

const dbConnection = async () => {
  try {
    // Check if MONGODB_URL is defined
    if (!process.env.MONGODB_URL) {
      console.log("MONGODB_URL is not defined in .env file");
      process.exit(1);
    }
    const conn = await mongoose.connect(process.env.MONGODB_URL);
    console.log(`✅ Database Connected With ${conn.connection.host}!`);
    logger.info(`✅ Database Connected With ${conn.connection.host}!`);
  } catch (error) {
    console.log(`❌ Database Connection Failed! Error: ${error}`);
    logger.error(`❌ Database Connection Failed! Error: ${error}`);
  }
};
module.exports = dbConnection;
