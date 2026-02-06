const express = require('express');
const router = express.Router();
const Bag = require('../models/Bag');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  return res.status(401).json({ 
    success: false, 
    message: 'Not authenticated' 
  });
};

// GET /api/bag - Get user's bag
router.get('/', isAuthenticated, async (req, res) => {
  try {
    let bag = await Bag.findOne({ userId: req.session.userId });
    
    // If no bag exists, return empty array without creating a bag document
    if (!bag) {
      return res.json({ 
        success: true, 
        bag: [] 
      });
    }
    
    res.json({ 
      success: true, 
      bag: bag.items || [] 
    });
  } catch (error) {
    console.error('Get bag error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving bag' 
    });
  }
});

// POST /api/bag - Save/update user's bag
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { bag } = req.body;
    
    console.log('Saving bag for user:', req.session.userId);
    console.log('Bag data:', JSON.stringify(bag, null, 2));
    
    if (!Array.isArray(bag)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid bag data' 
      });
    }

    // If bag is empty, delete the bag document
    if (bag.length === 0) {
      await Bag.findOneAndDelete({ userId: req.session.userId });
      console.log('Bag deleted (empty)');
      return res.json({ 
        success: true, 
        message: 'Bag cleared successfully',
        bag: [] 
      });
    }

    // Find and update or create new bag document
    const updatedBag = await Bag.findOneAndUpdate(
      { userId: req.session.userId },
      { items: bag },
      { new: true, upsert: true }
    );

    console.log('Bag saved successfully. Items count:', updatedBag.items.length);
    res.json({ 
      success: true, 
      message: 'Bag saved successfully',
      bag: updatedBag.items 
    });
  } catch (error) {
    console.error('Save bag error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error saving bag' 
    });
  }
});

// DELETE /api/bag - Clear user's bag
router.delete('/', isAuthenticated, async (req, res) => {
  try {
    // Delete the bag document instead of just clearing items
    await Bag.findOneAndDelete({ userId: req.session.userId });

    res.json({ 
      success: true, 
      message: 'Bag cleared successfully' 
    });
  } catch (error) {
    console.error('Clear bag error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error clearing bag' 
    });
  }
});

module.exports = router;
