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

const clinicRoutes = require("./routes/clinicRoutes");
const DashboardRoutes = require("./routes/dashboardRoutes");
const SectionRoutes = require("./routes/sectionRoutes");


// Import user, patient, and appointment models
const User = require('./models/User');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const Article = require('./models/Article');
const Section = require('./models/Section');

const app = express();
app.use(cors()); // Enable CORS for all requests

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
    const year = 2025;
    const today = new Date(); // تاريخ اليوم
    today.setUTCHours(0, 0, 0, 0); // إعادة ضبط الوقت إلى بداية اليوم

    const endDate = new Date(`${year}-12-31T23:59:59Z`);

    const appointments = []; // تخزين جميع المواعيد قبل إدخالها في MongoDB

    for (let date = new Date(today); date <= endDate; date.setDate(date.getDate() + 1)) {
      for (let hour = 9; hour < 18; hour++) { // من 9 صباحًا إلى 5:30 مساءً
        for (let minute of [0, 30]) { // كل نصف ساعة
          const appointmentTime = new Date(date);
          appointmentTime.setUTCHours(hour, minute, 0, 0); // ضبط التوقيت في UTC

          // إنشاء كائن Appointment جديد
          const appointment = new Appointment({
            appointment_id: `${appointmentTime.toISOString().split('T')[0]}-${hour}:${minute === 0 ? '00' : '30'}`, 
            date: appointmentTime.toISOString().split('T')[0], 
            time: appointmentTime.toISOString().split('T')[1].split('.')[0], 
            status: 'available',
            patient_id: null,
            doctor_id: 'dr123',
          });

          appointments.push(appointment);
        }
      }
    }

    // إدخال جميع المواعيد إلى MongoDB دفعة واحدة
    await Appointment.insertMany(appointments);

    res.status(200).json({ message: `Appointments from ${today.toISOString().split('T')[0]} to 2025 added successfully!` });
  } catch (error) {
    console.error('Error adding appointments:', error);
    res.status(500).json({ error: 'An error occurred while adding appointments' });
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

// // API to book an appointment
// app.post('/bookAppointment', async (req, res) => {
//   const { patient_name, phone_number, email, identity_number, appointment_date, appointment_time, appointment_reason, preferred_doctor, additional_notes, has_insurance, insurance_company, insurance_policy_number, agree_to_terms, reminder_method } = req.body;

//   if (!patient_name || !phone_number || !email || !identity_number || !appointment_date || !appointment_time || !appointment_reason || !agree_to_terms || !reminder_method) {
//     return res.status(400).json({ error: 'Please provide all required fields.' });
//   }

//   try {
//     const appointment = await Appointment.findOne({ date: appointment_date, time: appointment_time });

//     if (!appointment) {
//       return res.status(404).json({ error: 'Appointment not found or already booked.' });
//     }

//     if (appointment.status === 'booked') {
//       return res.status(400).json({ error: 'Appointment not available as it is already booked.' });
//     }

//     const patient = new Patient({
//       patient_name,
//       phone_number,
//       email,
//       identity_number,
//       appointment_date,
//       appointment_time,
//       appointment_reason,
//       preferred_doctor: preferred_doctor || 'Not specified',
//       additional_notes: additional_notes || '',
//       has_insurance: has_insurance || false,
//       insurance_company: has_insurance ? insurance_company : null,
//       insurance_policy_number: has_insurance ? insurance_policy_number : null,
//       agree_to_terms,
//       reminder_method,
//       appointment_id: appointment._id,
//       booked_at: new Date(),
//     });

//     await patient.save();
//     appointment.status = 'booked';
//     appointment.patient_id = patient._id;
//     await appointment.save();

//     res.status(200).json({ message: "Appointment booked successfully for " + appointment_date, appointmentId: appointment._id, patientId: patient._id });
//   } catch (error) {
//     console.error('Error booking appointment:', error);
//     res.status(500).json({ error: 'An error occurred while booking the appointment.' });
//   }
// });

// app.post('/bookAppointment', async (req, res) => {
//   const { patient_name, phone_number, email, identity_number, appointment_date, appointment_time, appointment_reason, preferred_doctor, additional_notes, has_insurance, insurance_company, insurance_policy_number, agree_to_terms, reminder_method } = req.body;

//   if (!patient_name || !phone_number || !email || !identity_number || !appointment_date || !appointment_time || !appointment_reason || !agree_to_terms || !reminder_method) {
//     return res.status(400).json({ error: 'Please provide all required fields.' });
//   }

//   try {
//     const appointment = await Appointment.findOne({ date: appointment_date, time: appointment_time });

//     if (!appointment) {
//       return res.status(404).json({ error: 'Appointment not found or already booked.' });
//     }

//     if (appointment.status === 'booked') {
//       return res.status(400).json({ error: 'Appointment not available as it is already booked.' });
//     }

//     const patient = new Patient({
//       patient_name,
//       phone_number,
//       email,
//       identity_number,
//       appointment_date,
//       appointment_time,
//       appointment_reason,
//       preferred_doctor: preferred_doctor || 'Not specified',
//       additional_notes: additional_notes || '',
//       has_insurance: has_insurance || false,
//       insurance_company: has_insurance ? insurance_company : null,
//       insurance_policy_number: has_insurance ? insurance_policy_number : null,
//       agree_to_terms,
//       reminder_method,
//       appointment_id: appointment._id,
//       booked_at: new Date(),
//     });

//     await patient.save();

//     appointment.status = 'booked';
//     appointment.patient_id = patient._id;
//     await appointment.save();

//     // Populate the patient details into the response
//     const populatedAppointment = await Appointment.findById(appointment._id).populate('patient_id', 'patient_name');

//     res.status(200).json({ 
//       message: "Appointment booked successfully for " + appointment_date, 
//       appointmentId: appointment._id, 
//       patientId: patient._id, 
//       patientName: populatedAppointment.patient_id ? populatedAppointment.patient_id.patient_name : 'N/A'
//     });
//   } catch (error) {
//     console.error('Error booking appointment:', error);
//     res.status(500).json({ error: 'An error occurred while booking the appointment.' });
//   }
// });
app.post('/bookAppointment', async (req, res) => {
  const { patient_name, phone_number, email, identity_number, appointment_date, appointment_time, appointment_reason, preferred_doctor, additional_notes, has_insurance, insurance_company, insurance_policy_number, agree_to_terms, reminder_method } = req.body;

  if (!patient_name || !phone_number || !email || !appointment_date || !appointment_time || !appointment_reason || !agree_to_terms ) {
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

    await patient.save(); // Ensure the patient is saved

    // Now update the appointment with the patient's ID
    appointment.status = 'booked';
    appointment.patient_id = patient._id; // Assign the patient's ID to the appointment
    await appointment.save(); // Save the updated appointment

    // Populate the patient details into the response
    const populatedAppointment = await Appointment.findById(appointment._id).populate('patient_id', 'patient_name');

    res.status(200).json({ 
      message: "Appointment booked successfully for " + appointment_date, 
      appointmentId: appointment._id, 
      patientId: patient._id, 
      patientName: populatedAppointment.patient_id ? populatedAppointment.patient_id.patient_name : 'N/A'
    });
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
// Fetch all sections
app.get('/sections', async (req, res) => {
  try {
    //const { lang } = req.query; // Get the language from query parameters
    const { lang } = "en"; // Get the language from query parameters

    const sections = await Section.find(); // Fetch all sections from the database

    if (sections.length === 0) return res.status(404).json({ message: "No sections found" });

    // If no language is specified, send all data as is
    if (!lang) return res.json(sections);

    // Prepare data according to the specified language
    const localizedSections = sections.map(section => ({
      sectionId: section.sectionId,
      title: section.title[lang] || section.title['en'],
      description: section.description[lang] || section.description['en'],
      imageUrl: section.imageUrl,
      categories: section.categories.map(category => ({
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

    res.json(localizedSections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API to retrieve section data
app.get('/section/:id', async (req, res) => {
  try {
    const { lang } = req.query;
    const section = await Section.findOne({ sectionId: req.params.id });

    if (!section) return res.status(404).json({ message: "Section not found" });

    if (!lang) return res.json(section);

    const localizedSection = {
      sectionId: section.sectionId,
      title: section.title[lang] || section.title['en'],
      description: section.description[lang] || section.description['en'],
      imageUrl: section.imageUrl,
      categories: section.categories.map(category => ({
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

    res.json(localizedSection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch categories for a specific section
app.get('/section/:sectionId/categories', async (req, res) => {
  try {
    console.log("req.params.sectionId", req.params.sectionId);
    const section = await Section.findOne({ sectionId: req.params.sectionId });
    if (!section) return res.status(404).json({ error: 'Section not found' });
    res.json(section.categories);
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while fetching categories' });
  }
});

// Fetch subcategories for a specific category
app.get('/section/:sectionId/category/:categoryId/subcategories', async (req, res) => {
  try {
    console.log("req.params.sectionId:", req.params.sectionId);

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

app.get('/section/:sectionId/category/:categoryId/subcategory/:subcategoryId', async (req, res) => {
  try {
    const { sectionId, categoryId, subcategoryId } = req.params;

    // Find the section using sectionId
    const section = await Section.findOne({ sectionId });
    if (!section) return res.status(404).json({ error: 'Section not found' });

    // Find the category using categoryId
    const category = section.categories.find(cat => cat.categoryId.toString() === categoryId);
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



// 📌 Use the routes
app.use("/api", clinicRoutes);
app.use("/dashboard", DashboardRoutes);
app.use("/newsection", SectionRoutes);
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at: http://localhost:${PORT}`);
});
