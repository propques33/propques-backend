const User = require('../models/User');

const authorizeAuthor = async (req, res, next) => {
  try {
    const user = await User.findById(req.body.authorId); // Get authorId from request
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role !== 'author') {
      return res.status(403).json({ message: 'Only approved authors can post blogs' });
    }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = authorizeAuthor;


