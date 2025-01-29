const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true, // Removes extra spaces
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // Ensures no duplicate emails
      lowercase: true, // Stores email in lowercase
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ], // Validates email format
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    role: {
      type: String,
      enum: ["admin", "author", "pending", "rejected"],
      default: "pending", // Default role for new users
    },
  },
  { timestamps: true }
); // Adds createdAt and updatedAt fields automatically

// Remove password hashing
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next(); // Skip if password is not modified
//   this.password = await bcrypt.hash(this.password, 10); // Hash password with bcrypt
//   next();
// });

// userSchema.methods.comparePassword = async function (candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };
 



// Export the model
module.exports = mongoose.model("User", userSchema);
