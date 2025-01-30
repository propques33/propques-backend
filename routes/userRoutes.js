const express = require("express");
const User = require("../models/User.js");
const router = express.Router();
const jwt = require("jsonwebtoken");
const validateToken = require("../middleware/validateToken.js");

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify tokens
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Route to create a user (Admin or Author)
router.post("/", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    // Store the password as plain text (NO HASHING)
    const user = new User({
      name,
      email,
      password, // Storing password as plain text (insecure)
      role: role || "pending",
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for user signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Store the password as plain text (NO HASHING)
    const user = new User({
      name,
      email,
      password, // Storing password as plain text (insecure)
      role: "pending",
    });

    await user.save();

    res.status(201).json({
      message: "Signup successful, pending approval",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Route for user login (No encryption)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if all fields are provided
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user role is still pending or rejected
    if (user.role === "pending") {
      return res
        .status(403)
        .json({ message: "Your account is pending approval" });
    }

    if (user.role === "rejected") {
      return res
        .status(403)
        .json({ message: "Your account has been rejected" });
    }

    // Directly compare the passwords without hashing
    if (password !== user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate a JWT token for the user
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Route to validate token
// router.get("/validate", async (req, res) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token) {
//     return res
//       .status(401)
//       .json({ success: false, message: "Token is missing" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
//     const user = await User.findById(decoded.id).select("-password"); // Fetch user without password

//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     res.json({ success: true, message: "Token is valid", data: user });
//   } catch (error) {
//     if (error.name === "TokenExpiredError") {
//       return res
//         .status(401)
//         .json({ success: false, message: "Token has expired" });
//     }

//     console.error("Token validation error:", error);
//     res.status(401).json({ success: false, message: "Invalid token" });
//   }
// });



// Route to approve or reject authors


module.exports = router;
  