const mongoose = require('mongoose');

// **مخطط النصوص المترجمة**
const localizedStringSchema = new mongoose.Schema({
    ar: { type: String, required: true },
    en: { type: String, required: true },
    es: { type: String, required: true }
}, { _id: false });

// **مخطط الفئة الفرعية**
const subCategorySchema = new mongoose.Schema({
    subcategoryId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() }, // توليد تلقائي
    title: localizedStringSchema,
    description: localizedStringSchema,
    imageUrl: { type: String, required: true },
    content: localizedStringSchema,
    status: { type: String, enum: ['Published', 'Unpublished'], default: 'Published' }
}, { _id: false });

// **مخطط الفئة الرئيسية**
const categorySchema = new mongoose.Schema({
    categoryId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() }, // توليد تلقائي
    title: localizedStringSchema,
    description: localizedStringSchema,
    imageUrl: { type: String, required: true },
    subcategories: [subCategorySchema],
    status: { type: String, enum: ['Published', 'Unpublished'], default: 'Published' }
}, { _id: false });

// **مخطط الخدمة**
const serviceSchema = new mongoose.Schema({
    serviceId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() }, // توليد تلقائي
    title: localizedStringSchema,
    description: localizedStringSchema,
    imageUrl: { type: String, required: true },
    categories: [categorySchema],
    status: { type: String, enum: ['Published', 'Unpublished'], default: 'Published' }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
