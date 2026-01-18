const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

// GET all published blogs
router.get('/', async (req, res) => {
  try {
    // First, auto-publish any scheduled blogs whose time has arrived
    await Blog.updateMany(
      { 
        scheduledPublishDate: { $lte: new Date() },
        published: false
      },
      { 
        $set: { 
          published: true,
          publishedAt: '$scheduledPublishDate'
        }
      }
    );
    
    const blogs = await Blog.find({ published: true })
      .sort({ publishedAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single blog by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, published: true });
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single blog by ID
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new blog
router.post('/', async (req, res) => {
  try {
    const blog = new Blog(req.body);
    const newBlog = await blog.save();
    res.status(201).json(newBlog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update blog
router.put('/:id', async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT publish/unpublish blog
router.put('/:id/publish', async (req, res) => {
  try {
    const { published } = req.body;
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    blog.published = published;
    if (published && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }
    
    await blog.save();
    res.json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE blog
router.delete('/:id', async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
