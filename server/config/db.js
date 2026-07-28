const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("MONGODB_URI is not set. Please configure server/.env.");
      process.exit(1);
    }

    mongoose.set("strictQuery", false);

    await mongoose.connect(uri, {
      dbName: "staypro",
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });

    console.log("✓ MongoDB Connected Successfully");
    console.log(`Database: ${mongoose.connection.name}`);

    return mongoose.connection;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
