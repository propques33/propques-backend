/**
 * routes/admin.js
 */

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

const JWT_SECRET = process.env.JWT_SECRET;

// Inline middleware to verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Admin signup (for demonstration, storing plain-text password is not recommended)
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Creates a user with role "admin"
    const adminUser = new User({
      name,
      email,
      password, // Plain-text storage => not secure
      role: "admin",
    });

    await adminUser.save();

    res.status(201).json({
      message: "Admin account created successfully",
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error("Admin Signup Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Admin login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find the admin user by email
    const adminUser = await User.findOne({ email, role: "admin" });
    if (!adminUser) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Compare passwords (no hashing in this demo)
    if (password !== adminUser.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: adminUser._id, role: adminUser.role },
      JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

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

// Approve or reject a pending user
router.post("/approve/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "pending") {
      return res
        .status(400)
        .json({ message: "User already approved or rejected" });
    }

    const { approved } = req.body;
    user.role = approved ? "author" : "rejected";
    await user.save();

    res.json(user);
  } catch (error) {
    console.error("Approve Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all pending users
router.get("/pending", verifyToken, async (req, res) => {
  try {
    const pendingUsers = await User.find({ role: "pending" });
    res.json(pendingUsers);
  } catch (error) {
    console.error("Pending Users Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
