const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Blog = require('../models/Blog');
const { isAdmin } = require('../middleware/adminAuth');

const MAX_TOTAL_IMAGE_BYTES = 8 * 1024 * 1024;

// Configure multer for in-memory image uploads so images can be persisted in MongoDB.
const storage = multer.memoryStorage();

function sanitizeFilename(name) {
  return String(name || '').replace(/[^a-zA-Z0-9.-]/g, '_');
}

function toDataUrl(file) {
  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

function replaceContentImagePaths(content, contentImages) {
  if (!content || !Array.isArray(contentImages) || contentImages.length === 0) {
    return content;
  }

  let processed = content;
  contentImages.forEach((file) => {
    const placeholderPath = `/images/blog-page/${sanitizeFilename(file.originalname)}`;
    processed = processed.split(placeholderPath).join(toDataUrl(file));
  });

  return processed;
}

function getTotalUploadedImageBytes(files) {
  const imageBytes = (files?.image || []).reduce((total, file) => total + (file.size || 0), 0);
  const contentBytes = (files?.contentImages || []).reduce((total, file) => total + (file.size || 0), 0);
  return imageBytes + contentBytes;
}

function isDatabaseStoredImage(imageValue) {
  return typeof imageValue === 'string' && imageValue.startsWith('data:image/');
}

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

    const totalImageBytes = getTotalUploadedImageBytes(req.files);
    if (totalImageBytes > MAX_TOTAL_IMAGE_BYTES) {
      return res.status(400).json({
        message: 'Total uploaded image size is too large. Please keep combined images under 8MB.'
      });
    }
    
    // Validate required fields
    if (!title || !excerpt || !content) {
      return res.status(400).json({ message: 'Title, excerpt, and content are required' });
    }
    
    // Check if cover image was uploaded
    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: 'Blog cover image is required' });
    }

    const coverImageDataUrl = toDataUrl(req.files.image[0]);
    const contentWithEmbeddedImages = replaceContentImagePaths(content, req.files.contentImages || []);
    
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
      image: coverImageDataUrl,
      excerpt,
      content: contentWithEmbeddedImages,
      author: author || 'Endless Charms',
      tags: tagsArray,
      published: scheduledPublishDate ? (scheduleDate <= new Date()) : isPublished,
      publishedAt,
      scheduledPublishDate: scheduledPublishDate ? scheduleDate : null
    };
    
    const blog = new Blog(blogData);
    const newBlog = await blog.save();
    
    console.log('Blog created successfully');
    console.log('Cover image storage:', 'database (data URL)');
    if (req.files && req.files.contentImages) {
      console.log('Embedded content images count:', req.files.contentImages.length);
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Blog created successfully',
      blog: newBlog 
    });
  } catch (error) {
    console.error('Error creating blog:', error);
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

    const totalImageBytes = getTotalUploadedImageBytes(req.files);
    if (totalImageBytes > MAX_TOTAL_IMAGE_BYTES) {
      return res.status(400).json({
        message: 'Total uploaded image size is too large. Please keep combined images under 8MB.'
      });
    }
    
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    // Update fields
    if (title) {
      blog.title = title;
      blog.slug = generateSlug(title);
    }
    if (excerpt) blog.excerpt = excerpt;
    if (content) {
      blog.content = replaceContentImagePaths(content, req.files?.contentImages || []);
    }
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
      // Delete legacy file-based image if it exists on disk.
      if (blog.image && !isDatabaseStoredImage(blog.image)) {
        const oldImagePath = path.join(__dirname, '../frontend/public', blog.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      blog.image = toDataUrl(req.files.image[0]);
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
    
    // Delete associated legacy image file (for older blogs that still use file paths).
    if (blog.image && !isDatabaseStoredImage(blog.image)) {
      const imagePath = path.join(__dirname, '../frontend/public', blog.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
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
      if (isDatabaseStoredImage(blog.image)) {
        return false;
      }

      const imagePath = path.join(uploadPath, String(blog.image || '').replace(/^\//, ''));
      const exists = fs.existsSync(imagePath);
      return !exists;
    }).map(blog => ({
      id: blog._id,
      title: blog.title,
      slug: blog.slug,
      imageUrl: blog.image,
      fullPath: path.join(uploadPath, String(blog.image || '').replace(/^\//, '')),
      storageType: isDatabaseStoredImage(blog.image) ? 'database' : 'filesystem',
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
      if (isDatabaseStoredImage(blog.image)) {
        return false;
      }

      const imagePath = path.join(uploadPath, String(blog.image || '').replace(/^\//, ''));
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
