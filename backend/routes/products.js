const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET all products
router.get('/', async (req, res) => {
  try {
    const { category, subcategory, inStock } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (inStock !== undefined) filter.inStock = inStock === 'true';
    
    const products = await Product.find(filter);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST calculate price based on specifications
router.post('/:id/calculate-price', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const { specifications } = req.body;
    const finalPrice = product.calculatePrice(specifications);
    
    res.json({
      productId: product._id,
      productName: product.name,
      specifications: specifications,
      basePrice: product.basePrice,
      finalPrice: finalPrice,
      breakdown: {
        base: product.basePrice,
        metalModifier: specifications.metal ? 
          (product.pricing.metal?.find(m => m.type === specifications.metal)?.priceModifier || 0) : 0,
        stoneModifier: specifications.stone ? 
          (product.pricing.stone?.find(s => s.type === specifications.stone)?.priceModifier || 0) : 0,
        caratModifier: specifications.carat ? 
          (product.pricing.carat?.find(c => c.size === specifications.carat)?.priceModifier || 0) : 0
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST create new product
router.post('/', async (req, res) => {
  try {
    const product = new Product(req.body);
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
