// Sections
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/jwt'); // Import token verification
const router = express.Router();
const SectionNew = require('../models/SectionNew'); // تأكد من أن هذا المسار صحيح
const { route } = require('./auth');

//CLIENT API
// مسار لعرض جميع الأقسام مع الفئات المترجمة
router.get('/nav/section', async (req, res) => {
    try {
        // العثور على جميع الأقسام المنشورة
        const sections = await SectionNew.find({ status: 'Published' }).select('sectionId title categories');
        
        // إذا كانت الأقسام موجودة
        if (!sections || sections.length === 0) {
            return res.status(404).json({ message: 'No sections found' });
        }

        // إرسال الأقسام إلى العميل
        res.json(sections);
    } catch (error) {
        console.error("Error fetching sections:", error);
        res.status(500).json({ message: 'Error fetching sections' });
    }
});
//


router.get('/navstatic/section', async (req, res) => {
    try {
      const staticSections = [
        { title: 'Team', page:'team', i18next:'team', categories: [] },
        { title: 'Patologías', page:'pathologies', i18next:'pathologies', categories: [] },
        { title: 'Treatments', page:'treatments', i18next:'treatments', categories: [] },
        { title: 'Medical-Legal Expertise', page:'medical-legal-expertise', i18next:'medical_legal_expertise', categories: [] },
        { title: 'Information & Advice', page:'information-advice', i18next:'information_and_advice', categories: [] },
        { title: 'Contact',page:'contact',  i18next:'contact', categories: [] }
      ];
  
      
      const sections = await SectionNew.find({ status: 'Published' }).select('sectionId title categories');
      
      staticSections.forEach(staticSection => {
        const match = sections.find(section => section.title.es.toLowerCase().includes(staticSection.title.toLowerCase()));
        if (match) {

          staticSection.sectionId = match.sectionId;
          staticSection.categories = match.categories;
        }
      });
  
      res.json(staticSections); // إرسال الأقسام مع الفئات
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error loading sections.' });
    }
  });

//DASHBOARD PUBLIC API 

// Fetch all sections
router.get('/sections', async (req, res) => {
    try {
        //const { lang } = req.query; // Get the language from query parameters
        const { lang } = "en"; // Get the language from query parameters

        const sections = await SectionNew.find(); // Fetch all sections from the database

        if (sections.length === 0) return res.status(404).json({ message: "No sections found" });

        // If no language is specified, send all data as is
        if (!lang) return res.json(sections);

        // Prepare data according to the specified language
        const localizedSectionsNew = sections.map(section => ({
            sectionId: section.sectionId,
            title: section.title[lang] || section.title['en'],
            imageUrl: section.imageUrl,
            categories: section.categories.map(category => ({
                categoryId: category.categoryId,
                title: category.title[lang] || category.title['en'],
                imageUrl: category.imageUrl,
                content: category.content[lang] || category.content['en'],
            }))
        }));

        res.json(localizedSectionsNew);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to retrieve section data
router.get('/section/:id', async (req, res) => {
    try {
        const { lang } = req.query;
        const section = await SectionNew.findOne({ sectionId: req.params.id });

        if (!section) return res.status(404).json({ message: "Section not found" });

        if (!lang) return res.json(section);

        const localizedSectionNew = {
            sectionId: section.sectionId,
            title: section.title[lang] || section.title['en'],
            imageUrl: section.imageUrl,
            categories: section.categories.map(category => ({
                categoryId: category.categoryId,
                title: category.title[lang] || category.title['en'],
                imageUrl: category.imageUrl,
                content: category.content[lang] || sub.content['en']
            }))
        };

        res.json(localizedSectionNew);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fetch categories for a specific section
router.get('/section/:sectionId/categories', async (req, res) => {
    try {
        const section = await SectionNew.findOne({ sectionId: req.params.sectionId });
        if (!section) return res.status(404).json({ error: 'Section not found' });
        res.json(section.categories);
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while fetching categories' });
    }
});

router.get('/section/:sectionId/category/:categoryId', async (req, res) => {
    try {
        const { sectionId, categoryId } = req.params;
        
        const section = await SectionNew.findOne({ sectionId: sectionId });
        
        if (!section) return res.status(404).json({ error: 'Section not found' });

        const category = section.categories.find(cat => cat.categoryId.toString() === req.params.categoryId);

        if (!category) return res.status(404).json({ error: 'Category not found' });

        // Return subcategories
        res.json(category);

    } catch (err) {
        res.status(500).json({ error: 'An error occurred while fetching categories' });
    }
});

//


// إضافة قسم جديد
router.post('/addSection', verifyToken, async (req, res) => {
    try {
        const { title, imageUrl, categories, status } = req.body;

        // التحقق من صحة البيانات الأساسية
        if (!title || !title.es || !Array.isArray(categories)) {
            return res.status(400).json({ message: "Missing required fields or invalid categories" });
        }

        // بناء الكائن الجديد للقسم
        const newSection = new SectionNew({
            title,
            imageUrl,
            status: status || 'Published',
            categories: categories.map(category => ({
                categoryId: new mongoose.Types.ObjectId(),
                title: category.title,
                content: category.content || {},
                imageUrl: category.imageUrl || '',
                status: category.status || 'Published'
            }))
        });

        // حفظ القسم في قاعدة البيانات
        await newSection.save();

        // إرجاع الاستجابة بنجاح
        res.status(201).json({ message: 'Section added successfully', section: newSection });

    } catch (err) {
        console.error('Error adding section:', err);
        res.status(500).json({ message: 'Error adding section', error: err.message });
    }
});


router.get('/sections', verifyToken, async (req, res) => {
    try {
        const { lang } = req.query; // Get the language from query parameters
        const sections = await SectionNew.find(); // جلب جميع الأقسام من قاعدة البيانات

        if (sections.length === 0) return res.status(404).json({ message: "No sections found" });

        // إذا لم يتم تحديد اللغة في الاستعلام، أرجع البيانات كما هي
        if (!lang) return res.json(sections);

        // تحضير البيانات بحسب اللغة المحددة
        const localizedSections = sections.map(section => ({
            sectionId: section.sectionId.toString(),  // تحويل ObjectId إلى سلسلة نصية
            title: section.title[lang] || section.title['en'],
            imageUrl: section.imageUrl,
            categories: section.categories.map(category => ({
                categoryId: category.categoryId.toString(),  // تحويل ObjectId إلى سلسلة نصية
                title: category.title[lang] || category.title['en'],
                content: category.content[lang] || category.content['en'],
                imageUrl: category.imageUrl,
            }))
        }));

        res.json(localizedSections);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




// API to retrieve section data
router.get('/section/:id', verifyToken, async (req, res) => {
    try {
        const { lang } = req.query;
        const section = await SectionNew.findOne({ sectionId: req.params.id }); // Use SectionNew model

        if (!section) return res.status(404).json({ message: "Section not found" });

        // If no language is specified, send all data as is
        if (!lang) return res.json(section);

        // Prepare localized section data
        const localizedSection = {
            sectionId: section.sectionId,
            title: section.title[lang] || section.title['en'], // Handle title localization
            imageUrl: section.imageUrl,
            categories: section.categories.map(category => ({
                categoryId: category.categoryId,
                title: category.title[lang] || category.title['en'], // Handle category title localization
                content: category.content[lang] || category.content['en'], // Handle category content localization
                imageUrl: category.imageUrl,
            }))
        };

        res.json(localizedSection);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update the status of the section or category
router.patch('/:type/:id/status', verifyToken, async (req, res) => {
    const { type, id } = req.params;
    const { status } = req.body;

    try {
        let updatedSection;
        if (type === 'section') {
            updatedSection = await SectionNew.findOneAndUpdate(
                { sectionId: id },
                { status },
                { new: true }
            );
        } else if (type === 'category') {
            updatedSection = await SectionNew.findOneAndUpdate(
                { 'categories.categoryId': id },
                { $set: { 'categories.$.status': status } },
                { new: true }
            );
        } else {
            return res.status(400).json({ error: 'Invalid type' });
        }

        res.json(updatedSection);
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while updating the status' });
    }
});

// Delete a section
router.delete('/section/:sectionId', verifyToken, async (req, res) => {
    try {
        const section = await SectionNew.findOneAndDelete({ sectionId: req.params.sectionId }); // Use SectionNew model

        if (!section) {
            return res.status(404).json({ message: 'Section not found' });
        }

        res.json({ message: 'Section deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while deleting the section' });
    }
});

// Fetch categories for a specific section
router.get('/section/:sectionId/categories', verifyToken, async (req, res) => {
    try {
        const section = await SectionNew.findOne({ sectionId: req.params.sectionId }); // Use SectionNew model

        if (!section) return res.status(404).json({ error: 'Section not found' });

        res.json(section.categories); // Return the categories for the section
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while fetching categories' });
    }
});

// Update a section
router.put('/section/:sectionId', verifyToken, async (req, res) => {
    try {
        const { sectionId } = req.params;
        const updatedData = req.body;
        
        // Update the section using sectionId
        const section = await SectionNew.findOneAndUpdate(
            { sectionId },
            { $set: updatedData },
            { new: true }
        );

        if (!section) return res.status(404).json({ message: 'Section not found' });

        res.json(section);
    } catch (error) {
        res.status(500).json({ message: 'Error updating section', error });
    }
});

// ✅ Update category data within a section without affecting subcategories
router.put('/section/:sectionId/category/:categoryId', verifyToken, async (req, res) => {
    try {
        const { sectionId, categoryId } = req.params;
        const updatedData = req.body;

        // Update only the title and imageUrl of the category
        const section = await SectionNew.findOneAndUpdate(
            { sectionId, 'categories.categoryId': categoryId },
            {
                $set: {
                    'categories.$.title': updatedData.title,
                    'categories.$.imageUrl': updatedData.imageUrl,
                    'categories.$.content': updatedData.content,
                }
            },
            { new: true }
        );

        if (!section) return res.status(404).json({ message: 'Category not found' });

        res.json(section);
    } catch (error) {
        res.status(500).json({ message: 'Error updating category', error });
    }
});

// ** جلب كل الأقسام **
router.get("/form/sections", verifyToken, async (req, res) => {
    try {
        const sections = await SectionNew.find();
        res.json(sections);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// ** جلب الفئات داخل قسم معين **
router.get("/form/sections/:sectionId/categories", verifyToken, async (req, res) => {
    try {
        const sectionId = req.params.sectionId;
        if (!mongoose.Types.ObjectId.isValid(sectionId)) {
            return res.status(400).send("Invalid section ID format");
        }

        const section = await SectionNew.findOne({ sectionId: req.params.sectionId });
        if (!section) return res.status(404).send("Section not found");

        res.json(section.categories);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// ** إضافة قسم جديد **
router.post("/form/sections", verifyToken, async (req, res) => {
    try {
        const newSection = new SectionNew(req.body);
        await newSection.save();
        res.status(201).json(newSection);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// ** إضافة فئة جديدة داخل قسم موجود **
router.post("/form/sections/:sectionId/categories", verifyToken, async (req, res) => {
    try {
        const sectionId = req.params.sectionId;
        if (!mongoose.Types.ObjectId.isValid(sectionId)) {
            return res.status(400).send("Invalid section ID format");
        }

        const section = await SectionNew.findOne({ sectionId: req.params.sectionId });
        if (!section) return res.status(404).send("Section not found");

        section.categories.push(req.body);
        await section.save();
        res.status(201).json(section);
    } catch (err) {
        res.status(500).send(err.message);
    }
});



module.exports = router;
