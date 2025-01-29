const mongoose = require('mongoose');
const slugify = require('slugify'); // Install slugify: npm install slugify

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  coverImage: { type: String, required: true },
  description: { type: String, required: true },
  authors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  socialMedia: { type: Map, of: String },
  slug: { type: String, unique: true, sparse: true }, // Ensure uniqueness
  date: { type: Date, default: Date.now },
  likeCount: { type: Number, default: 0 },
  readingTime: { type: String, required: true },
  visibility: { type: Boolean, default: true },
});

// Pre-save hook to generate a unique slug
blogSchema.pre('save', async function (next) {
  if (!this.slug) {
    const baseSlug = slugify(this.title, { lower: true, strict: true });
    let uniqueSlug = baseSlug;
    let counter = 1;

    // Ensure the slug is unique
    while (await mongoose.models.Blog.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = uniqueSlug;
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
