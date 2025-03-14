const mongoose = require('mongoose');

// **Translated texts schema**
const localizedStringSchema = new mongoose.Schema({
    ar: { type: String, required: true },
    en: { type: String, required: true },
    es: { type: String, required: true }
}, { _id: false });

// **Subcategory schema**
const subCategorySchema = new mongoose.Schema({
    subcategoryId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() }, // Auto-generated
    title: localizedStringSchema,
    description: localizedStringSchema,
    imageUrl: { type: String, required: true },
    content: localizedStringSchema,
    status: { type: String, enum: ['Published', 'Unpublished'], default: 'Published' }
}, { _id: false });

// **Main category schema**
const categorySchema = new mongoose.Schema({
    categoryId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() }, // Auto-generated
    title: localizedStringSchema,
    description: localizedStringSchema,
    imageUrl: { type: String, required: true },
    subcategories: [subCategorySchema],
    status: { type: String, enum: ['Published', 'Unpublished'], default: 'Published' }
}, { _id: false });

// **Section schema**
const sectionSchema = new mongoose.Schema({
    sectionId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() }, // Auto-generated
    title: localizedStringSchema,
    description: localizedStringSchema,
    imageUrl: { type: String, required: true },
    categories: [categorySchema],
    status: { type: String, enum: ['Published', 'Unpublished'], default: 'Published' }
}, { timestamps: true });

module.exports = mongoose.model('Section', sectionSchema);
