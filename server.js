require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const User = require("./models/User.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
// Import Routes
const userRoutes = require('./routes/userRoutes');

const blogRoutes = require('./routes/blogRoutes.js');

const app = express();

// Middleware
app.use(bodyParser.json());
// app.use(express.json());

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080'], // Allow React frontend
  methods: 'GET,POST,PUT,DELETE,PATCH,HEAD',
  credentials: true,
}));

// Serve static files from the uploads directory
app.use(express.static(path.join(__dirname, 'uploads')));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    const fileUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
    res.status(200).json({ location: fileUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/blogs', blogRoutes);


// Route for admin signup (restricted)
// Route for admin signup (No password encryption)
app.post("/admin/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Store password as plain text (not recommended)
    const adminUser = new User({
      name,
      email,
      password, // No hashing applied
      role: "admin",
    });

    await adminUser.save();

    res.status(201).json({
      message: "Admin account created successfully",
      user: { id: adminUser._id, name: adminUser.name, email: adminUser.email, role: adminUser.role },
    });
  } catch (error) {
    console.error("Admin Signup Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});


// Route for admin login
// Route for admin login (No password encryption)
app.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find the admin user by email
    const adminUser = await User.findOne({ email, role: "admin" });
    if (!adminUser) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Directly compare the passwords without encryption
    if (password !== adminUser.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate a JWT token for the admin
    const token = jwt.sign(
      { id: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Return admin details with the token
    res.json({
      message: "Admin login successful",
      token,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});



// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
