require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected");

    // Create admin user
    const adminUser = {
      name: "Admin User",
      email: "admin@example.com",
      password: await bcrypt.hash("AdminPassword123", 10), // Use a strong password
      role: "admin",
    };

    const existingAdmin = await User.findOne({ email: adminUser.email });
    if (!existingAdmin) {
      const newAdmin = new User(adminUser);
      await newAdmin.save();
      console.log("Admin user created successfully:", newAdmin);
      
    } else {
      console.log("Admin user already exists:", existingAdmin);
    }

    mongoose.disconnect();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
