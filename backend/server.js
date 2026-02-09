const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./config/database');

// Import routes
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const blogRoutes = require('./routes/blogs');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const bagRoutes = require('./routes/bag');
const adminRoutes = require('./routes/admin');

// Import models
const Product = require('./models/Product');
const Blog = require('./models/Blog');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware (configured via backend/middleware/cors.js)
const corsMiddleware = require('./middleware/cors');
app.use(corsMiddleware);

// Trust proxy - CRITICAL for production (Hostinger uses reverse proxy)
// Without this, Express can't detect HTTPS and secure cookies will fail
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'endless-charms-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  name: 'connect.sid', // Keep default name
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true, // Prevents JavaScript access
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: process.env.COOKIE_SAMESITE || 'lax', // 'lax' for same-domain (most secure)
    domain: process.env.COOKIE_DOMAIN || undefined, // Leave empty for same domain
    path: '/' // Ensure cookie works for all paths
  },
  proxy: process.env.NODE_ENV === 'production' // Trust reverse proxy
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Make user available to all views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Set view engine
app.set('view engine', 'ejs');

// Handle both local development and production deployment paths
const fs = require('fs');
const viewsPath = fs.existsSync(path.join(__dirname, '../frontend/views')) 
  ? path.join(__dirname, '../frontend/views')
  : path.join(__dirname, 'frontend/views');
const publicPath = fs.existsSync(path.join(__dirname, '../frontend/public'))
  ? path.join(__dirname, '../frontend/public')
  : path.join(__dirname, 'frontend/public');

app.set('views', viewsPath);

// Static files
app.use(express.static(publicPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bag', bagRoutes);
app.use('/api/admin', adminRoutes);

// Product data
const products = [
  { id: 1, name: 'Heart Cut Ring', basePrice: 32000, image: 'shop-engagement-page/heart-cut-engagement-ring.jpg', category: 'rings', inStock: true },
  { id: 2, name: 'Marquise Cut Ring', basePrice: 32000, image: 'shop-engagement-page/marquis-cut-engagement-ring.jpg', category: 'rings', inStock: true },
  { id: 3, name: 'Oval Cut Ring', basePrice: 32000, image: 'shop-engagement-page/oval-cut-engagement-ring.jpg', category: 'rings', inStock: true },
  { id: 4, name: 'Pear Cut Ring', basePrice: 32000, image: 'shop-engagement-page/pear-teardrop-engagement-ring.jpg', category: 'rings', inStock: true },
  { id: 5, name: 'Princess Cut Ring', basePrice: 62000, image: 'shop-engagement-page/princess-cut-ring-closeup.jpg', category: 'rings', inStock: true },
  { id: 6, name: 'Radiant Cut Ring', basePrice: 70000, image: 'shop-engagement-page/radiant-cut-engagement-ring.jpg', category: 'rings', inStock: true },
  { id: 7, name: 'Round Brilliant Cut Ring', basePrice: 42000, image: 'shop-engagement-page/round-brilliant-cut-engagement-ring.jpg', category: 'rings', inStock: true },
  { id: 8, name: 'Emerald Cut Ring', basePrice: 72000, image: 'shop-engagement-page/emerald-cut-ring-closeup.jpg', category: 'rings', inStock: true },
  { id: 9, name: 'Asscher Cut Ring', basePrice: 32000, image: 'shop-engagement-page/asscher-cut-engagement-ring.jpg', category: 'rings', inStock: true },
  { id: 10, name: 'Cushion Cut Ring', basePrice: 32000, image: 'shop-engagement-page/cushion-cut-engagement-ring.jpg', category: 'rings', inStock: true },
  { id: 11, name: 'Plain Wedding Bands', basePrice: 42000, image: 'shop-wedding-page/plain-gold-wedding-bands.jpg', category: 'bands', inStock: true },
  { id: 12, name: 'Stud Earrings', basePrice: 149000, image: 'shop-other-accessories-page/diamond-stud-earrings.jpg', category: 'earrings', inStock: true },
  { id: 13, name: '.30 ct Tennis Necklace', basePrice: 195000, image: 'shop-other-accessories-page/diamond-tennis-necklace.jpg', category: 'necklaces', inStock: true },
  { id: 14, name: '.30 ct Tennis Bracelet', basePrice: 149000, image: 'shop-other-accessories-page/diamond-tennis-bracelet.jpg', category: 'bracelets', inStock: true }
];

const ringStyles = [
  { name: 'Heart Cut', image: 'shop-engagement-page/heart-cut-engagement-ring.jpg', label: 'HEART CUT SOLITAIRE' },
  { name: 'Pear Cut', image: 'shop-engagement-page/pear-teardrop-engagement-ring.jpg', label: 'PEAR CUT SOLITAIRE' },
  { name: 'Round Brilliant Cut', image: 'shop-engagement-page/round-brilliant-cut-engagement-ring.jpg', label: 'ROUND BRILLIANT CUT SOLITAIRE' },
  { name: 'Emerald Cut', image: 'shop-engagement-page/emerald-cut-ring-closeup.jpg', label: 'EMERALD CUT SOLITAIRE' }
];

const features = [
  { icon: 'home-page/why-choose-endless-charms-section/premium-craftsmanship-icon.png', title: 'Premium Craftsmanship', description: '' },
  { icon: 'home-page/why-choose-endless-charms-section/certified-stones-icon.png', title: 'Certified Metals & Stones', description: '' },
  { icon: 'home-page/why-choose-endless-charms-section/custom-design-icon.png', title: 'Custom Design Options', description: '' },
  { icon: 'home-page/why-choose-endless-charms-section/transparent-pricing-icon.png', title: 'Trustworthy & Transparent Pricing', description: '' },
  { icon: 'home-page/why-choose-endless-charms-section/secure-transactions-icon.png', title: 'Secure Transactions', description: '' },
  { icon: 'home-page/why-choose-endless-charms-section/local-showroom-icon.png', title: 'Local Showroom for Viewing', description: '' }
];

const reviewImages = [
  'home-page/outstanding-products-services-section/14k-gold-testimonial.jpg',
  'home-page/outstanding-products-services-section/assisst-engagement-testimonial.jpg',
  'home-page/outstanding-products-services-section/blue-ring-testimonial.jpg',
  'home-page/outstanding-products-services-section/blue-worn-testimonial.jpg',
  'home-page/outstanding-products-services-section/bouquet-ring-testimonial.jpg',
  'home-page/outstanding-products-services-section/box-certificate-testimonial.jpg',
  'home-page/outstanding-products-services-section/box-ring-testimonial.jpg',
  'home-page/outstanding-products-services-section/canada-ring-testimonial.jpg',
  'home-page/outstanding-products-services-section/edited-testimonial.jpg',
  'home-page/outstanding-products-services-section/endless-story-testimonial.jpg',
  'home-page/outstanding-products-services-section/engagement-late-picture-testimonial.jpg',
  'home-page/outstanding-products-services-section/engagement-order-testimonial.jpg',
  'home-page/outstanding-products-services-section/engagement-two-rings-testimonial.jpg',
  'home-page/outstanding-products-services-section/eternity-twisted-testimonial.jpg',
  'home-page/outstanding-products-services-section/flower-like-testimonial.jpg',
  'home-page/outstanding-products-services-section/green-gold-testimonial.jpg',
  'home-page/outstanding-products-services-section/heart-eternity-testimonial.jpg',
  'home-page/outstanding-products-services-section/italian-fiance-testimonial.jpg',
  'home-page/outstanding-products-services-section/many-ring-collection-testimonial.jpg',
  'home-page/outstanding-products-services-section/necklace-simple-testimonial.jpg',
  'home-page/outstanding-products-services-section/necklace-testimonial.jpg',
  'home-page/outstanding-products-services-section/oval-ruby-testimonial.jpg',
  'home-page/outstanding-products-services-section/package-box-testimonial.jpg',
  'home-page/outstanding-products-services-section/personal-delivery-testimonial.jpg',
  'home-page/outstanding-products-services-section/possible-return-customer-testimonial.jpg',
  'home-page/outstanding-products-services-section/pretty-custom-testimonial.jpg',
  'home-page/outstanding-products-services-section/pretty-engagement-testimonial.jpg',
  'home-page/outstanding-products-services-section/ring-image-testimonial.jpg',
  'home-page/outstanding-products-services-section/ring-necklace-testimonial.jpg',
  'home-page/outstanding-products-services-section/ruby-ring-box-testimonial.jpg',
  'home-page/outstanding-products-services-section/two-sets-testimonial.jpg',
  'home-page/outstanding-products-services-section/wedding-update-testimonial.jpg',
  'home-page/outstanding-products-services-section/worn-pretty-testimonial.jpg'
];

// Engagement Rings data
const engagementRingStyles = [
  { id: 1, name: '1ct Round-Cut Solitaire Ring', basePrice: 32000, image: 'shop-engagement-page/round-brilliant-cut-engagement-ring.jpg', category: 'rings', label: '1ct Round-Cut Solitaire Ring', src: '/1ct-round-cut-solitaire-ring' },
  { id: 2, name: '1ct Princess-Cut Solitaire Ring', basePrice: 32000, image: 'shop-engagement-page/princess-cut-ring-closeup.jpg', category: 'rings', label: '1ct Princess-Cut Solitaire Ring', src: '/1ct-princess-cut-solitaire-ring' },
  { id: 3, name: '1ct Cushion-Cut Solitaire Ring', basePrice: 32000, image: 'shop-engagement-page/cushion-cut-engagement-ring.jpg', category: 'rings', label: '1ct Cushion-Cut Solitaire Ring', src: '/1ct-cushion-cut-solitaire-ring' },
  { id: 4, name: '1ct Radiant-Cut Solitaire Ring', basePrice: 32000, image: 'shop-engagement-page/radiant-cut-engagement-ring.jpg', category: 'rings', label: '1ct Radiant-Cut Solitaire Ring', src: '/1ct-radiant-cut-solitaire-ring' },
  { id: 5, name: '1ct Oval-Cut Solitaire Ring', basePrice: 32000, image: 'shop-engagement-page/oval-cut-engagement-ring.jpg', category: 'rings', label: '1ct Oval-Cut Solitaire Ring', src: '/1ct-oval-cut-solitaire-ring' },
  { id: 6, name: '1ct Emerald-Cut Solitaire Ring', basePrice: 32000, image: 'shop-engagement-page/emerald-cut-ring-closeup.jpg', category: 'rings', label: '1ct Emerald-Cut Solitaire Ring', src: '/1ct-emerald-cut-solitaire-ring' },
  { id: 7, name: '1ct Heart-Cut Solitaire Ring', basePrice: 32000, image: 'shop-engagement-page/heart-cut-engagement-ring.jpg', category: 'rings', label: '1ct Heart-Cut Solitaire Ring', src: '/1ct-heart-cut-solitaire-ring' },
  { id: 8, name: '1ct Pear-Cut Solitaire Ring', basePrice: 32000, image: 'shop-engagement-page/pear-teardrop-engagement-ring.jpg', category: 'rings', label: '1ct Pear-Cut Solitaire Ring', src: '/1ct-pear-cut-solitaire-ring' },
  { id: 9, name: '1ct Asscher-Cut Solitaire Ring', basePrice: 32000, image: 'shop-engagement-page/asscher-cut-engagement-ring.jpg', category: 'rings', label: '1ct Asscher-Cut Solitaire Ring', src: '/1ct-asscher-cut-solitaire-ring' },
  { id: 10, name: '1ct Marquise-Cut Solitaire Ring', basePrice: 32000, image: 'shop-engagement-page/marquis-cut-engagement-ring.jpg', category: 'rings', label: '1ct Marquise-Cut Solitaire Ring', src: '/1ct-marquise-cut-solitaire-ring' }
];

// Wedding Bands data
const weddingBandsStyles = [
  {
    name: 'Plain Bands',
    image: 'shop-wedding-page/plain-gold-wedding-bands.jpg',
    label: 'Plain Bands',
    src: '/wedding-band-plain',
    basePrice: 50000,
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
    image: 'shop-wedding-page/sparkling-diamond-ring-with-classic-metal-wedding-bands.jpg',
    label: 'Half Eternity 0.30ct',
    src: '/wedding-band-030ct',
    basePrice: 75000,
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
    image: 'shop-wedding-page/stacked-gold-rings-clear-wedding-bands.jpg',
    label: 'Half Eternity 0.01ct - Set A',
    src: '/wedding-band-001ct-a',
    basePrice: 65000,
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
    image: 'shop-wedding-page/thin-eternity-and-plain-band-wedding-bands.jpg',
    label: 'Half Eternity 0.01ct - Set B',
    src: '/wedding-band-001ct-b',
    basePrice: 55000,
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
    image: 'shop-wedding-page/gold-diamond-v-wedding-bands.jpg',
    label: 'Half Eternity 0.01ct - Set C',
    src: '/wedding-band-001ct-c',
    basePrice: 69000,
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
    image: 'shop-wedding-page/matching-silver-rings-small-diamonds-wedding-bands.jpeg',
    label: 'Half Eternity 0.01ct - Set D',
    src: '/wedding-band-001ct-d',
    basePrice: 69000,
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
  }
];

// Routes
app.get('/', async (req, res) => {
  try {
    // Fetch products from database
    const products = await Product.find({ inStock: true }).limit(11);
    
    res.render('index', {
      products,
      ringStyles,
      features,
      reviewImages,
      showAll: false
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.render('index', {
      products: [],
      ringStyles,
      features,
      reviewImages,
      showAll: false
    });
  }
});

app.get('/home', (req, res) => {
  res.redirect('/');
});

app.get('/engagement-rings', async (req, res) => {
  try {
    // Fetch engagement rings from database
    const rings = await Product.find({ 
      category: 'rings', 
      subcategory: 'engagement',
      inStock: true 
    });

    // If the DB set is incomplete, fall back to the full curated list so all cards and images render
    const data = rings.length >= engagementRingStyles.length ? rings : engagementRingStyles;

    res.render('engagement-rings', {
      ringStyles: data
    });
  } catch (error) {
    console.error('Error fetching engagement rings:', error);
    res.render('engagement-rings', {
      ringStyles: engagementRingStyles
    });
  }
});

app.get('/wedding-bands', async (req, res) => {
  try {
    // Fetch wedding bands from database
    const bands = await Product.find({ 
      category: 'bands',
      subcategory: 'wedding-bands',
      inStock: true 
    });
    
    res.render('wedding-bands', {
      bandStyles: bands.length > 0 ? bands : weddingBandsStyles
    });
  } catch (error) {
    console.error('Error fetching wedding bands:', error);
    res.render('wedding-bands', {
      bandStyles: weddingBandsStyles
    });
  }
});

// Accessories combined page
app.get('/accessories', async (req, res) => {
  try {
    // Fetch accessories from database
    const accessories = await Product.find({ 
      category: { $in: ['necklaces', 'bracelets', 'earrings'] },
      inStock: true 
    });
    
    res.render('accessories', { 
      accessories: accessories.length > 0 
        ? accessories 
        : products.filter(p => ['necklaces', 'bracelets', 'earrings'].includes(p.category))
    });
  } catch (error) {
    console.error('Error fetching accessories:', error);
    const accessories = products.filter(p => ['necklaces', 'bracelets', 'earrings'].includes(p.category));
    res.render('accessories', { accessories });
  }
});

app.get('/necklaces', (req, res) => {
  res.redirect('/accessories');
});

app.get('/bracelets', (req, res) => {
  res.redirect('/accessories');
});

app.get('/earrings', (req, res) => {
  res.redirect('/accessories');
});

app.get('/contact', (req, res) => {
  res.render('contact');
});

// Contact form submission
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please fill in all required fields.' 
      });
    }
    
    // Import email service
    const { sendContactFormEmail } = require('./utils/emailService');
    
    // Send email
    await sendContactFormEmail(name, email, phone || 'Not provided', message);
    
    res.json({ 
      success: true, 
      message: 'Thank you for contacting us! We will get back to you soon.' 
    });
    
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message. Please try again later.' 
    });
  }
});

app.get('/about', (req, res) => {
  res.render('about');
});

// Blogs page
app.get('/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find({ published: true })
      .sort({ publishedAt: -1 })
      .limit(6); // Show only 6 recent blogs on main page
    res.render('blogs', { blogs });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.render('blogs', { blogs: [] });
  }
});

// All blogs page
app.get('/blogs/all/view', async (req, res) => {
  try {
    const blogs = await Blog.find({ published: true })
      .sort({ publishedAt: -1 });
    res.render('all-blogs', { blogs });
  } catch (error) {
    console.error('Error fetching all blogs:', error);
    res.render('all-blogs', { blogs: [] });
  }
});

// Blog detail page
app.get('/blogs/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, published: true });
    if (!blog) {
      return res.status(404).send('Blog not found');
    }
    res.render('blog-detail', { blog });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).send('Server error');
  }
});

// Profile page
app.get('/profile', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  
  // Fetch fresh user data from database to ensure verification status is current
  try {
    const User = require('./models/User');
    const freshUser = await User.findById(req.user._id);
    if (!freshUser) {
      return res.redirect('/login');
    }
    res.render('profile', { user: freshUser });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.render('profile', { user: req.user });
  }
});

app.get('/bag', (req, res) => {
  // Start with an empty bag for clarity; client will populate from localStorage or DB
  const bagItems = [];
  const subtotal = 0;
  res.render('bag', { bagItems, subtotal });
});

app.get('/checkout', (req, res) => {
  res.render('checkout');
});

app.get('/order-confirmation', (req, res) => {
  res.render('order-confirmation');
});

app.get('/signup', (req, res) => {
  // Mock user data to render on the profile page
  const user = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Endless Charm St, Jewel City',
    avatar: '/images/profile icon.png'
  };  

  res.render('signup', { user });
});

app.get('/login', (req, res) => {
  res.render('login');
});

// Email verification page
app.get('/verify-email', (req, res) => {
  res.render('verify-email');
});

// Password reset page
app.get('/reset-password', (req, res) => {
  res.render('reset-password');
});

// Admin page - requires authentication
app.get('/admin', (req, res) => {
  // Check if user is authenticated and is admin
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).send('Access denied. Admin privileges required.');
  }
  
  res.render('admin', { user: req.user });
});

app.get('/complete-profile', (req, res) => {
  // Check if user is authenticated
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  
  // Check if user actually needs to complete profile
  if (!req.session.needsProfileCompletion) {
    return res.redirect('/');
  }
  
  res.render('complete-profile');
});

// Keep old route for backwards compatibility
app.get('/signin', (req, res) => {
  res.redirect('/login');
});

// Error handling middleware - must be after all routes
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).render('404', { url: req.originalUrl });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
