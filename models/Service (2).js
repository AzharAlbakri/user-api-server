// // models/Service.js

// const mongoose = require('mongoose');

// const serviceSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   slug: { type: String, required: true, unique: true },
//   subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: true },
//   // // content: [{
//   // //   type: { type: String, required: true }, // مثل 'paragraph', 'image', 'video'...
//   // //   data: { type: mongoose.Schema.Types.Mixed, required: true }, // يمكن أن يحتوي على نصوص، صور، فيديوهات، أعمدة...
//   // // }]
//   content: { type: String, required: true } // يجب أن يكون String لحفظ HTML
// }, { timestamps: true });

// module.exports = mongoose.model('Service', serviceSchema);


// models/Service.js

const mongoose = require('mongoose');

// تعريف المودل للفئة الفرعية
const subCategorySchema = new mongoose.Schema({
  subcategoryId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  // content: {
  //   paragraphs: [
  //     {
  //       title: { type: String, required: true },
  //       text: { type: String, required: true },
  //       images: [{ type: String }],
  //       videos: [{ type: String }],
  //       links: [
  //         {
  //           text: { type: String, required: true },
  //           url: { type: String, required: true }
  //         }
  //       ]
  //     }
  //   ]
  // }
  content: { type: String, required: true } // يجب أن يكون String لحفظ HTML
}, { _id: false });

// تعريف المودل للفئة
const categorySchema = new mongoose.Schema({
  categoryId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  subcategories: [subCategorySchema]
}, { _id: false });

// تعريف المودل للخدمة
const serviceSchema = new mongoose.Schema({
  serviceId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  categories: [categorySchema]
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);