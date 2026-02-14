const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Blog = require('../models/Blog');
const { isAdmin } = require('../middleware/adminAuth');

// Configure multer for blog image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../frontend/public/images/blog-page');
    
    console.log('Upload destination requested:', uploadPath);
    console.log('__dirname:', __dirname);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      console.log('Creating upload directory:', uploadPath);
      try {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log('Directory created successfully');
      } catch (err) {
        console.error('Failed to create directory:', err);
        return cb(err);
      }
    }
    
    // Verify directory is writable
    try {
      fs.accessSync(uploadPath, fs.constants.W_OK);
      console.log('Directory is writable');
    } catch (err) {
      console.error('Directory is not writable:', uploadPath, err);
      return cb(new Error(`Upload directory is not writable: ${uploadPath}`));
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    console.log('Generating filename for:', file.fieldname, 'Original:', file.originalname);
    
    // For cover image, add timestamp. For content images, keep original name
    if (file.fieldname === 'image') {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = 'blog-' + uniqueSuffix + path.extname(file.originalname);
      console.log('Generated cover image filename:', filename);
      cb(null, filename);
    } else if (file.fieldname === 'contentImages') {
      // Keep original filename for content images
      const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      console.log('Generated content image filename:', sanitized);
      cb(null, sanitized);
    } else {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = 'blog-' + uniqueSuffix + path.extname(file.originalname);
      console.log('Generated filename:', filename);
      cb(null, filename);
    }
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
});

// Helper function to generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET upload directory diagnostics
router.get('/upload-diagnostics', isAdmin, (req, res) => {
  const uploadPath = path.join(__dirname, '../frontend/public/images/blog-page');
  
  const diagnostics = {
    uploadPath,
    __dirname,
    exists: fs.existsSync(uploadPath),
    isDirectory: fs.existsSync(uploadPath) ? fs.statSync(uploadPath).isDirectory() : false,
    writable: false,
    readable: false,
    files: [],
    permissions: null
  };
  
  if (fs.existsSync(uploadPath)) {
    try {
      fs.accessSync(uploadPath, fs.constants.W_OK);
      diagnostics.writable = true;
    } catch (err) {
      diagnostics.writableError = err.message;
    }
    
    try {
      fs.accessSync(uploadPath, fs.constants.R_OK);
      diagnostics.readable = true;
    } catch (err) {
      diagnostics.readableError = err.message;
    }
    
    try {
      const stats = fs.statSync(uploadPath);
      diagnostics.permissions = stats.mode.toString(8);
      diagnostics.uid = stats.uid;
      diagnostics.gid = stats.gid;
    } catch (err) {
      diagnostics.statsError = err.message;
    }
    
    try {
      diagnostics.files = fs.readdirSync(uploadPath);
    } catch (err) {
      diagnostics.filesError = err.message;
    }
  }
  
  res.json(diagnostics);
});

// GET all blogs (including unpublished for admin)
router.get('/blogs', isAdmin, async (req, res) => {
  try {
    // First, auto-publish any scheduled blogs whose time has arrived
    const now = new Date();
    const scheduledBlogs = await Blog.find({
      scheduledPublishDate: { $lte: now },
      published: false
    });
    
    for (const blog of scheduledBlogs) {
      blog.published = true;
      blog.publishedAt = blog.scheduledPublishDate;
      await blog.save();
    }
    
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new blog
router.post('/blogs', isAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'contentImages', maxCount: 10 }
]), async (req, res) => {
  try {
    console.log('Received files:', req.files);
    console.log('Received body:', req.body);
    
    const { title, excerpt, content, author, tags, published } = req.body;
    
    // Validate required fields
    if (!title || !excerpt || !content) {
      // Delete uploaded files
      if (req.files && req.files.image) {
        fs.unlinkSync(req.files.image[0].path);
      }
      if (req.files && req.files.contentImages) {
        req.files.contentImages.forEach(file => fs.unlinkSync(file.path));
      }
      return res.status(400).json({ message: 'Title, excerpt, and content are required' });
    }
    
    // Check if cover image was uploaded
    if (!req.files || !req.files.image) {
      if (req.files && req.files.contentImages) {
        req.files.contentImages.forEach(file => fs.unlinkSync(file.path));
      }
      return res.status(400).json({ message: 'Blog cover image is required' });
    }
    
    // Generate slug from title
    let slug = generateSlug(title);
    
    // Check if slug already exists
    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
      slug = slug + '-' + Date.now();
    }
    
    // Convert tags from string to array if necessary
    let tagsArray = [];
    if (tags) {
      if (typeof tags === 'string') {
        tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else if (Array.isArray(tags)) {
        tagsArray = tags;
      }
    }
    
    // Handle scheduled publishing
    const { scheduledPublishDate } = req.body;
    const isPublished = published === 'true' || published === true;
    let publishedAt = null;
    let scheduleDate = null;
    
    if (scheduledPublishDate) {
      scheduleDate = new Date(scheduledPublishDate);
      // Only publish if scheduled date is in the past
      if (scheduleDate <= new Date()) {
        publishedAt = scheduleDate;
      }
    } else if (isPublished) {
      publishedAt = new Date();
    }
    
    // Create blog object
    const blogData = {
      title,
      slug,
      image: `/images/blog-page/${req.files.image[0].filename}`,
      excerpt,
      content,
      author: author || 'Endless Charms',
      tags: tagsArray,
      published: scheduledPublishDate ? (scheduleDate <= new Date()) : isPublished,
      publishedAt,
      scheduledPublishDate: scheduledPublishDate ? scheduleDate : null
    };
    
    // Verify the uploaded file actually exists
    const uploadedFilePath = req.files.image[0].path;
    console.log('Uploaded file path:', uploadedFilePath);
    console.log('File exists:', fs.existsSync(uploadedFilePath));
    if (fs.existsSync(uploadedFilePath)) {
      const stats = fs.statSync(uploadedFilePath);
      console.log('File size:', stats.size, 'bytes');
      console.log('File permissions:', stats.mode.toString(8));
    } else {
      console.error('ERROR: Uploaded file does not exist at:', uploadedFilePath);
      throw new Error('File upload failed - file not found on disk');
    }
    
    const blog = new Blog(blogData);
    const newBlog = await blog.save();
    
    console.log('Blog created successfully');
    console.log('Cover image saved as:', blogData.image);
    console.log('Database image URL:', blogData.image);
    console.log('Actual file location:', uploadedFilePath);
    if (req.files && req.files.contentImages) {
      console.log('Content images saved:', req.files.contentImages.map(f => f.filename));
      req.files.contentImages.forEach(file => {
        console.log('Content image path:', file.path, 'Exists:', fs.existsSync(file.path));
      });
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Blog created successfully',
      blog: newBlog 
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    // Delete uploaded files if blog creation fails
    if (req.files && req.files.image) {
      fs.unlinkSync(req.files.image[0].path);
    }
    if (req.files && req.files.contentImages) {
      req.files.contentImages.forEach(file => fs.unlinkSync(file.path));
    }
    res.status(400).json({ message: error.message });
  }
});

// PUT update blog
router.put('/blogs/:id', isAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'contentImages', maxCount: 10 }
]), async (req, res) => {
  try {
    const { title, excerpt, content, author, tags, published } = req.body;
    
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      // Delete uploaded files if blog not found
      if (req.files && req.files.image) {
        fs.unlinkSync(req.files.image[0].path);
      }
      if (req.files && req.files.contentImages) {
        req.files.contentImages.forEach(file => fs.unlinkSync(file.path));
      }
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    // Update fields
    if (title) {
      blog.title = title;
      blog.slug = generateSlug(title);
    }
    if (excerpt) blog.excerpt = excerpt;
    if (content) blog.content = content;
    if (author) blog.author = author;
    
    // Update tags
    if (tags) {
      if (typeof tags === 'string') {
        blog.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else if (Array.isArray(tags)) {
        blog.tags = tags;
      }
    }
    
    // Update image if new one uploaded
    if (req.files && req.files.image) {
      // Delete old image
      const oldImagePath = path.join(__dirname, '../frontend/public', blog.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      blog.image = `/images/blog-page/${req.files.image[0].filename}`;
    }
    
    // Handle scheduled publishing
    if (req.body.scheduledPublishDate) {
      const scheduleDate = new Date(req.body.scheduledPublishDate);
      blog.scheduledPublishDate = scheduleDate;
      // Only publish if scheduled date is in the past
      if (scheduleDate <= new Date()) {
        blog.published = true;
        blog.publishedAt = scheduleDate;
      } else {
        blog.published = false;
        blog.publishedAt = null;
      }
    } else if (published !== undefined) {
      const isPublished = published === 'true' || published === true;
      blog.published = isPublished;
      blog.scheduledPublishDate = null;
      if (isPublished && !blog.publishedAt) {
        blog.publishedAt = new Date();
      } else if (!isPublished) {
        blog.publishedAt = null;
      }
    }
    
    const updatedBlog = await blog.save();
    res.json({ 
      success: true, 
      message: 'Blog updated successfully',
      blog: updatedBlog 
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ message: error.message });
  }
});

// DELETE blog
router.delete('/blogs/:id', isAdmin, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    // Delete associated image
    const imagePath = path.join(__dirname, '../frontend/public', blog.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ 
      success: true, 
      message: 'Blog deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET blogs with missing images
router.get('/blogs-with-missing-images', isAdmin, async (req, res) => {
  try {
    const blogs = await Blog.find();
    const uploadPath = path.join(__dirname, '../frontend/public');
    
    const blogsWithMissingImages = blogs.filter(blog => {
      const imagePath = path.join(uploadPath, blog.image.replace(/^\//, ''));
      const exists = fs.existsSync(imagePath);
      return !exists;
    }).map(blog => ({
      id: blog._id,
      title: blog.title,
      slug: blog.slug,
      imageUrl: blog.image,
      fullPath: path.join(uploadPath, blog.image.replace(/^\//, '')),
      createdAt: blog.createdAt
    }));
    
    res.json({
      total: blogsWithMissingImages.length,
      blogs: blogsWithMissingImages
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE all blogs with missing images (cleanup utility)
router.delete('/blogs-with-missing-images', isAdmin, async (req, res) => {
  try {
    const blogs = await Blog.find();
    const uploadPath = path.join(__dirname, '../frontend/public');
    
    const blogsToDelete = blogs.filter(blog => {
      const imagePath = path.join(uploadPath, blog.image.replace(/^\//, ''));
      return !fs.existsSync(imagePath);
    });
    
    const deletePromises = blogsToDelete.map(blog => Blog.findByIdAndDelete(blog._id));
    await Promise.all(deletePromises);
    
    res.json({
      success: true,
      message: `Deleted ${blogsToDelete.length} blog(s) with missing images`,
      deletedBlogs: blogsToDelete.map(b => ({ id: b._id, title: b.title }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('Multer error:', error);
    return res.status(400).json({ message: `Upload error: ${error.message}` });
  } else if (error) {
    console.error('General error:', error);
    return res.status(400).json({ message: error.message });
  }
  next();
});

// =============================================
// ORDER MANAGEMENT ROUTES
// =============================================
const Order = require('../models/Order');
const User = require('../models/User');
const { sendOrderStatusEmail } = require('../utils/emailService');

// GET all orders for admin
router.get('/orders', isAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: error.message });
  }
});

// PUT update order status
router.put('/orders/:id/status', isAdmin, async (req, res) => {
  try {
    const { status, trackingNumber, adminNotes } = req.body;
    const orderId = req.params.id;
    
    const order = await Order.findById(orderId).populate('userId', 'firstName lastName email');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const oldStatus = order.status;
    
    // Update order fields
    order.status = status;
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    if (adminNotes) {
      order.adminNotes = adminNotes;
    }
    
    // Add to status history
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: status,
      changedAt: new Date(),
      notes: adminNotes || `Status changed from ${oldStatus} to ${status}`
    });
    
    // Update payment status if order is confirmed
    if (status === 'confirmed' && order.paymentInfo) {
      order.paymentInfo.status = 'completed';
    }
    
    await order.save();
    
    // Send email notification for certain status changes
    if (order.userId && order.userId.email) {
      const statusMessages = {
        'confirmed': 'Your payment has been verified! Your order is now being prepared.',
        'processing': 'Your order is now being prepared.',
        'shipped': `Your order has been shipped! Tracking number: ${trackingNumber || 'N/A'}. You can track your package via LBC.`,
        'delivered': 'Your order has been delivered! Thank you for shopping with us.',
        'completed': 'Your order is complete! Thank you for choosing Endless Charms. We hope you love your purchase!',
        'cancelled': 'Your order has been cancelled. If you have any questions, please contact us.'
      };
      
      if (statusMessages[status]) {
        try {
          await sendOrderStatusEmail(
            order.userId.email,
            order.userId.firstName,
            order.orderNumber,
            status,
            statusMessages[status],
            trackingNumber
          );
        } catch (emailError) {
          console.error('Failed to send order status email:', emailError);
          // Don't fail the request if email fails
        }
      }
    }
    
    res.json({ 
      message: `Order status updated to ${status}`,
      order: order 
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
