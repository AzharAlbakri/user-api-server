const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  images: [{ type: String }],
  videos: [{ type: String }],
  keywords: [{ type: String }],
  sources: [{ type: String }],
  author: { type: String, required: true },
  category: { type: String, required: true },
  summary: { type: String, required: true },
  tags: [{ type: String }],
  comments_enabled: { type: Boolean, default: false },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Article', articleSchema);
