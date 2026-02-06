const mongoose = require('mongoose');
const connectDB = require('./config/database');
const Product = require('./models/Product');

// Connect to MongoDB
connectDB();

// Helper function to create engagement ring pricing
const createEngagementRingPricing = () => ({
  availableOptions: {
    metals: ['14k White Gold', '14k Yellow Gold', '18k White Gold', '18k Yellow Gold'],
    stones: ['Signity', 'Moissanite', 'Lab-Grown Diamond', 'Natural Diamond'],
    carats: ['1ct', '2ct', '3ct'],
    sizes: ['4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9']
  },
  pricing: {
    // Prices based on stone and metal combination
    combinations: [
      // Signity
      { stone: 'Signity', carat: '1ct', metal: '14k White Gold', price: 19000 },
      { stone: 'Signity', carat: '1ct', metal: '14k Yellow Gold', price: 19000 },
      { stone: 'Signity', carat: '1ct', metal: '18k White Gold', price: 21000 },
      { stone: 'Signity', carat: '1ct', metal: '18k Yellow Gold', price: 21000 },
      { stone: 'Signity', carat: '2ct', metal: '14k White Gold', price: 24000 },
      { stone: 'Signity', carat: '2ct', metal: '14k Yellow Gold', price: 24000 },
      { stone: 'Signity', carat: '2ct', metal: '18k White Gold', price: 26000 },
      { stone: 'Signity', carat: '2ct', metal: '18k Yellow Gold', price: 26000 },
      { stone: 'Signity', carat: '3ct', metal: '14k White Gold', price: 29000 },
      { stone: 'Signity', carat: '3ct', metal: '14k Yellow Gold', price: 29000 },
      { stone: 'Signity', carat: '3ct', metal: '18k White Gold', price: 32000 },
      { stone: 'Signity', carat: '3ct', metal: '18k Yellow Gold', price: 32000 },
      
      // Moissanite
      { stone: 'Moissanite', carat: '1ct', metal: '14k White Gold', price: 34000 },
      { stone: 'Moissanite', carat: '1ct', metal: '14k Yellow Gold', price: 34000 },
      { stone: 'Moissanite', carat: '1ct', metal: '18k White Gold', price: 37000 },
      { stone: 'Moissanite', carat: '1ct', metal: '18k Yellow Gold', price: 37000 },
      { stone: 'Moissanite', carat: '2ct', metal: '14k White Gold', price: 44000 },
      { stone: 'Moissanite', carat: '2ct', metal: '14k Yellow Gold', price: 44000 },
      { stone: 'Moissanite', carat: '2ct', metal: '18k White Gold', price: 47000 },
      { stone: 'Moissanite', carat: '2ct', metal: '18k Yellow Gold', price: 47000 },
      { stone: 'Moissanite', carat: '3ct', metal: '14k White Gold', price: 49000 },
      { stone: 'Moissanite', carat: '3ct', metal: '14k Yellow Gold', price: 49000 },
      { stone: 'Moissanite', carat: '3ct', metal: '18k White Gold', price: 53000 },
      { stone: 'Moissanite', carat: '3ct', metal: '18k Yellow Gold', price: 53000 },
      
      // Lab-Grown Diamond
      { stone: 'Lab-Grown Diamond', carat: '1ct', metal: '14k White Gold', price: 69000 },
      { stone: 'Lab-Grown Diamond', carat: '1ct', metal: '14k Yellow Gold', price: 69000 },
      { stone: 'Lab-Grown Diamond', carat: '1ct', metal: '18k White Gold', price: 72000 },
      { stone: 'Lab-Grown Diamond', carat: '1ct', metal: '18k Yellow Gold', price: 72000 },
      { stone: 'Lab-Grown Diamond', carat: '2ct', metal: '14k White Gold', price: 85000 },
      { stone: 'Lab-Grown Diamond', carat: '2ct', metal: '14k Yellow Gold', price: 85000 },
      { stone: 'Lab-Grown Diamond', carat: '2ct', metal: '18k White Gold', price: 88000 },
      { stone: 'Lab-Grown Diamond', carat: '2ct', metal: '18k Yellow Gold', price: 88000 },
      { stone: 'Lab-Grown Diamond', carat: '3ct', metal: '14k White Gold', price: 114000 },
      { stone: 'Lab-Grown Diamond', carat: '3ct', metal: '14k Yellow Gold', price: 114000 },
      { stone: 'Lab-Grown Diamond', carat: '3ct', metal: '18k White Gold', price: 117000 },
      { stone: 'Lab-Grown Diamond', carat: '3ct', metal: '18k Yellow Gold', price: 117000 },
      
      // Natural Diamond
      { stone: 'Natural Diamond', carat: '1ct', metal: '14k White Gold', price: 385000 },
      { stone: 'Natural Diamond', carat: '1ct', metal: '14k Yellow Gold', price: 385000 },
      { stone: 'Natural Diamond', carat: '1ct', metal: '18k White Gold', price: 389000 },
      { stone: 'Natural Diamond', carat: '1ct', metal: '18k Yellow Gold', price: 389000 },
      { stone: 'Natural Diamond', carat: '2ct', metal: '14k White Gold', price: 805000 },
      { stone: 'Natural Diamond', carat: '2ct', metal: '14k Yellow Gold', price: 805000 },
      { stone: 'Natural Diamond', carat: '2ct', metal: '18k White Gold', price: 809000 },
      { stone: 'Natural Diamond', carat: '2ct', metal: '18k Yellow Gold', price: 809000 },
      { stone: 'Natural Diamond', carat: '3ct', metal: '14k White Gold', price: 1550000 },
      { stone: 'Natural Diamond', carat: '3ct', metal: '14k Yellow Gold', price: 1550000 },
      { stone: 'Natural Diamond', carat: '3ct', metal: '18k White Gold', price: 1559000 },
      { stone: 'Natural Diamond', carat: '3ct', metal: '18k Yellow Gold', price: 1559000 },
    ]
  }
});

// Product data to seed
const products = [
  // Engagement Rings - All 1ct solitaire rings
  { 
    name: 'Heart Cut Ring', 
    basePrice: 19000, // Starting with Signity 14k
    image: 'shop-engagement-page/heart-cut-engagement-ring.jpg', 
    category: 'rings', 
    subcategory: 'engagement', 
    inStock: true, 
    label: 'Heart Cut Ring', 
    src: '/heart-cut-ring', 
    description: 'Classic heart-cut solitaire engagement ring. Prices vary based on stone type, metal, and carat size. For 4ct and above, please inquire through our IG/FB.',
    specifications: { cut: 'Heart' },
    ...createEngagementRingPricing()
  },  
  { 
    name: 'Marquis Cut Ring', 
    basePrice: 19000,
    image: 'shop-engagement-page/marquis-cut-engagement-ring.jpg', 
    category: 'rings', 
    subcategory: 'engagement', 
    inStock: true, 
    label: 'Marquis Cut Ring', 
    src: '/marquis-cut-ring', 
    description: 'Modern marquis-cut solitaire engagement ring. Prices vary based on stone type, metal, and carat size. For 4ct and above, please inquire through our IG/FB.',
    specifications: { cut: 'Marquis' },
    ...createEngagementRingPricing()
  },
  { 
    name: 'Oval Cut Ring', 
    basePrice: 19000,
    image: 'shop-engagement-page/oval-cut-engagement-ring.jpg', 
    category: 'rings', 
    subcategory: 'engagement', 
    inStock: true, 
    label: 'Oval Cut Ring', 
    src: '/oval-cut-ring', 
    description: 'Beautiful oval-cut solitaire engagement ring. Prices vary based on stone type, metal, and carat size. For 4ct and above, please inquire through our IG/FB.',
    specifications: { cut: 'Oval' },
    ...createEngagementRingPricing()
  },
  { 
    name: 'Pear Cut Ring', 
    basePrice: 19000,
    image: 'shop-engagement-page/pear-teardrop-engagement-ring.jpg', 
    category: 'rings', 
    subcategory: 'engagement', 
    inStock: true, 
    label: 'Pear Cut Ring', 
    src: '/pear-cut-ring', 
    description: 'Stunning pear-cut solitaire engagement ring. Prices vary based on stone type, metal, and carat size. For 4ct and above, please inquire through our IG/FB.',
    specifications: { cut: 'Pear' },
    ...createEngagementRingPricing()
  },
  { 
    name: 'Princess Cut Ring', 
    basePrice: 19000,
    image: 'shop-engagement-page/princess-cut-ring-closeup.jpg', 
    category: 'rings', 
    subcategory: 'engagement', 
    inStock: true, 
    label: 'Princess Cut Ring', 
    src: '/princess-cut-ring', 
    description: 'Graceful princess-cut solitaire engagement ring. Prices vary based on stone type, metal, and carat size. For 4ct and above, please inquire through our IG/FB.',
    specifications: { cut: 'Princess' },
    ...createEngagementRingPricing()
  },
  { 
    name: 'Radiant Cut Ring', 
    basePrice: 19000,
    image: 'shop-engagement-page/radiant-cut-engagement-ring.jpg', 
    category: 'rings', 
    subcategory: 'engagement', 
    inStock: true, 
    label: 'Radiant Cut Ring', 
    src: '/radiant-cut-ring', 
    description: 'Elegant radiant-cut solitaire engagement ring. Prices vary based on stone type, metal, and carat size. For 4ct and above, please inquire through our IG/FB.',
    specifications: { cut: 'Radiant' },
    ...createEngagementRingPricing()
  },
  { 
    name: 'Round Brilliant Cut Ring', 
    basePrice: 19000,
    image: 'shop-engagement-page/round-brilliant-cut-engagement-ring.jpg', 
    category: 'rings', 
    subcategory: 'engagement', 
    inStock: true, 
    label: 'Round Brilliant Cut Ring', 
    src: '/round-brilliant-cut-ring', 
    description: 'Romantic round brilliant-cut solitaire engagement ring. Prices vary based on stone type, metal, and carat size. For 4ct and above, please inquire through our IG/FB.',
    specifications: { cut: 'Round Brilliant' },
    ...createEngagementRingPricing()
  },
  { 
    name: 'Emerald Cut Ring', 
    basePrice: 19000,
    image: 'shop-engagement-page/emerald-cut-ring-closeup.jpg', 
    category: 'rings', 
    subcategory: 'engagement', 
    inStock: true, 
    label: 'Emerald Cut Ring', 
    src: '/emerald-cut-ring', 
    description: 'Timeless emerald-cut solitaire engagement ring. Prices vary based on stone type, metal, and carat size. For 4ct and above, please inquire through our IG/FB.',
    specifications: { cut: 'Emerald' },
    ...createEngagementRingPricing()
  },
  
  // Wedding Bands
  {
    name: 'Plain Bands',
    basePrice: 50000,
    image: 'shop-wedding-page/plain-gold-wedding-bands.jpg',
    category: 'bands',
    subcategory: 'wedding-bands',
    inStock: true,
    label: 'Plain Bands',
    src: '/wedding-band-plain',
    description: 'Classic plain wedding band set. Available in 14k or 18k gold. Size 3-7 only.',
    bandCarat: 'plain',
    availableOptions: {
      metals: ['14k White Gold', '14k Yellow Gold', '18k White Gold', '18k Yellow Gold'],
      stones: ['Moissanite'],
      sizes: ['3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7']
    },
    pricing: {
      combinations: [
        { metal: '14k White Gold', stone: 'Moissanite', size: '3-7', price: 50000 },
        { metal: '14k Yellow Gold', stone: 'Moissanite', size: '3-7', price: 50000 },
        { metal: '18k White Gold', stone: 'Moissanite', size: '3-7', price: 58000 },
        { metal: '18k Yellow Gold', stone: 'Moissanite', size: '3-7', price: 58000 }
      ]
    }
  },
  {
    name: 'Half Eternity 0.30ct Moissanite',
    basePrice: 75000,
    image: 'shop-wedding-page/sparkling-diamond-ring-with-classic-metal-wedding-bands.jpg',
    category: 'bands',
    subcategory: 'wedding-bands',
    inStock: true,
    label: 'Half Eternity 0.30ct',
    src: '/wedding-band-030ct',
    description: 'Stunning half eternity wedding band set with 0.30ct stones. Size 3-7 only.',
    bandCarat: '0.30',
    availableOptions: {
      metals: ['14k White Gold', '14k Yellow Gold', '18k White Gold', '18k Yellow Gold'],
      stones: ['Moissanite', 'Signity', 'Lab Diamond', 'Natural Diamond'],
      sizes: ['3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7']
    },
    pricing: {
      combinations: [
        { metal: '14k White Gold', stone: 'Moissanite', size: '3-7', price: 75000 },
        { metal: '14k Yellow Gold', stone: 'Moissanite', size: '3-7', price: 75000 },
        { metal: '18k White Gold', stone: 'Moissanite', size: '3-7', price: 85000 },
        { metal: '18k Yellow Gold', stone: 'Moissanite', size: '3-7', price: 85000 },
        { metal: '14k White Gold', stone: 'Signity', size: '3-7', price: 65000 },
        { metal: '14k Yellow Gold', stone: 'Signity', size: '3-7', price: 65000 },
        { metal: '18k White Gold', stone: 'Signity', size: '3-7', price: 75000 },
        { metal: '18k Yellow Gold', stone: 'Signity', size: '3-7', price: 75000 },
        { metal: '14k White Gold', stone: 'Lab Diamond', size: '3-7', price: 140000 },
        { metal: '14k Yellow Gold', stone: 'Lab Diamond', size: '3-7', price: 140000 },
        { metal: '18k White Gold', stone: 'Lab Diamond', size: '3-7', price: 150000 },
        { metal: '18k Yellow Gold', stone: 'Lab Diamond', size: '3-7', price: 150000 },
        { metal: '14k White Gold', stone: 'Natural Diamond', size: '3-7', price: 240000 },
        { metal: '14k Yellow Gold', stone: 'Natural Diamond', size: '3-7', price: 240000 },
        { metal: '18k White Gold', stone: 'Natural Diamond', size: '3-7', price: 250000 },
        { metal: '18k Yellow Gold', stone: 'Natural Diamond', size: '3-7', price: 250000 }
      ]
    }
  },
  {
    name: 'Half Eternity 0.01ct Moissanite - Set A',
    basePrice: 65000,
    image: 'shop-wedding-page/stacked-gold-rings-clear-wedding-bands.jpg',
    category: 'bands',
    subcategory: 'wedding-bands',
    inStock: true,
    label: 'Half Eternity 0.01ct - Set A',
    src: '/wedding-band-001ct-a',
    description: 'Elegant half eternity wedding band set with 0.01ct stones. Size 3-7 only.',
    bandCarat: '0.01-A',
    availableOptions: {
      metals: ['14k White Gold', '14k Yellow Gold', '18k White Gold', '18k Yellow Gold'],
      stones: ['Moissanite', 'Signity', 'Lab Diamond', 'Natural Diamond'],
      sizes: ['3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7']
    },
    pricing: {
      combinations: [
        { metal: '14k White Gold', stone: 'Moissanite', size: '3-7', price: 65000 },
        { metal: '14k Yellow Gold', stone: 'Moissanite', size: '3-7', price: 65000 },
        { metal: '18k White Gold', stone: 'Moissanite', size: '3-7', price: 75000 },
        { metal: '18k Yellow Gold', stone: 'Moissanite', size: '3-7', price: 75000 },
        { metal: '14k White Gold', stone: 'Signity', size: '3-7', price: 61000 },
        { metal: '14k Yellow Gold', stone: 'Signity', size: '3-7', price: 61000 },
        { metal: '18k White Gold', stone: 'Signity', size: '3-7', price: 71000 },
        { metal: '18k Yellow Gold', stone: 'Signity', size: '3-7', price: 71000 },
        { metal: '14k White Gold', stone: 'Lab Diamond', size: '3-7', price: 75000 },
        { metal: '14k Yellow Gold', stone: 'Lab Diamond', size: '3-7', price: 75000 },
        { metal: '18k White Gold', stone: 'Lab Diamond', size: '3-7', price: 85000 },
        { metal: '18k Yellow Gold', stone: 'Lab Diamond', size: '3-7', price: 85000 },
        { metal: '14k White Gold', stone: 'Natural Diamond', size: '3-7', price: 85000 },
        { metal: '14k Yellow Gold', stone: 'Natural Diamond', size: '3-7', price: 85000 },
        { metal: '18k White Gold', stone: 'Natural Diamond', size: '3-7', price: 95000 },
        { metal: '18k Yellow Gold', stone: 'Natural Diamond', size: '3-7', price: 95000 }
      ]
    }
  },
  {
    name: 'Half Eternity 0.01ct Moissanite - Set B',
    basePrice: 55000,
    image: 'shop-wedding-page/thin-eternity-and-plain-band-wedding-bands.jpg',
    category: 'bands',
    subcategory: 'wedding-bands',
    inStock: true,
    label: 'Half Eternity 0.01ct - Set B',
    src: '/wedding-band-001ct-b',
    description: 'Delicate half eternity wedding band set with 0.01ct stones. Size 3-7 only.',
    bandCarat: '0.01-B',
    availableOptions: {
      metals: ['14k White Gold', '14k Yellow Gold', '18k White Gold', '18k Yellow Gold'],
      stones: ['Moissanite', 'Signity', 'Lab Diamond', 'Natural Diamond'],
      sizes: ['3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7']
    },
    pricing: {
      combinations: [
        { metal: '14k White Gold', stone: 'Moissanite', size: '3-7', price: 55000 },
        { metal: '14k Yellow Gold', stone: 'Moissanite', size: '3-7', price: 55000 },
        { metal: '18k White Gold', stone: 'Moissanite', size: '3-7', price: 65000 },
        { metal: '18k Yellow Gold', stone: 'Moissanite', size: '3-7', price: 65000 },
        { metal: '14k White Gold', stone: 'Signity', size: '3-7', price: 51000 },
        { metal: '14k Yellow Gold', stone: 'Signity', size: '3-7', price: 51000 },
        { metal: '18k White Gold', stone: 'Signity', size: '3-7', price: 61000 },
        { metal: '18k Yellow Gold', stone: 'Signity', size: '3-7', price: 61000 },
        { metal: '14k White Gold', stone: 'Lab Diamond', size: '3-7', price: 65000 },
        { metal: '14k Yellow Gold', stone: 'Lab Diamond', size: '3-7', price: 65000 },
        { metal: '18k White Gold', stone: 'Lab Diamond', size: '3-7', price: 75000 },
        { metal: '18k Yellow Gold', stone: 'Lab Diamond', size: '3-7', price: 75000 },
        { metal: '14k White Gold', stone: 'Natural Diamond', size: '3-7', price: 75000 },
        { metal: '14k Yellow Gold', stone: 'Natural Diamond', size: '3-7', price: 75000 },
        { metal: '18k White Gold', stone: 'Natural Diamond', size: '3-7', price: 85000 },
        { metal: '18k Yellow Gold', stone: 'Natural Diamond', size: '3-7', price: 85000 }
      ]
    }
  },
  {
    name: 'Half Eternity 0.01ct Moissanite - Set C',
    basePrice: 69000,
    image: 'shop-wedding-page/gold-diamond-v-wedding-bands.jpg',
    category: 'bands',
    subcategory: 'wedding-bands',
    inStock: true,
    label: 'Half Eternity 0.01ct - Set C',
    src: '/wedding-band-001ct-c',
    description: 'Sophisticated V-shaped half eternity wedding band set with 0.01ct stones. Size 3-7 only.',
    bandCarat: '0.01-C',
    availableOptions: {
      metals: ['14k White Gold', '14k Yellow Gold', '18k White Gold', '18k Yellow Gold'],
      stones: ['Moissanite', 'Signity', 'Lab Diamond', 'Natural Diamond'],
      sizes: ['3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7']
    },
    pricing: {
      combinations: [
        { metal: '14k White Gold', stone: 'Moissanite', size: '3-7', price: 69000 },
        { metal: '14k Yellow Gold', stone: 'Moissanite', size: '3-7', price: 69000 },
        { metal: '18k White Gold', stone: 'Moissanite', size: '3-7', price: 79000 },
        { metal: '18k Yellow Gold', stone: 'Moissanite', size: '3-7', price: 79000 },
        { metal: '14k White Gold', stone: 'Signity', size: '3-7', price: 65000 },
        { metal: '14k Yellow Gold', stone: 'Signity', size: '3-7', price: 65000 },
        { metal: '18k White Gold', stone: 'Signity', size: '3-7', price: 75000 },
        { metal: '18k Yellow Gold', stone: 'Signity', size: '3-7', price: 75000 },
        { metal: '14k White Gold', stone: 'Lab Diamond', size: '3-7', price: 79000 },
        { metal: '14k Yellow Gold', stone: 'Lab Diamond', size: '3-7', price: 79000 },
        { metal: '18k White Gold', stone: 'Lab Diamond', size: '3-7', price: 89000 },
        { metal: '18k Yellow Gold', stone: 'Lab Diamond', size: '3-7', price: 89000 },
        { metal: '14k White Gold', stone: 'Natural Diamond', size: '3-7', price: 89000 },
        { metal: '14k Yellow Gold', stone: 'Natural Diamond', size: '3-7', price: 89000 },
        { metal: '18k White Gold', stone: 'Natural Diamond', size: '3-7', price: 99000 },
        { metal: '18k Yellow Gold', stone: 'Natural Diamond', size: '3-7', price: 99000 }
      ]
    }
  },
  {
    name: 'Half Eternity 0.01ct Moissanite - Set D',
    basePrice: 69000,
    image: 'shop-wedding-page/matching-silver-rings-small-diamonds-wedding-bands.jpeg',
    category: 'bands',
    subcategory: 'wedding-bands',
    inStock: true,
    label: 'Half Eternity 0.01ct - Set D',
    src: '/wedding-band-001ct-d',
    description: 'Matching half eternity wedding band set with 0.01ct stones. Size 3-7 only.',
    bandCarat: '0.01-D',
    availableOptions: {
      metals: ['14k White Gold', '14k Yellow Gold', '18k White Gold', '18k Yellow Gold'],
      stones: ['Moissanite', 'Signity', 'Lab Diamond', 'Natural Diamond'],
      sizes: ['3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7']
    },
    pricing: {
      combinations: [
        { metal: '14k White Gold', stone: 'Moissanite', size: '3-7', price: 69000 },
        { metal: '14k Yellow Gold', stone: 'Moissanite', size: '3-7', price: 69000 },
        { metal: '18k White Gold', stone: 'Moissanite', size: '3-7', price: 79000 },
        { metal: '18k Yellow Gold', stone: 'Moissanite', size: '3-7', price: 79000 },
        { metal: '14k White Gold', stone: 'Signity', size: '3-7', price: 62000 },
        { metal: '14k Yellow Gold', stone: 'Signity', size: '3-7', price: 62000 },
        { metal: '18k White Gold', stone: 'Signity', size: '3-7', price: 72000 },
        { metal: '18k Yellow Gold', stone: 'Signity', size: '3-7', price: 72000 },
        { metal: '14k White Gold', stone: 'Lab Diamond', size: '3-7', price: 89000 },
        { metal: '14k Yellow Gold', stone: 'Lab Diamond', size: '3-7', price: 89000 },
        { metal: '18k White Gold', stone: 'Lab Diamond', size: '3-7', price: 99000 },
        { metal: '18k Yellow Gold', stone: 'Lab Diamond', size: '3-7', price: 99000 },
        { metal: '14k White Gold', stone: 'Natural Diamond', size: '3-7', price: 99000 },
        { metal: '14k Yellow Gold', stone: 'Natural Diamond', size: '3-7', price: 99000 },
        { metal: '18k White Gold', stone: 'Natural Diamond', size: '3-7', price: 109000 },
        { metal: '18k Yellow Gold', stone: 'Natural Diamond', size: '3-7', price: 109000 }
      ]
    }
  },

  { 
    name: '.30 ct Tennis Necklace', 
    basePrice: 195000,
    image: 'shop-other-accessories-page/diamond-tennis-necklace.jpg', 
    category: 'necklaces', 
    subcategory: 'accessories', 
    inStock: true, 
    label: 'Tennis Necklace', 
    src: '/tennis-necklace',
    description: 'Stunning diamond tennis necklace with continuous brilliance.',
    availableOptions: {
      metals: ['14k White Gold', '14k Yellow Gold', '18k White Gold', '18k Yellow Gold'],
      stones: ['Signity', 'Moissanite', 'Lab-Grown Diamond', 'Natural Diamond'],
      sizes: ['3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7']
    },
    pricing: {
      combinations: [
        { stone: 'Signity', metal: '14k White Gold', price: 65000 },
        { stone: 'Signity', metal: '14k Yellow Gold', price: 65000 },
        { stone: 'Signity', metal: '18k White Gold', price: 75000 },
        { stone: 'Signity', metal: '18k Yellow Gold', price: 75000 },
        { stone: 'Moissanite', metal: '14k White Gold', price: 75000 },
        { stone: 'Moissanite', metal: '14k Yellow Gold', price: 75000 },
        { stone: 'Moissanite', metal: '18k White Gold', price: 85000 },
        { stone: 'Moissanite', metal: '18k Yellow Gold', price: 85000 },
        { stone: 'Lab-Grown Diamond', metal: '14k White Gold', price: 140000 },
        { stone: 'Lab-Grown Diamond', metal: '14k Yellow Gold', price: 140000 },
        { stone: 'Lab-Grown Diamond', metal: '18k White Gold', price: 150000 },
        { stone: 'Lab-Grown Diamond', metal: '18k Yellow Gold', price: 150000 },
        { stone: 'Natural Diamond', metal: '14k White Gold', price: 240000 },
        { stone: 'Natural Diamond', metal: '14k Yellow Gold', price: 240000 },
        { stone: 'Natural Diamond', metal: '18k White Gold', price: 250000 },
        { stone: 'Natural Diamond', metal: '18k Yellow Gold', price: 250000 }
      ]
    }
  },
  { 
    name: 'Stud Earrings', 
    basePrice: 29000,
    image: 'shop-other-accessories-page/diamond-stud-earrings.jpg', 
    category: 'earrings', 
    subcategory: 'accessories', 
    inStock: true, 
    label: 'Stud Earrings', 
    src: '/stud-earrings',
    description: 'Elegant diamond stud earrings perfect for any occasion. Price per pair (each stone carat size). With GRA certificate for Moissanite, IGI certificate for Lab Grown and Natural Diamond.',
    availableOptions: {
      metals: ['14k White Gold', '14k Yellow Gold', '18k White Gold', '18k Yellow Gold'],
      stones: ['Signity', 'Moissanite', 'Lab-Grown Diamond', 'Natural Diamond'],
      carats: ['1', '2', '3']
    },
    pricing: {
      combinations: [
        // Signity - 1ct each stone
        { stone: 'Signity', carat: '1', metal: '14k White Gold', price: 29000 },
        { stone: 'Signity', carat: '1', metal: '14k Yellow Gold', price: 29000 },
        { stone: 'Signity', carat: '1', metal: '18k White Gold', price: 33000 },
        { stone: 'Signity', carat: '1', metal: '18k Yellow Gold', price: 33000 },
        // Signity - 2ct each stone
        { stone: 'Signity', carat: '2', metal: '14k White Gold', price: 33000 },
        { stone: 'Signity', carat: '2', metal: '14k Yellow Gold', price: 33000 },
        { stone: 'Signity', carat: '2', metal: '18k White Gold', price: 37000 },
        { stone: 'Signity', carat: '2', metal: '18k Yellow Gold', price: 37000 },
        // Signity - 3ct each stone
        { stone: 'Signity', carat: '3', metal: '14k White Gold', price: 38000 },
        { stone: 'Signity', carat: '3', metal: '14k Yellow Gold', price: 38000 },
        { stone: 'Signity', carat: '3', metal: '18k White Gold', price: 42000 },
        { stone: 'Signity', carat: '3', metal: '18k Yellow Gold', price: 42000 },
        
        // Moissanite - 1ct each stone
        { stone: 'Moissanite', carat: '1', metal: '14k White Gold', price: 36000 },
        { stone: 'Moissanite', carat: '1', metal: '14k Yellow Gold', price: 36000 },
        { stone: 'Moissanite', carat: '1', metal: '18k White Gold', price: 40000 },
        { stone: 'Moissanite', carat: '1', metal: '18k Yellow Gold', price: 40000 },
        // Moissanite - 2ct each stone
        { stone: 'Moissanite', carat: '2', metal: '14k White Gold', price: 46000 },
        { stone: 'Moissanite', carat: '2', metal: '14k Yellow Gold', price: 46000 },
        { stone: 'Moissanite', carat: '2', metal: '18k White Gold', price: 50000 },
        { stone: 'Moissanite', carat: '2', metal: '18k Yellow Gold', price: 50000 },
        // Moissanite - 3ct each stone
        { stone: 'Moissanite', carat: '3', metal: '14k White Gold', price: 56000 },
        { stone: 'Moissanite', carat: '3', metal: '14k Yellow Gold', price: 56000 },
        { stone: 'Moissanite', carat: '3', metal: '18k White Gold', price: 60000 },
        { stone: 'Moissanite', carat: '3', metal: '18k Yellow Gold', price: 60000 },
        
        // Lab-Grown Diamond - 1ct each stone
        { stone: 'Lab-Grown Diamond', carat: '1', metal: '14k White Gold', price: 89000 },
        { stone: 'Lab-Grown Diamond', carat: '1', metal: '14k Yellow Gold', price: 89000 },
        { stone: 'Lab-Grown Diamond', carat: '1', metal: '18k White Gold', price: 94000 },
        { stone: 'Lab-Grown Diamond', carat: '1', metal: '18k Yellow Gold', price: 94000 },
        // Lab-Grown Diamond - 2ct each stone
        { stone: 'Lab-Grown Diamond', carat: '2', metal: '14k White Gold', price: 139000 },
        { stone: 'Lab-Grown Diamond', carat: '2', metal: '14k Yellow Gold', price: 139000 },
        { stone: 'Lab-Grown Diamond', carat: '2', metal: '18k White Gold', price: 144000 },
        { stone: 'Lab-Grown Diamond', carat: '2', metal: '18k Yellow Gold', price: 144000 },
        // Lab-Grown Diamond - 3ct each stone
        { stone: 'Lab-Grown Diamond', carat: '3', metal: '14k White Gold', price: 189000 },
        { stone: 'Lab-Grown Diamond', carat: '3', metal: '14k Yellow Gold', price: 189000 },
        { stone: 'Lab-Grown Diamond', carat: '3', metal: '18k White Gold', price: 194000 },
        { stone: 'Lab-Grown Diamond', carat: '3', metal: '18k Yellow Gold', price: 194000 },
        
        // Natural Diamond - 1ct each stone
        { stone: 'Natural Diamond', carat: '1', metal: '14k White Gold', price: 794000 },
        { stone: 'Natural Diamond', carat: '1', metal: '14k Yellow Gold', price: 794000 },
        { stone: 'Natural Diamond', carat: '1', metal: '18k White Gold', price: 799000 },
        { stone: 'Natural Diamond', carat: '1', metal: '18k Yellow Gold', price: 799000 },
        // Natural Diamond - 2ct each stone
        { stone: 'Natural Diamond', carat: '2', metal: '14k White Gold', price: 1594000 },
        { stone: 'Natural Diamond', carat: '2', metal: '14k Yellow Gold', price: 1594000 },
        { stone: 'Natural Diamond', carat: '2', metal: '18k White Gold', price: 1599000 },
        { stone: 'Natural Diamond', carat: '2', metal: '18k Yellow Gold', price: 1599000 },
        // Natural Diamond - 3ct each stone
        { stone: 'Natural Diamond', carat: '3', metal: '14k White Gold', price: 3100000 },
        { stone: 'Natural Diamond', carat: '3', metal: '14k Yellow Gold', price: 3100000 },
        { stone: 'Natural Diamond', carat: '3', metal: '18k White Gold', price: 3150000 },
        { stone: 'Natural Diamond', carat: '3', metal: '18k Yellow Gold', price: 3150000 }
      ]
    }
  },
  { 
    name: '.30 ct Tennis Bracelet', 
    basePrice: 149000,
    image: 'shop-other-accessories-page/diamond-tennis-bracelet.jpg', 
    category: 'bracelets', 
    subcategory: 'accessories', 
    inStock: true, 
    label: 'Tennis Bracelet', 
    src: '/tennis-bracelet',
    description: 'Classic diamond tennis bracelet with brilliant sparkle.',
    availableOptions: {
      metals: ['14k White Gold', '14k Yellow Gold', '18k White Gold', '18k Yellow Gold'],
      stones: ['Signity', 'Moissanite', 'Lab-Grown Diamond', 'Natural Diamond'],
      sizes: ['3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7']
    },
    pricing: {
      combinations: [
        { stone: 'Signity', metal: '14k White Gold', price: 51000 },
        { stone: 'Signity', metal: '14k Yellow Gold', price: 51000 },
        { stone: 'Signity', metal: '18k White Gold', price: 61000 },
        { stone: 'Signity', metal: '18k Yellow Gold', price: 61000 },
        { stone: 'Moissanite', metal: '14k White Gold', price: 55000 },
        { stone: 'Moissanite', metal: '14k Yellow Gold', price: 55000 },
        { stone: 'Moissanite', metal: '18k White Gold', price: 65000 },
        { stone: 'Moissanite', metal: '18k Yellow Gold', price: 65000 },
        { stone: 'Lab-Grown Diamond', metal: '14k White Gold', price: 65000 },
        { stone: 'Lab-Grown Diamond', metal: '14k Yellow Gold', price: 65000 },
        { stone: 'Lab-Grown Diamond', metal: '18k White Gold', price: 75000 },
        { stone: 'Lab-Grown Diamond', metal: '18k Yellow Gold', price: 75000 },
        { stone: 'Natural Diamond', metal: '14k White Gold', price: 75000 },
        { stone: 'Natural Diamond', metal: '14k Yellow Gold', price: 75000 },
        { stone: 'Natural Diamond', metal: '18k White Gold', price: 85000 },
        { stone: 'Natural Diamond', metal: '18k Yellow Gold', price: 85000 }
      ]
    }
  },
  // End of products array
];

const seedDatabase = async () => {
  try {
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert new products
    const result = await Product.insertMany(products);
    console.log(`Successfully seeded ${result.length} products`);    // Display some sample products
    console.log('\nSample products:');
    result.slice(0, 5).forEach(product => {
      console.log(`- ${product.name} (${product.category}): Starting at ₱${product.basePrice.toLocaleString()}`);
    });

    console.log(`\n✅ Total products seeded: ${result.length}`);
    console.log('   - 9 Engagement Rings');
    console.log('   - 6 Wedding Band Styles');
    console.log('   - 3 Accessories (Earrings, Necklace, Bracelet)');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed
seedDatabase();
