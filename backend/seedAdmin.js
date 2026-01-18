require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const MONGODB_URI = 'mongodb+srv://ECJAdmin:ecjwebsea@cluster0.wprbtij.mongodb.net/endlesscharms?retryWrites=true&w=majority&appName=Cluster0';

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@endlesscharms.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      
      // Update existing user to be admin
      existingAdmin.isAdmin = true;
      await existingAdmin.save();
      console.log('✅ Updated existing user to admin status');
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Create admin user
      const admin = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@endlesscharms.com',
        password: hashedPassword,
        isAdmin: true
      });
      
      await admin.save();
      console.log('✅ Admin user created successfully');
    }
    
    console.log('\n📧 Admin Credentials:');
    console.log('Email: admin@endlesscharms.com');
    console.log('Password: admin123');
    console.log('\n⚠️  Please change the password after first login!\n');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Connection closed');
  }
}

createAdminUser();
