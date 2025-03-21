const mongoose = require('mongoose');

// **Translated texts schema**
const localizedStringSchema = new mongoose.Schema({
    ar: { type: String, required: false },
    en: { type: String, required: false },
    es: { type: String, required: true }
}, { _id: false });

// **Category schema inside Section**
const categorySchema = new mongoose.Schema({
    categoryId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() }, // Auto-generated
    title: localizedStringSchema,
    content: localizedStringSchema,
    imageUrl: { type: String, required: false },
    status: { type: String, enum: ['Published', 'Unpublished'], default: 'Published' }
}, { _id: false });

// **Section schema**
const sectionNewSchema = new mongoose.Schema({
    sectionId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() }, // Auto-generated
    title: localizedStringSchema,
    imageUrl: { type: String, required: false },
    categories: [categorySchema],
    status: { type: String, enum: ['Published', 'Unpublished'], default: 'Published' }
}, { timestamps: true });

module.exports = mongoose.model('SectionNew', sectionNewSchema);