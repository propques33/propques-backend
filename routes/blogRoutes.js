const express = require('express');
const Blog = require('../models/Blog');
const router = express.Router();
const authorizeAuthor = require('../middleware/authorizeAuthor');
const  verifyToken  = require("./userRoutes");
const multer = require("multer");
const cloudinary = require("../config/cloudinaryConfig.js");


const storage = multer.memoryStorage();
const upload = multer({ storage });



router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader
      .upload_stream(
        { folder: "blog_images" }, // Stores inside 'blog_images' folder in Cloudinary
        (error, result) => {
          if (error) {
            return res.status(500).json({ error: "Cloudinary upload failed" });
          }
          res.json({ url: result.secure_url });
        }
      )
      .end(req.file.buffer);
  } catch (error) {
    console.error("Image Upload Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Create Blog
router.post('/',  async (req, res) => {
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
      visibility: visibility || 'true', // Default to public if not specified
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

// // Get a Specific Blog by ID
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate(
      "authors",
      "name email"
    );

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle Visibility
router.patch("/:id/visibility", async (req, res) => {
  try {
    let { visibility } = req.body;

    // Convert visibility to a boolean (if it comes as a string)
    if (typeof visibility === "string") {
      visibility = visibility === "true"; // Converts "true" to true and "false" to false
    }

    // Validate visibility input
    if (typeof visibility !== "boolean") {
      return res
        .status(400)
        .json({ message: "Invalid visibility value. Use true or false." });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    blog.visibility = visibility;
    await blog.save();

    res.json({ message: "Visibility updated successfully", blog });
  } catch (error) {
    console.error("Error updating visibility:", error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;



// const express = require("express");
// const Blog = require("../models/Blog");
// const router = express.Router();

// // Create Blog
// router.post("/", async (req, res) => {
//   try {
//     const {
//       title,
//       coverImage,
//       description,
//       authorId,
//       socialMedia,
//       visibility,
//     } = req.body;

//     // Validate required fields
//     if (!title || !description || !authorId) {
//       return res
//         .status(400)
//         .json({ message: "Title, description, and authorId are required" });
//     }

//     // Calculate reading time
//     const wordCount = description.trim().split(/\s+/).length;
//     const readingTime = Math.ceil(wordCount / 200);

//     // Create the blog
//     const blog = new Blog({
//       title,
//       coverImage,
//       description,
//       authors: [authorId],
//       socialMedia,
//       visibility: visibility || true,
//       readingTime: `${readingTime} min`,
//     });

//     await blog.save();
//     res.status(201).json(blog);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get All Blogs with Pagination and Filters
// router.get("/", async (req, res) => {
//   try {
//     const { page = 1, limit = 10, authorId } = req.query;

//     const filter = authorId ? { authors: authorId } : {};
//     const blogs = await Blog.find(filter)
//       .populate("authors", "name email") // Populate author details
//       .skip((page - 1) * limit)
//       .limit(parseInt(limit))
//       .exec();

//     const total = await Blog.countDocuments(filter);

//     res.json({
//       blogs,
//       total,
//       page: parseInt(page),
//       pages: Math.ceil(total / limit),
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get a Specific Blog by ID
// router.get("/:id", async (req, res) => {
//   try {
//     const blog = await Blog.findById(req.params.id).populate(
//       "authors",
//       "name email"
//     );

//     if (!blog) {
//       return res.status(404).json({ message: "Blog not found" });
//     }

//     res.json(blog);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Toggle Visibility
// router.patch("/:id/visibility", async (req, res) => {
//   try {
//     let { visibility } = req.body;

//     // Convert visibility to a boolean
//     if (typeof visibility === "string") {
//       visibility = visibility === "true";
//     }

//     if (typeof visibility !== "boolean") {
//       return res
//         .status(400)
//         .json({ message: "Invalid visibility value. Use true or false." });
//     }

//     const blog = await Blog.findById(req.params.id);
//     if (!blog) return res.status(404).json({ message: "Blog not found" });

//     blog.visibility = visibility;
//     await blog.save();

//     res.json({ message: "Visibility updated successfully", blog });
//   } catch (error) {
//     console.error("Error updating visibility:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

// module.exports = router;
