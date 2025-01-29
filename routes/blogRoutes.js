const express = require('express');
const Blog = require('../models/Blog');
const router = express.Router();
const authorizeAuthor = require('../middleware/authorizeAuthor');
const  verifyToken  = require("./userRoutes");

// Create Blog
router.post('/', verifyToken, authorizeAuthor, async (req, res) => {
  try {
    const { title, coverImage, description, authorId, socialMedia, visibility } = req.body;

    // Validate required fields
    if (!title || !description || !authorId) {
      return res.status(400).json({ message: "Title, description, and authorId are required" });
    }

    // Calculate reading time
    const wordCount = description.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Create the blog
    const blog = new Blog({
      title,
      coverImage,
      description,
      authors: [authorId],
      socialMedia,
      visibility: visibility || 'public', // Default to public if not specified
      readingTime: `${readingTime} min`,
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Blogs with Pagination and Filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, authorId } = req.query;

    const filter = authorId ? { authors: authorId } : {};
    const blogs = await Blog.find(filter)
      .populate('authors', 'name email') // Populate author details
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .exec();

    const total = await Blog.countDocuments(filter);

    res.json({
      blogs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle Visibility
router.patch('/:id/visibility', verifyToken, async (req, res) => {
  try {
    const { visibility } = req.body;

    // Validate visibility input
    if (!['public', 'private'].includes(visibility)) {
      return res.status(400).json({ message: "Invalid visibility value. Use 'public' or 'private'" });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    blog.visibility = visibility;
    await blog.save();

    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
