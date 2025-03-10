const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/jwt'); // Import token verification
const Admin = require('../models/Admin'); // Admin model
const User = require('../models/User'); // User model
const Patient = require('../models/Patient'); // Patient model
const Appointment = require('../models/Appointment'); // Appointment model
const Article = require('../models/Article'); // Article model
const Service = require('../models/Service'); // Service model

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

router.get('/getAllAppointments', verifyToken, async (req, res) => {
  try {
    const appointments = await Appointment.find().populate('patient_id', 'name');
    const formattedAppointments = appointments.map(app => ({
      _id: router._id,
      date: router.date,
      time: router.time,
      status: router.status,
      patientName: router.patient_id ? router.patient_id.name : 'N/A'
    }));
    res.json(formattedAppointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error });
  }
});

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

//Services
// To add a new service
router.post('/addService', verifyToken, async (req, res) => {
  try {
    console.log("Received Data:", req.body); // To inspect the data coming from the client

    const { title, description, imageUrl, categories } = req.body;

    // Validate the basic data
    if (!title || !description || !imageUrl || !categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ message: "Missing required fields or invalid categories" });
    }

    // Create the new service object without `serviceId` (MongoDB will generate it automatically)
    const newService = new Service({
      title,
      description,
      imageUrl,
      categories: categories.map(category => ({
        title: category.title,
        description: category.description,
        imageUrl: category.imageUrl,
        subcategories: category.subcategories.map(sub => ({
          title: sub.title,
          description: sub.description,
          imageUrl: sub.imageUrl,
          content: sub.content
        }))
      }))
    });

    // Save the service in the database
    await newService.save();

    // Return the response successfully
    res.status(201).json({ message: 'Service added successfully', service: newService });

  } catch (err) {
    console.error('Error adding service:', err);
    res.status(500).json({ message: 'Error adding service', error: err.message });
  }
});

// To fetch all services
router.get('/services', verifyToken, async (req, res) => {
  try {
    const { lang } = req.query; // Get the language from query parameters
    const services = await Service.find(); // Fetch all services from the database

    if (services.length === 0) return res.status(404).json({ message: "No services found" });

    // If no language is specified, send all data as is
    if (!lang) return res.json(services);

    // Prepare data according to the specified language
    const localizedServices = services.map(service => ({
      serviceId: service.serviceId,
      title: service.title[lang] || service.title['en'],
      description: service.description[lang] || service.description['en'],
      imageUrl: service.imageUrl,
      categories: service.categories.map(category => ({
        categoryId: category.categoryId,
        title: category.title[lang] || category.title['en'],
        description: category.description[lang] || category.description['en'],
        imageUrl: category.imageUrl,
        subcategories: category.subcategories.map(sub => ({
          subcategoryId: sub.subcategoryId,
          title: sub.title[lang] || sub.title['en'],
          description: sub.description[lang] || sub.description['en'],
          imageUrl: sub.imageUrl,
          content: sub.content[lang] || sub.content['en']
        }))
      }))
    }));

    res.json(localizedServices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API to retrieve service data
router.get('/service/:id', verifyToken, async (req, res) => {
  try {
    const { lang } = req.query;
    const service = await Service.findOne({ serviceId: req.params.id });

    if (!service) return res.status(404).json({ message: "Service not found" });

    if (!lang) return res.json(service);

    const localizedService = {
      serviceId: service.serviceId,
      title: service.title[lang] || service.title['en'],
      description: service.description[lang] || service.description['en'],
      imageUrl: service.imageUrl,
      categories: service.categories.map(category => ({
        categoryId: category.categoryId,
        title: category.title[lang] || category.title['en'],
        description: category.description[lang] || category.description['en'],
        imageUrl: category.imageUrl,
        subcategories: category.subcategories.map(sub => ({
          subcategoryId: sub.subcategoryId,
          title: sub.title[lang] || sub.title['en'],
          description: sub.description[lang] || sub.description['en'],
          imageUrl: sub.imageUrl,
          content: sub.content[lang] || sub.content['en']
        }))
      }))
    };

    res.json(localizedService);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update the status of the service, category, or subcategory
router.patch('/:type/:id/status', verifyToken, async (req, res) => {
  const { type, id } = req.params;
  const { status } = req.body;

  try {
    let updatedService;
    if (type === 'service') {
      updatedService = await Service.findOneAndUpdate(
        { serviceId: id },
        { status },
        { new: true }
      );
    } else if (type === 'category') {
      updatedService = await Service.findOneAndUpdate(
        { 'categories.categoryId': id },
        { $set: { 'categories.$.status': status } },
        { new: true }
      );
    } else if (type === 'subcategory') {
      updatedService = await Service.findOneAndUpdate(
        { 'categories.subcategories.subcategoryId': id },
        { $set: { 'categories.$[].subcategories.$[sub].status': status } },
        { arrayFilters: [{ 'sub.subcategoryId': id }], new: true }
      );
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }
    res.json(updatedService);
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while updating the status' });
  }
});

// Delete a service
router.delete('/service/:serviceId', verifyToken, async (req, res) => {
  try {
    await Service.findOneAndDelete({ serviceId: req.params.serviceId });
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while deleting the service' });
  }
});

// Delete a category for a specific service
// to do
// Delete a subcategory within a category
// to do

// Fetch categories for a specific service
router.get('/service/:serviceId/categories', verifyToken, async (req, res) => {
  try {
    const service = await Service.findOne({ serviceId: req.params.serviceId });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service.categories);
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while fetching categories' });
  }
});

// Fetch subcategories for a specific category
router.get('/service/:serviceId/category/:categoryId/subcategories', verifyToken, async (req, res) => {
  try {
    console.log("req.params.serviceId:", req.params.serviceId);

    // Find the service using ObjectId
    const service = await Service.findOne({ serviceId: new mongoose.Types.ObjectId(req.params.serviceId) });
    console.log("Service Found:", service);

    if (!service) return res.status(404).json({ error: 'Service not found' });

    // Find the category using ObjectId
    const category = service.categories.find(cat => cat.categoryId.toString() === req.params.categoryId);
    console.log("Category Found:", category);

    if (!category) return res.status(404).json({ error: 'Category not found' });

    // Return subcategories
    res.json(category.subcategories);

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: 'An error occurred while fetching subcategories' });
  }
});

// ✅ Update service data
router.put('/service/:serviceId', verifyToken, async (req, res) => {
  try {
    const { serviceId } = req.params;
    console.log("req.params", req.params);

    const updatedData = req.body;

    console.log("updatedData", updatedData);

    const service = await Service.findOneAndUpdate(
      { serviceId },
      { $set: updatedData },
      { new: true }
    );

    if (!service) return res.status(404).json({ message: 'Service not found' });

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Error updating service', error });
  }
});

// ✅ Update category data within a service
router.put('/service/:serviceId/category/:categoryId', verifyToken, async (req, res) => {
  try {
    const { serviceId, categoryId } = req.params;
    const updatedData = req.body;

    const service = await Service.findOneAndUpdate(
      { serviceId, 'categories.categoryId': categoryId },
      { $set: { 'categories.$': updatedData } },
      { new: true }
    );

    if (!service) return res.status(404).json({ message: 'Category not found' });

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Error updating category', error });
  }
});

// ✅ Update subcategory data within a category
router.put('/service/:serviceId/category/:categoryId/subcategory/:subcategoryId', verifyToken, async (req, res) => {
  try {
    const { serviceId, categoryId, subcategoryId } = req.params;
    const updatedData = req.body;

    const service = await Service.findOneAndUpdate(
      { serviceId, 'categories.categoryId': categoryId, 'categories.subcategories.subcategoryId': subcategoryId },
      { $set: { 'categories.$[cat].subcategories.$[sub]': updatedData } },
      { new: true, arrayFilters: [{ 'cat.categoryId': categoryId }, { 'sub.subcategoryId': subcategoryId }] }
    );

    if (!service) return res.status(404).json({ message: 'Subcategory not found' });

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Error updating subcategory', error });
  }
});

module.exports = router;