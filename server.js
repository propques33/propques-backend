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
const adminRoutes = require('./routes/adminRoutes.js');
const Pincode = require('./models/Pincode.js');

const blogRoutes = require('./routes/blogRoutes.js');
const axios= require("axios")
const app = express();

// Middleware



// Allow all origins (for development)
app.use(cors({
    origin: '*', // Allows all origins
    credentials: true, // Allow cookies & auth headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH' ], // Allowed methods
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Serve static files from the uploads directory
app.use(express.static(path.join(__dirname, 'uploads')));


// Increase body size limit
app.use(bodyParser.json({ limit: '50mb' })); // Adjust limit as needed
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

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



app.get("/api/pincode/:pincode", async (req, res) => {
  try {
    const { pincode } = req.params;
    const result = await Pincode.find({
      pincode: new RegExp(`^${pincode}`, "i"),
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error fetching data" });
  }
});

// Routes
app.use('/api/author', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blogs', blogRoutes);


// app.post("/api/salesmate", async (req, res) => {
//   try {
//     const { email } = req.body;
//     const response = await axios.post(
//       "https://propquesservices.salesmate.io/apis/contact/v4",
//       { email },
//       {
//         headers: {
//           accessToken: "e55130c0-d0b7-11ee-9435-517682d0b702",
//           secretKey: "e55130c1-d0b7-11ee-9435-517682d0b702",
//           sessionToken: "39c4c1b0-e513-11ef-a130-b9ebcf59a1ef",
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     res.json({ success: true, data: response.data });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });


app.post("/api/contact", async (req, res) => {
  try {
    const response = await axios.post(
      "https://propquesservices.salesmate.io/apis/contact/v4",
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
          "x-linkname": "propquesservices.salesmate.io",
          accessToken: "39c4c1b0-e513-11ef-a130-b9ebcf59a1ef",
          sessionToken: "39c4c1b0-e513-11ef-a130-b9ebcf59a1ef",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
    });
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
