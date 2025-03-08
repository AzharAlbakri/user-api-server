const path = require('path');
const session = require('express-session'); // For using sessions
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');

const redisClient = require("./config/redis");
const getClinicSettings = require("./middleware/clinicMiddleware");


const authRoutes = require('./routes/auth');
const passport = require('./utils/passport'); // Import passport.js file
const mongoose = require('mongoose');
require('dotenv').config();

const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const clinicRoutes = require("./routes/clinicRoutes");

// Import user, patient, and appointment models
const User = require('./models/User');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const Article = require('./models/Article');
const Admin = require('./models/Admin'); // Import the model
const { verifyToken } = require('./utils/jwt'); // Import token verification
const { authenticateToken } = require('./utils/jwt'); // Import token verification
const Service = require('./models/Service');
const Clinic = require('./models/Clinic');

const app = express();
app.use(cors()); // Enable CORS for all requests

// app.use(bodyParser.json()); 

// Set the maximum request size to 50MB (you can change it as needed)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
// Serve translation files from the 'locales' folder
app.use('/locales', express.static(path.join(__dirname, 'locales')));
const PORT = process.env.PORT || 8080;

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ Error connecting to MongoDB:", err));

// app.use(getClinicSettings);  // Use middleware to fetch clinic settings

// Link registration routes
app.use('/api/auth', authRoutes);


// For registering users via Google and Microsoft
// Configure sessions
// app.use(session({
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: true
// }));
// app.use(passport.initialize());
// app.use(passport.session());

app.use(express.json()); // To ensure the body is read
app.use(express.urlencoded({ extended: true })); // To parse data in x-www-form-urlencoded format

app.use(cookieParser()); // ✅ Add `cookie-parser`

// ✅ Use `express-session` before `passport.initialize()`
// app.use(session({
//   secret: process.env.SESSION_SECRET,  // Replace with a strong secret key
//   resave: false,
//   saveUninitialized: true,
//   cookie: { secure: false } // Ensure `secure: false` during development
// }));


app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSecretKey',
  resave: false,
  saveUninitialized: true
}));


// ✅ Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// To serve static files (CSS, JavaScript, etc.)
app.use(express.static("public"));

// Google login route settings
app.get('/api/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google callback route settings
app.get('/api/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/login'
}), (req, res) => {
  // Successful registration or login
  res.redirect('/'); // You can redirect the user to a specific page after success
});

// Microsoft login route settings
app.get('/api/auth/microsoft', passport.authenticate('microsoft', {
  scope: ['user.read', 'mail.read']
}));

// Microsoft callback route settings
app.get('/api/auth/microsoft/callback', passport.authenticate('microsoft', {
  failureRedirect: '/login'
}), (req, res) => {
  // Successful registration or login
  res.redirect('/profile'); // You can redirect the user to a specific page after success
});

// Profile page
app.get('/', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  console.log("*********", res)
  res.json({
    fullName: req.user.fullName,
    email: req.user.email,
    registrationType: req.user.registrationType,
  });
});

// API to fetch all users
app.get('/getAllUsers', async (req, res) => {
  try {
    console.log("test1");
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
app.get('/getAllPatients', async (req, res) => {
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

// API to fetch all appointments
app.get('/getAllAppointments', async (req, res) => {
  try {
    const appointments = await Appointment.find();
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'No appointments found.' });
    }
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'An error occurred while fetching appointments.' });
  }
});

// API to fetch appointments with status 'booked'
app.get('/getBookedAppointments', async (req, res) => {
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

// API to fetch available times for a specific date
app.get('/getAvailableTimes/:date', async (req, res) => {
  const { date } = req.params;

  try {
    const appointments = await Appointment.find({ date });
    const bookedTimes = appointments.filter(app => app.status === 'booked').map(app => app.time);

    const allTimes = ["05:00:00", "06:00:00", "07:00:00", "08:00:00", "09:00:00", "10:00:00", "11:00:00", "12:00:00", "13:00:00", "14:00:00", "15:00:00", "16:00:00", "17:00:00", "18:00:00", "19:00:00", "20:00:00", "21:00:00", "22:00:00"];
    const availableTimes = allTimes.filter(time => !bookedTimes.includes(time));

    res.status(200).json({ availableTimes });
  } catch (error) {
    console.error('Error fetching available times:', error);
    res.status(500).json({ error: 'An error occurred while fetching available times.' });
  }
});

app.post('/addYearAppointments', async (req, res) => {
  try {
    const year = 2025; // The desired year
    const startDate = new Date(`${year}-01-01T00:00:00Z`); // Start of the day in UTC
    const endDate = new Date(`${year}-12-31T23:59:59Z`); // End of the last day of the year

    const appointments = []; // Array to store appointments

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      for (let hour = 9; hour < 18; hour++) { // From 9 AM to 5:30 PM
        for (let minute of [0, 30]) { // Every half hour (00 and 30)
          const appointmentTime = new Date(date);
          appointmentTime.setUTCHours(hour, minute, 0, 0); // Set the hour and minute in UTC

          appointments.push({
            appointment_id: `${appointmentTime.toISOString().split('T')[0]}-${hour}:${minute === 0 ? '00' : '30'}`, // Appointment ID
            date: appointmentTime.toISOString().split('T')[0], // Appointment date
            time: appointmentTime.toISOString().split('T')[1].split('.')[0], // Appointment time (hours:minutes:seconds)
            status: 'available', // Appointment status (available)
            patient_id: null, // No patient currently
            doctor_id: 'dr123', // Default doctor ID
          });
        }
      }
    }

    // Add appointments to MongoDB in bulk
    await Appointment.insertMany(appointments);

    res.status(200).json({ message: 'Appointments for the year 2025 added successfully!' });
  } catch (error) {
    console.error('Error adding year appointments:', error);
    res.status(500).json({ error: 'An error occurred while adding year appointments' });
  }
});

// Request Consultation
app.post('/addUser', async (req, res) => {
  const { fullName, email, phone, contactMethod, consultationType, additionalInfo } = req.body;

  if (!fullName || !email || !phone || !contactMethod || !consultationType) {
    return res.status(400).json({ error: 'Please provide all required fields.' });
  }

  try {
    const user = new User({
      fullName,
      email,
      phone,
      contactMethod,
      consultationType,
      additionalInfo: additionalInfo || '',
      createdAt: new Date(),
    });

    await user.save();
    res.status(200).json({ message: 'User added successfully!', userId: user._id });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'An error occurred while adding the user' });
  }
});

// API to book an appointment
app.post('/bookAppointment', async (req, res) => {
  const { patient_name, phone_number, email, identity_number, appointment_date, appointment_time, appointment_reason, preferred_doctor, additional_notes, has_insurance, insurance_company, insurance_policy_number, agree_to_terms, reminder_method } = req.body;

  if (!patient_name || !phone_number || !email || !identity_number || !appointment_date || !appointment_time || !appointment_reason || !agree_to_terms || !reminder_method) {
    return res.status(400).json({ error: 'Please provide all required fields.' });
  }

  try {
    const appointment = await Appointment.findOne({ date: appointment_date, time: appointment_time });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found or already booked.' });
    }

    if (appointment.status === 'booked') {
      return res.status(400).json({ error: 'Appointment not available as it is already booked.' });
    }

    const patient = new Patient({
      patient_name,
      phone_number,
      email,
      identity_number,
      appointment_date,
      appointment_time,
      appointment_reason,
      preferred_doctor: preferred_doctor || 'Not specified',
      additional_notes: additional_notes || '',
      has_insurance: has_insurance || false,
      insurance_company: has_insurance ? insurance_company : null,
      insurance_policy_number: has_insurance ? insurance_policy_number : null,
      agree_to_terms,
      reminder_method,
      appointment_id: appointment._id,
      booked_at: new Date(),
    });

    await patient.save();
    appointment.status = 'booked';
    appointment.patient_id = patient._id;
    await appointment.save();

    res.status(200).json({ message: "Appointment booked successfully for " + appointment_date, appointmentId: appointment._id, patientId: patient._id });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'An error occurred while booking the appointment.' });
  }
});

// API to add a new article
app.post('/addArticle', async (req, res) => {
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
app.get('/getAllArticles', async (req, res) => {
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

// SERVICES
// Fetch all services
app.get('/services', async (req, res) => {
  try {
    //const { lang } = req.query; // Get the language from query parameters
    const { lang } = "en"; // Get the language from query parameters

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
app.get('/service/:id', async (req, res) => {
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

// Fetch categories for a specific service
app.get('/service/:serviceId/categories', async (req, res) => {
  try {
    console.log("req.params.serviceId", req.params.serviceId);
    const service = await Service.findOne({ serviceId: req.params.serviceId });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service.categories);
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while fetching categories' });
  }
});

// Fetch subcategories for a specific category
app.get('/service/:serviceId/category/:categoryId/subcategories', async (req, res) => {
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

app.get('/service/:serviceId/category/:categoryId/subcategory/:subcategoryId', async (req, res) => {
  try {
    const { serviceId, categoryId, subcategoryId } = req.params;

    // Find the service using serviceId
    const service = await Service.findOne({ serviceId });
    if (!service) return res.status(404).json({ error: 'Service not found' });

    // Find the category using categoryId
    const category = service.categories.find(cat => cat.categoryId.toString() === categoryId);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    // Find the subcategory using subcategoryId
    const subcategory = category.subcategories.find(sub => sub.subcategoryId.toString() === subcategoryId);
    if (!subcategory) return res.status(404).json({ error: 'Subcategory not found' });

    // Return subcategory data
    res.json(subcategory);
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while fetching the subcategory' });
  }
});


//#region DASHBOARD
// Add a new admin to the database
app.post('/addAdmin', async (req, res) => {
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
app.post('/adminLogin', async (req, res) => {
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
app.get('/dashboard/getAllUsers', authenticateToken, async (req, res) => {
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
app.get('/dashboard/getAllPatients', authenticateToken, async (req, res) => {
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

app.get('/dashboard/getAllAppointments', verifyToken, async (req, res) => {
  try {
    const appointments = await Appointment.find().populate('patient_id', 'name');
    const formattedAppointments = appointments.map(app => ({
      _id: app._id,
      date: app.date,
      time: app.time,
      status: app.status,
      patientName: app.patient_id ? app.patient_id.name : 'N/A'
    }));
    res.json(formattedAppointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error });
  }
});

// API to fetch appointments with status 'booked'
app.get('/dashboard/getBookedAppointments', authenticateToken, async (req, res) => {
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
app.get('/dashboard/getLockedAppointments', authenticateToken, async (req, res) => {
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
app.get('/dashboard/getAvailableAppointments', authenticateToken, async (req, res) => {
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
app.post('/dashboard/addArticle', authenticateToken, async (req, res) => {
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
app.get('/dashboard/getAllArticles', authenticateToken, async (req, res) => {
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

app.get('/dashboard/getArticle/:id', async (req, res) => {
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
app.put('/dashboard/updateArticle/:id', async (req, res) => {
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
app.put('/dashboard/updateArticleStatus/:id', async (req, res) => {
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

app.post('/dashboard/addArticle', authenticateToken, async (req, res) => {
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
app.delete('/dashboard/deleteArticle/:id', verifyToken, async (req, res) => {
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

app.put('/dashboard/updateAppointment/:id', authenticateToken, async (req, res) => {
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
app.post('/dashboard/addService', verifyToken, async (req, res) => {
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
app.get('/dashboard/services', authenticateToken, async (req, res) => {
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
app.get('/dashboard/service/:id', authenticateToken, async (req, res) => {
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
app.patch('/dashboard/:type/:id/status', verifyToken, async (req, res) => {
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
app.delete('/dashboard/service/:serviceId', verifyToken, async (req, res) => {
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
app.get('/dashboard/service/:serviceId/categories', verifyToken, async (req, res) => {
  try {
    const service = await Service.findOne({ serviceId: req.params.serviceId });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service.categories);
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while fetching categories' });
  }
});

// Fetch subcategories for a specific category
app.get('/dashboard/service/:serviceId/category/:categoryId/subcategories', verifyToken, async (req, res) => {
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
app.put('/dashboard/service/:serviceId', verifyToken, async (req, res) => {
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
app.put('/dashboard/service/:serviceId/category/:categoryId', verifyToken, async (req, res) => {
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
app.put('/dashboard/service/:serviceId/category/:categoryId/subcategory/:subcategoryId', verifyToken, async (req, res) => {
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
//#endregion







// 📌 Use the routes
app.use("/api", clinicRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at: http://localhost:${PORT}`);
});
