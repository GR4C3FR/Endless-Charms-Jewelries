const mongoose = require('mongoose');

const connectDB = async () => {  try {
    // MongoDB Atlas connection string with database name
    // Format: mongodb+srv://<username>:<password>@cluster.mongodb.net/<database-name>?options
    const MONGODB_URI = 'mongodb+srv://ECJAdmin:ecjwebsea@cluster0.wprbtij.mongodb.net/endlesscharms?retryWrites=true&w=majority&appName=Cluster0';
    const conn = await mongoose.connect(MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
