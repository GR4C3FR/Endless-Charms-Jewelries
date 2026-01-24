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
    const uploadPath = path.join(__dirname, '../../frontend/public/images/blog-page');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // For cover image, add timestamp. For content images, keep original name
    if (file.fieldname === 'image') {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
    } else if (file.fieldname === 'contentImages') {
      // Keep original filename for content images
      const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, sanitized);
    } else {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
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
    
    const blog = new Blog(blogData);
    const newBlog = await blog.save();
    
    console.log('Blog created successfully');
    console.log('Cover image saved as:', blogData.image);
    if (req.files && req.files.contentImages) {
      console.log('Content images saved:', req.files.contentImages.map(f => f.filename));
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
      const oldImagePath = path.join(__dirname, '../../frontend/public', blog.image);
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
    const imagePath = path.join(__dirname, '../../frontend/public', blog.image);
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

module.exports = router;
