const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyUserPassword } = require('../utils/tokenUtils');

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../frontend/public/uploads/avatars');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + req.params.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new user
router.post('/', async (req, res) => {
  try {
    const user = new User(req.body);
    const newUser = await user.save();
    const userResponse = newUser.toObject();
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    // Don't allow password update through this route
    if (req.body.password) {
      delete req.body.password;
    }
    
    // If email is being updated, check for uniqueness
    if (req.body.email) {
      const existingUser = await User.findOne({ 
        email: req.body.email,
        _id: { $ne: req.params.id }
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use by another account' });
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST change password
router.post('/:id/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    
    // Use shared password verification utility
    const verification = await verifyUserPassword(User, req.params.id, currentPassword);
    
    if (!verification.success) {
      const statusCode = verification.message === 'User not found' ? 404 : 
                         verification.message === 'Current password is incorrect' ? 401 : 400;
      return res.status(statusCode).json({ message: verification.message });
    }
    
    const user = verification.user;
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST set password for Google users
router.post('/:id/set-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user already has a password
    if (user.password) {
      return res.status(400).json({ message: 'Password already set. Use change password instead.' });
    }
    
    // Set password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password set successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST upload avatar
router.post('/:id/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      // Delete uploaded file if user not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete old avatar if it's not the default
    if (user.avatar && user.avatar !== '/images/profile-icon.png' && user.avatar.startsWith('/uploads/')) {
      const oldAvatarPath = path.join(__dirname, '../../frontend/public', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }
    
    // Update user avatar path
    const avatarPath = '/uploads/avatars/' + req.file.filename;
    user.avatar = avatarPath;
    await user.save();
    
    res.json({ 
      message: 'Avatar uploaded successfully',
      avatar: avatarPath
    });
  } catch (error) {
    // Delete uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
});

// DELETE avatar
router.delete('/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete avatar file if it's not the default
    if (user.avatar && user.avatar !== '/images/profile-icon.png' && user.avatar.startsWith('/uploads/')) {
      const avatarPath = path.join(__dirname, '../../frontend/public', user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }
    
    // Reset to default avatar
    user.avatar = '/images/profile-icon.png';
    await user.save();
    
    res.json({ 
      message: 'Avatar removed successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST add new address
router.post('/:id/addresses', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If this is set as default, unset other defaults
    if (req.body.isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    } else if (user.addresses.length === 0) {
      // First address is always default
      req.body.isDefault = true;
    }
    
    user.addresses.push(req.body);
    await user.save();
    
    res.status(201).json({ 
      message: 'Address added successfully',
      addresses: user.addresses
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update address
router.put('/:id/addresses/:addressId', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const address = user.addresses.id(req.params.addressId);
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    // If this is set as default, unset other defaults
    if (req.body.isDefault && !address.isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }
    
    // Update address fields
    Object.keys(req.body).forEach(key => {
      address[key] = req.body[key];
    });
    
    await user.save();
    
    res.json({ 
      message: 'Address updated successfully',
      addresses: user.addresses
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE address
router.delete('/:id/addresses/:addressId', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const address = user.addresses.id(req.params.addressId);
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    const wasDefault = address.isDefault;
    
    // Remove the address using pull
    user.addresses.pull(req.params.addressId);
    
    // If the deleted address was default and there are other addresses, set the first one as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }
    
    await user.save();
    
    res.json({ 
      message: 'Address deleted successfully',
      addresses: user.addresses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT set address as default
router.put('/:id/addresses/:addressId/default', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if address exists
    const addressExists = user.addresses.some(addr => addr._id.toString() === req.params.addressId);
    
    if (!addressExists) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    // Update all addresses: set isDefault to false for all, then true for the selected one
    user.addresses = user.addresses.map(addr => {
      addr.isDefault = addr._id.toString() === req.params.addressId;
      return addr;
    });
    
    await user.save();
    
    res.json({ 
      message: 'Default address updated successfully',
      addresses: user.addresses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
