const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/jwt'); // Import token verification
const Admin = require('../models/Admin'); // Admin model
const User = require('../models/User'); // User model
const Patient = require('../models/Patient'); // Patient model
const Appointment = require('../models/Appointment'); // Appointment model
const Article = require('../models/Article'); // Article model
const Section = require('../models/Section'); // Section model

const router = express.Router();

// Add a new admin to the database
router.post('/addAdmin', async (req, res) => {
  const { fullName, email, password, role } = req.body;

  // Validate input values
  if (!fullName || !email || !password || !role) {
    return res.status(400).json({ error: 'Please provide all required fields.' });
  }

  try {
    // Check if the email is already in use
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({ error: 'Email is already in use.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new record in the database
    const newAdmin = new Admin({
      fullName,
      email,
      password: hashedPassword,
      role,
    });

    await newAdmin.save();
    res.status(201).json({ message: 'Admin added successfully.' });
  } catch (error) {
    console.error('Error adding admin:', error);
    res.status(500).json({ error: 'An error occurred while adding the admin.' });
  }
});

// // API for admin login
router.post('/adminLogin', async (req, res) => {
  console.log("test");
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password.' });
  }

  try {
    // Find the admin in the database
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found.' });
    }

    // Verify the password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Create a token
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({ message: 'Login successful.', token, adminInfo: admin });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'An error occurred during login.' });
  }
});

// ---------------------------
// Protected APIs for the Dashboard
// ---------------------------

// API to fetch all users
router.get('/getAllUsers', verifyToken, async (req, res) => {
  try {
    const users = await User.find();
    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found.' });
    }
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'An error occurred while fetching users.' });
  }
});

// API to fetch all patients
router.get('/getAllPatients', verifyToken, async (req, res) => {
  try {
    const patients = await Patient.find();
    if (patients.length === 0) {
      return res.status(404).json({ message: 'No patients found.' });
    }
    res.status(200).json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'An error occurred while fetching patients.' });
  }
});

// router.get('/getAllAppointments', verifyToken, async (req, res) => {
//   try {
//     const appointments = await Appointment.find().populate('patient_id', 'name');
//     const formattedAppointments = appointments.map(app => ({
//       _id: router._id,
//       date: router.date,
//       time: router.time,
//       status: router.status,
//       patientName: router.patient_id ? router.patient_id.name : 'N/A'
//     }));
//     res.json(formattedAppointments);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching appointments', error });
//   }
// });

// API to fetch appointments with status 'booked'
router.get('/getBookedAppointments', verifyToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: 'booked' });
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'No booked appointments found.' });
    }
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching booked appointments:', error);
    res.status(500).json({ error: 'An error occurred while fetching booked appointments.' });
  }
});

// router.get('/getAllAppointments', verifyToken, async (req, res) => {
//   try {
//     const appointments = await Appointment.find().populate('patient_id', 'name');
//     const formattedAppointments = appointments.map(app => ({
//       _id: app._id, // استخدم app بدلاً من router
//       date: app.date, // استخدم app بدلاً من router
//       time: app.time, // استخدم app بدلاً من router
//       status: app.status, // استخدم app بدلاً من router
//       patientName: app.patient_id ? app.patient_id.name : 'N/A' // استخدم app بدلاً من router
//     }));
//     res.json(formattedAppointments);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching appointments', error });
//   }
// });



router.get('/getAllAppointments', verifyToken, async (req, res) => {
  try {
    const appointments = await Appointment.find().populate('patient_id', 'patient_name'); // Ensure patient_name is populated
    const formattedAppointments = appointments.map(app => ({
      _id: app._id,
      date: app.date,
      time: app.time,
      status: app.status,
      patientName: app.patient_id ? app.patient_id.patient_name : 'N/A' // Access the patient's name
    }));
    res.json(formattedAppointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error });
  }
});

// API to fetch appointments with status 'locked'
router.get('/getLockedAppointments', verifyToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: 'locked' });
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'No locked appointments found.' });
    }
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching locked appointments:', error);
    res.status(500).json({ error: 'An error occurred while fetching locked appointments.' });
  }
});

// API to fetch appointments with status 'available'
router.get('/getAvailableAppointments', verifyToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: 'available' });
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'No available appointments found.' });
    }
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching available appointments:', error);
    res.status(500).json({ error: 'An error occurred while fetching available appointments.' });
  }
});

// API to add a new article
router.post('/addArticle', verifyToken, async (req, res) => {
  const { title, content, images, videos, keywords, sources, author, category, summary, tags, comments_enabled, status } = req.body;

  if (!title || !content || !author || !category || !summary) {
    return res.status(400).json({ error: 'Please provide all required fields.' });
  }

  try {
    const article = new Article({
      title,
      content,
      images: images || [],
      videos: videos || [],
      keywords: keywords || [],
      sources: sources || [],
      author,
      category,
      summary,
      tags: tags || [],
      comments_enabled: comments_enabled || false,
      status: status || 'Draft',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await article.save();
    res.status(200).json({ message: 'Article added successfully!', articleId: article._id });
  } catch (error) {
    console.error('Error adding article:', error);
    res.status(500).json({ error: 'An error occurred while adding the article.' });
  }
});

// API to fetch all articles
router.get('/getAllArticles', verifyToken, async (req, res) => {
  try {
    const articles = await Article.find();
    if (articles.length === 0) {
      return res.status(404).json({ message: 'No articles found.' });
    }
    res.status(200).json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'An error occurred while fetching articles.' });
  }
});

router.get('/getArticle/:id', async (req, res) => {
  try {
    const articleId = req.params.id; // Get the ID from the URL
    const article = await Article.findById(articleId); // Find the article in the database
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.status(200).json(article); // Send the article as a response
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the article' });
  }
});

// Update an article based on ID
router.put('/updateArticle/:id', async (req, res) => {
  try {
    console.log(req.body);
    const articleId = req.params.id;
    const updatedData = req.body;

    // Ensure the article exists
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Update the article data in the database
    const updatedArticle = await Article.findByIdAndUpdate(
      articleId,
      updatedData,
      { new: true } // Return the article after updating
    );

    res.json({ message: 'Article updated successfully', article: updatedArticle });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update article status (Published / Draft)
router.put('/updateArticleStatus/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedArticle = await Article.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updatedArticle) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.json(updatedArticle);
  } catch (error) {
    res.status(500).json({ message: 'Error updating article status', error });
  }
});

router.post('/addArticle', verifyToken, async (req, res) => {
  try {
    const {
      title,
      content,
      images,
      videos,
      keywords,
      sources,
      author,
      category,
      summary,
      tags,
      comments_enabled,
      status
    } = req.body;

    // Validate required fields
    if (!title || !content || !author || !category || !summary) {
      return res.status(400).json({ error: 'Please provide all required fields.' });
    }

    // Create the new article
    const article = new Article({
      title,
      content,
      images: images || [],
      videos: videos || [],
      keywords: keywords || [],
      sources: sources || [],
      author,
      category,
      summary,
      tags: tags || [],
      comments_enabled: comments_enabled || false,
      status: status || 'Draft',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Save the article in the database
    await article.save();

    res.status(201).json({ message: 'Article added successfully!', articleId: article._id });

  } catch (error) {
    console.error('Error adding article:', error);
    res.status(500).json({ error: 'An error occurred while adding the article.' });
  }
});

// ✅ API to delete the article
router.delete('/deleteArticle/:id', verifyToken, async (req, res) => {
  try {
    const articleId = req.params.id;
    const deletedArticle = await Article.findByIdAndDelete(articleId);

    if (!deletedArticle) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    res.json({ message: 'Article deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting article.', error });
  }
});

router.put('/updateAppointment/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate the new status
    if (!["available", "booked", "locked"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Find the appointment and update its status
    const appointment = await Appointment.findByIdAndUpdate(id, { status }, { new: true });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(200).json({ message: "Appointment updated successfully", appointment });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//Sections
// To add a new section
router.post('/addSection', verifyToken, async (req, res) => {
  try {
    const { title, imageUrl, categories } = req.body;

    // Validate the basic data
    if (!title || !imageUrl || !categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ message: "Missing required fields or invalid categories" });
    }
    // Create the new section object without `sectionId` (MongoDB will generate it automatically)
    const newSection = new Section({
      title,
      // description,
      imageUrl,
      categories: categories.map(category => ({
        title: category.title,
        // description: category.description,
        imageUrl: category.imageUrl,
        subcategories: category.subcategories.map(sub => ({
          title: sub.title,
          // description: sub.description,
          imageUrl: sub.imageUrl,
          content: sub.content
        }))
      }))
    });

    // Save the section in the database
    await newSection.save();

    // Return the response successfully
    res.status(201).json({ message: 'Section added successfully', section: newSection });

  } catch (err) {
    console.error('Error adding section:', err);
    res.status(500).json({ message: 'Error adding section', error: err.message });
  }
});

// To fetch all sections
router.get('/sections', verifyToken, async (req, res) => {
  try {
    const { lang } = req.query; // Get the language from query parameters
    const sections = await Section.find(); // Fetch all sections from the database

    if (sections.length === 0) return res.status(404).json({ message: "No sections found" });

    // If no language is specified, send all data as is
    if (!lang) return res.json(sections);

    // Prepare data according to the specified language
    const localizedSections = sections.map(section => ({
      sectionId: section.sectionId,
      title: section.title[lang] || section.title['en'],
      // description: section.description[lang] || section.description['en'],
      imageUrl: section.imageUrl,
      categories: section.categories.map(category => ({
        categoryId: category.categoryId,
        title: category.title[lang] || category.title['en'],
        // description: category.description[lang] || category.description['en'],
        imageUrl: category.imageUrl,
        subcategories: category.subcategories.map(sub => ({
          subcategoryId: sub.subcategoryId,
          title: sub.title[lang] || sub.title['en'],
          // description: sub.description[lang] || sub.description['en'],
          imageUrl: sub.imageUrl,
          content: sub.content[lang] || sub.content['en']
        }))
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
    const section = await Section.findOne({ sectionId: req.params.id });

    if (!section) return res.status(404).json({ message: "Section not found" });

    if (!lang) return res.json(section);

    const localizedSection = {
      sectionId: section.sectionId,
      title: section.title[lang] || section.title['en'],
      // description: section.description[lang] || section.description['en'],
      imageUrl: section.imageUrl,
      categories: section.categories.map(category => ({
        categoryId: category.categoryId,
        title: category.title[lang] || category.title['en'],
        // description: category.description[lang] || category.description['en'],
        imageUrl: category.imageUrl,
        subcategories: category.subcategories.map(sub => ({
          subcategoryId: sub.subcategoryId,
          title: sub.title[lang] || sub.title['en'],
          // description: sub.description[lang] || sub.description['en'],
          imageUrl: sub.imageUrl,
          content: sub.content[lang] || sub.content['en']
        }))
      }))
    };

    res.json(localizedSection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update the status of the section, category, or subcategory
router.patch('/:type/:id/status', verifyToken, async (req, res) => {
  const { type, id } = req.params;
  const { status } = req.body;

  try {
    let updatedSection;
    if (type === 'section') {
      updatedSection = await Section.findOneAndUpdate(
        { sectionId: id },
        { status },
        { new: true }
      );
    } else if (type === 'category') {
      updatedSection = await Section.findOneAndUpdate(
        { 'categories.categoryId': id },
        { $set: { 'categories.$.status': status } },
        { new: true }
      );
    } else if (type === 'subcategory') {
      updatedSection = await Section.findOneAndUpdate(
        { 'categories.subcategories.subcategoryId': id },
        { $set: { 'categories.$[].subcategories.$[sub].status': status } },
        { arrayFilters: [{ 'sub.subcategoryId': id }], new: true }
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
    await Section.findOneAndDelete({ sectionId: req.params.sectionId });
    res.json({ message: 'Section deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while deleting the section' });
  }
});

// Delete a category for a specific section
// to do
// Delete a subcategory within a category
// to do

// Fetch categories for a specific section
router.get('/section/:sectionId/categories', verifyToken, async (req, res) => {
  try {
    const section = await Section.findOne({ sectionId: req.params.sectionId });
    if (!section) return res.status(404).json({ error: 'Section not found' });
    res.json(section.categories);
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while fetching categories' });
  }
});

//////////
// Fetch subcategories for a specific category
router.get('/section/:sectionId/category/:categoryId/subcategories', verifyToken, async (req, res) => {
  try {
    // console.log("req.params.sectionId:", req.params.sectionId);

    // Find the section using ObjectId
    const section = await Section.findOne({ sectionId: new mongoose.Types.ObjectId(req.params.sectionId) });
    console.log("Section Found:", section);

    if (!section) return res.status(404).json({ error: 'Section not found' });

    // Find the category using ObjectId
    const category = section.categories.find(cat => cat.categoryId.toString() === req.params.categoryId);
    console.log("Category Found:", category);

    if (!category) return res.status(404).json({ error: 'Category not found' });

    // Return subcategories
    res.json(category.subcategories);

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: 'An error occurred while fetching subcategories' });
  }
});
//////////

// ✅ Update section data
router.put('/section/:sectionId', verifyToken, async (req, res) => {
  try {
    const { sectionId } = req.params;
    console.log("req.params", req.params);

    const updatedData = req.body;

    console.log("updatedData", updatedData);

    const section = await Section.findOneAndUpdate(
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

    // فقط تحديث العنوان والصورة
    const section = await Section.findOneAndUpdate(
      { sectionId, 'categories.categoryId': categoryId },
      {
        $set: {
          'categories.$.title': updatedData.title,
          'categories.$.imageUrl': updatedData.imageUrl
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


// ✅ Update subcategory data within a category
router.put('/section/:sectionId/category/:categoryId/subcategory/:subcategoryId', verifyToken, async (req, res) => {
  try {
    const { sectionId, categoryId, subcategoryId } = req.params;
    const updatedData = req.body;

    const section = await Section.findOneAndUpdate(
      { sectionId, 'categories.categoryId': categoryId, 'categories.subcategories.subcategoryId': subcategoryId },
      { $set: { 'categories.$[cat].subcategories.$[sub]': updatedData } },
      { new: true, arrayFilters: [{ 'cat.categoryId': categoryId }, { 'sub.subcategoryId': subcategoryId }] }
    );

    if (!section) return res.status(404).json({ message: 'Subcategory not found' });

    res.json(section);
  } catch (error) {
    res.status(500).json({ message: 'Error updating subcategory', error });
  }
});

////////////////////////////////&&&&&&&&&?////////////

// ** جلب كل الأقسام**
router.get("/form/sections",verifyToken, async (req, res) => {
  console.log(1);
  try {
    const sections = await Section.find();
    res.json(sections);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// **جلب الفئات داخل قسم معين**
router.get("/form/sections/:sectionId/categories",verifyToken, async (req, res) => {
  console.log(2);
  try {
    const sectionId = req.params.sectionId;
    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      console.log("Invalid section ID format");
      return res.status(400).send("Invalid section ID format");
    }

    const section = await Section.findOne({ sectionId: req.params.sectionId });
    if (!section) return res.status(404).send("Section not found");

    res.json(section.categories);

  } catch (err) {
    res.status(500).send(err.message);
  }
});

// **تحميل الفئات الفرعية بناءً على القسم والفئة المحددين**
router.get("/form/sections/:sectionId/categories/:categoryId/subcategories", async (req, res) => {
  try {

    const sectionId = req.params.sectionId;
    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      console.log("Invalid section ID format");
      return res.status(400).send("Invalid section ID format");
    }
    const section = await Section.findOne({ sectionId: req.params.sectionId });
    if (!section) return res.status(404).send("Section not found");

    const categoryId = req.params.categoryId;
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      console.log("Invalid Category ID format");
      return res.status(400).send("Invalid section ID format");
    }
    const category = section.categories.find(category => category.categoryId.toString() === req.params.categoryId);
    if (!category) return res.status(404).send("Category not found");

    // إرجاع الفئات الفرعية الموجودة داخل الفئة
    res.status(200).json(category.subcategories);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// **إضافة قسم جديد**
router.post("/form/sections",verifyToken, async (req, res) => {
  try {
    console.log("req.body", req.body);
    const newSection = new Section(req.body);
    await newSection.save();
    res.status(201).json(newSection);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// **إضافة فئة جديدة داخل قسم موجود**
router.post("/form/sections/:sectionId/categories",verifyToken, async (req, res) => {
  try {
    const sectionId = req.params.sectionId;
    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      console.log("Invalid section ID format");
      return res.status(400).send("Invalid section ID format");
    }

    const section = await Section.findOne({ sectionId: req.params.sectionId });
    if (!section) return res.status(404).send("Section not found");

    section.categories.push(req.body);
    await section.save();
    res.status(201).json(section);
  } catch (err) {
    console.error("Error adding category:", err);
    res.status(500).send(err.message);
  }
});

// **إضافة فئة فرعية داخل فئة موجودة**
router.post("/form/sections/:sectionId/categories/:categoryId/subcategories",verifyToken, async (req, res) => {
  try {
    const sectionId = req.params.sectionId;
    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      console.log("Invalid section ID format");
      return res.status(400).send("Invalid section ID format");
    }
    const section = await Section.findOne({ sectionId: req.params.sectionId });
    if (!section) return res.status(404).send("Section not found");

    const categoryId = req.params.categoryId;
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      console.log("Invalid Category ID format");
      return res.status(400).send("Invalid section ID format");
    }
    const category = section.categories.find(category => category.categoryId.toString() === req.params.categoryId);
    if (!category) return res.status(404).send("Category not found");

    category.subcategories.push(req.body);
    await section.save();
    res.status(201).json(section);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;