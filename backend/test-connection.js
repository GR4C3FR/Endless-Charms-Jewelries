require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔄 Testing MongoDB connection...');
    console.log('');
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ECJAdmin:ecjwebsea@cluster0.wprbtij.mongodb.net/endlesscharms?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('Using MongoDB URI:', MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@'));
    console.log('');
    
    const conn = await mongoose.connect(MONGODB_URI);
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log('📦 Database:', conn.connection.name);
    console.log('🌐 Host:', conn.connection.host);
    console.log('');
    
    // Test a simple query
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📂 Collections in database:');
    collections.forEach(col => console.log('  -', col.name));
    
    await mongoose.connection.close();
    console.log('');
    console.log('✅ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ MongoDB Connection Failed!');
    console.error('Error:', error.message);
    console.error('');
    console.error('Common solutions:');
    console.error('1. Check if MongoDB Atlas allows your IP address');
    console.error('2. Verify MONGODB_URI in .env file');
    console.error('3. Check if your cluster is running');
    console.error('4. Verify username and password are correct');
    console.error('');
    process.exit(1);
  }
}

testConnection();
