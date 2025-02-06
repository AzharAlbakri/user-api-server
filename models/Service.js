// models/Service.js

const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: true },
  // // content: [{
  // //   type: { type: String, required: true }, // مثل 'paragraph', 'image', 'video'...
  // //   data: { type: mongoose.Schema.Types.Mixed, required: true }, // يمكن أن يحتوي على نصوص، صور، فيديوهات، أعمدة...
  // // }]
  content: { type: String, required: true } // يجب أن يكون String لحفظ HTML
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);


