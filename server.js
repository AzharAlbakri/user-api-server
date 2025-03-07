const path = require('path');
const session = require('express-session'); // لاستخدام الجلسات
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');

const redisClient = require("./config/redis");
const getClinicSettings = require("./middleware/clinicMiddleware");


const authRoutes = require('./routes/auth');
const passport = require('./utils/passport'); // استيراد ملف passport.js
const mongoose = require('mongoose');
require('dotenv').config();

const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const clinicRoutes = require("./routes/clinicRoutes");

// استيراد نموذج المستخدم والمريض والمواعيد
const User = require('./models/User');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const Article = require('./models/Article');
const Admin = require('./models/Admin'); // استيراد النموذج
const { verifyToken } = require('./utils/jwt'); // استيراد التحقق من التوكن
const { authenticateToken } = require('./utils/jwt'); // استيراد التحقق من التوكن
const Service = require('./models/Service');
const Clinic = require('./models/Clinic');

const app = express();
app.use(cors()); // تفعيل CORS لجميع الطلبات

// app.use(bodyParser.json()); 

// تعيين الحد الأقصى لحجم الطلب إلى 50 ميغابايت (يمكنك تغييره حسب الحاجة)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
// تقديم ملفات الترجمة من مجلد 'locales'
app.use('/locales', express.static(path.join(__dirname, 'locales')));
const PORT = process.env.PORT || 8080;

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ Error connecting to MongoDB:", err));

// app.use(getClinicSettings);  // استخدام Middleware لجلب إعدادات العيادة

// ربط routes الخاصة بالتسجيل
app.use('/api/auth', authRoutes);


//لتسجيل المستخدمين عبر جوجل ومايكرسوفت
// إعداد الجلسات
// app.use(session({
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: true
// }));
// app.use(passport.initialize());
// app.use(passport.session());

app.use(express.json()); // لضمان قراءة الـ body
app.use(express.urlencoded({ extended: true })); // لفهم البيانات بصيغة x-www-form-urlencoded

app.use(cookieParser()); // ✅ إضافة `cookie-parser`

// ✅ استخدم `express-session` قبل `passport.initialize()`
// app.use(session({
//     secret: process.env.SESSION_SECRET,  // استبدله بمفتاح سري قوي
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: false } // تأكد أن `secure: false` عند التطوير
// }));


app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSecretKey',
  resave: false,
  saveUninitialized: true
}));




// ✅ تهيئة Passport
app.use(passport.initialize());
app.use(passport.session());

// لخدمة الملفات الثابتة (CSS، JavaScript، إلخ)
app.use(express.static("public"));

// إعدادات مسار تسجيل الدخول عبر جوجل
app.get('/api/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// إعدادات مسار رد جوجل
app.get('/api/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/login'
}), (req, res) => {
  // نجاح التسجيل أو تسجيل الدخول
  res.redirect('/'); // يمكنك توجيه المستخدم إلى صفحة معينة بعد النجاح
});

// إعدادات مسار تسجيل الدخول عبر مايكروسوفت
app.get('/api/auth/microsoft', passport.authenticate('microsoft', {
  scope: ['user.read', 'mail.read']
}));

// إعدادات مسار رد مايكروسوفت
app.get('/api/auth/microsoft/callback', passport.authenticate('microsoft', {
  failureRedirect: '/login'
}), (req, res) => {
  // نجاح التسجيل أو تسجيل الدخول
  res.redirect('/profile'); // يمكنك توجيه المستخدم إلى صفحة معينة بعد النجاح
});

// صفحة البروفايل
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


// API لجلب جميع المستخدمين
app.get('/getAllUsers', async (req, res) => {
  try {
    console.log("test1");
    const users = await User.find();
    if (users.length === 0) {
      return res.status(404).json({ message: 'لا يوجد مستخدمون.' });
    }
    res.status(200).json(users);
  } catch (error) {
    console.error('خطأ أثناء جلب المستخدمين:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المستخدمين.' });
  }
});

// API لجلب جميع المرضى
app.get('/getAllPatients', async (req, res) => {
  try {
    const patients = await Patient.find();
    if (patients.length === 0) {
      return res.status(404).json({ message: 'لا يوجد مرضى.' });
    }
    res.status(200).json(patients);
  } catch (error) {
    console.error('خطأ أثناء جلب المرضى:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المرضى.' });
  }
});

// API لجلب جميع المواعيد
app.get('/getAllAppointments', async (req, res) => {
  try {
    const appointments = await Appointment.find();
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'لا يوجد مواعيد.' });
    }
    res.status(200).json(appointments);
  } catch (error) {
    console.error('خطأ أثناء جلب المواعيد:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المواعيد.' });
  }
});
// API لجلب المواعيد التي حالتها 'booked'
app.get('/getBookedAppointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: 'booked' });

    if (appointments.length === 0) {
      return res.status(404).json({ message: 'لا يوجد مواعيد محجوزة.' });
    }

    res.status(200).json(appointments);
  } catch (error) {
    console.error('خطأ أثناء جلب المواعيد المحجوزة:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المواعيد المحجوزة.' });
  }
});

// API لجلب الأوقات المتاحة لتاريخ معين
app.get('/getAvailableTimes/:date', async (req, res) => {
  const { date } = req.params;

  try {
    const appointments = await Appointment.find({ date });
    const bookedTimes = appointments.filter(app => app.status === 'booked').map(app => app.time);

    const allTimes = ["05:00:00", "06:00:00", "07:00:00", "08:00:00", "09:00:00", "10:00:00", "11:00:00", "12:00:00", "13:00:00", "14:00:00", "15:00:00", "16:00:00", "17:00:00", "18:00:00", "19:00:00", "20:00:00", "21:00:00", "22:00:00"];
    const availableTimes = allTimes.filter(time => !bookedTimes.includes(time));

    res.status(200).json({ availableTimes });
  } catch (error) {
    console.error('خطأ أثناء جلب الأوقات المتاحة:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الأوقات المتاحة.' });
  }
});

app.post('/addYearAppointments', async (req, res) => {
  try {
    const year = 2025; // السنة المطلوبة
    const startDate = new Date(`${year}-01-01T00:00:00Z`); // بداية اليوم بتوقيت UTC
    const endDate = new Date(`${year}-12-31T23:59:59Z`); // نهاية آخر يوم في السنة

    const appointments = []; // مصفوفة لتخزين المواعيد

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      for (let hour = 9; hour < 18; hour++) { // من 9 صباحًا حتى 17:30 مساءً
        for (let minute of [0, 30]) { // كل نصف ساعة (00 و 30)
          const appointmentTime = new Date(date);
          appointmentTime.setUTCHours(hour, minute, 0, 0); // ضبط الساعة والدقيقة بتوقيت UTC

          appointments.push({
            appointment_id: `${appointmentTime.toISOString().split('T')[0]}-${hour}:${minute === 0 ? '00' : '30'}`, // معرف الموعد
            date: appointmentTime.toISOString().split('T')[0], // تاريخ الموعد
            time: appointmentTime.toISOString().split('T')[1].split('.')[0], // وقت الموعد (ساعات:دقائق:ثواني)
            status: 'available', // حالة الموعد (متاح)
            patient_id: null, // لا يوجد مريض حالياً
            doctor_id: 'dr123', // معرف الطبيب الافتراضي
          });
        }
      }
    }

    // إضافة المواعيد إلى MongoDB دفعة واحدة
    await Appointment.insertMany(appointments);

    res.status(200).json({ message: 'تمت إضافة مواعيد السنة 2025 بنجاح!' });
  } catch (error) {
    console.error('خطأ أثناء إضافة مواعيد السنة:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة مواعيد السنة' });
  }
});

// Request Consultation
app.post('/addUser', async (req, res) => {
  const { fullName, email, phone, contactMethod, consultationType, additionalInfo } = req.body;

  if (!fullName || !email || !phone || !contactMethod || !consultationType) {
    return res.status(400).json({ error: 'الرجاء توفير جميع الحقول المطلوبة.' });
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
    res.status(200).json({ message: 'تم إضافة المستخدم بنجاح!', userId: user._id });
  } catch (error) {
    console.error('خطأ أثناء إضافة المستخدم:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة المستخدم' });
  }
});

// API لحجز موعد
app.post('/bookAppointment', async (req, res) => {
  const { patient_name, phone_number, email, identity_number, appointment_date, appointment_time, appointment_reason, preferred_doctor, additional_notes, has_insurance, insurance_company, insurance_policy_number, agree_to_terms, reminder_method } = req.body;

  if (!patient_name || !phone_number || !email || !identity_number || !appointment_date || !appointment_time || !appointment_reason || !agree_to_terms || !reminder_method) {
    return res.status(400).json({ error: 'الرجاء توفير جميع الحقول المطلوبة.' });
  }

  try {
    const appointment = await Appointment.findOne({ date: appointment_date, time: appointment_time });

    if (!appointment) {
      return res.status(404).json({ error: 'الموعد غير موجود أو تم حجزه مسبقًا.' });
    }

    if (appointment.status === 'booked') {
      return res.status(400).json({ error: 'الموعد غير متاح لأنه تم حجزه مسبقًا.' });
    }

    const patient = new Patient({
      patient_name,
      phone_number,
      email,
      identity_number,
      appointment_date,
      appointment_time,
      appointment_reason,
      preferred_doctor: preferred_doctor || 'غير محدد',
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

    res.status(200).json({ message: 'تم حجز الموعد بنجاح!', appointmentId: appointment._id, patientId: patient._id });
  } catch (error) {
    console.error('خطأ أثناء حجز الموعد:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء حجز الموعد.' });
  }
});

// API لإضافة مقال جديد
app.post('/addArticle', async (req, res) => {
  const { title, content, images, videos, keywords, sources, author, category, summary, tags, comments_enabled, status } = req.body;

  if (!title || !content || !author || !category || !summary) {
    return res.status(400).json({ error: 'الرجاء توفير جميع الحقول المطلوبة.' });
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
    res.status(200).json({ message: 'تم إضافة المقال بنجاح!', articleId: article._id });
  } catch (error) {
    console.error('خطأ أثناء إضافة المقال:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة المقال.' });
  }
});

// API لجلب جميع المقالات
app.get('/getAllArticles', async (req, res) => {
  try {
    const articles = await Article.find();
    if (articles.length === 0) {
      return res.status(404).json({ message: 'لا يوجد مقالات.' });
    }
    res.status(200).json(articles);
  } catch (error) {
    console.error('خطأ أثناء جلب المقالات:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المقالات.' });
  }
});

// SERVICES
// جلب جميع الخدمات
app.get('/services', async (req, res) => {
  try {
    //const { lang } = req.query; // الحصول على اللغة من الـ query parameters
    const { lang } = "en"; // الحصول على اللغة من الـ query parameters

    const services = await Service.find(); // جلب جميع الخدمات من قاعدة البيانات

    if (services.length === 0) return res.status(404).json({ message: "No services found" });

    // إذا لم يتم تحديد اللغة، أرسل جميع البيانات كما هي
    if (!lang) return res.json(services);

    // تجهيز البيانات حسب اللغة المطلوبة
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

// API لاسترجاع بيانات الخدمة
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

// جلب الفئات لخدمة معينة
app.get('/service/:serviceId/categories', async (req, res) => {
  try {
    console.log("req.params.serviceId", req.params.serviceId);
    const service = await Service.findOne({ serviceId: req.params.serviceId });
    if (!service) return res.status(404).json({ error: 'الخدمة غير موجودة' });
    res.json(service.categories);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الفئات' });
  }
});

// جلب الفئات الفرعية لفئة معينة
app.get('/service/:serviceId/category/:categoryId/subcategories', async (req, res) => {
  try {
    console.log("req.params.serviceId:", req.params.serviceId);

    // البحث عن الخدمة باستخدام ObjectId
    const service = await Service.findOne({ serviceId: new mongoose.Types.ObjectId(req.params.serviceId) });
    console.log("Service Found:", service);

    if (!service) return res.status(404).json({ error: 'الخدمة غير موجودة' });

    // البحث عن الفئة باستخدام ObjectId
    const category = service.categories.find(cat => cat.categoryId.toString() === req.params.categoryId);
    console.log("Category Found:", category);

    if (!category) return res.status(404).json({ error: 'الفئة غير موجودة' });

    // إرجاع الفئات الفرعية
    res.json(category.subcategories);

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الفئات الفرعية' });
  }
});

app.get('/service/:serviceId/category/:categoryId/subcategory/:subcategoryId', async (req, res) => {
  try {
    const { serviceId, categoryId, subcategoryId } = req.params;

    // البحث عن الخدمة باستخدام serviceId
    const service = await Service.findOne({ serviceId });
    if (!service) return res.status(404).json({ error: 'الخدمة غير موجودة' });

    // البحث عن الفئة باستخدام categoryId
    const category = service.categories.find(cat => cat.categoryId.toString() === categoryId);
    if (!category) return res.status(404).json({ error: 'الفئة غير موجودة' });

    // البحث عن الفئة الفرعية باستخدام subcategoryId
    const subcategory = category.subcategories.find(sub => sub.subcategoryId.toString() === subcategoryId);
    if (!subcategory) return res.status(404).json({ error: 'الفئة الفرعية غير موجودة' });

    // إرجاع بيانات الفئة الفرعية
    res.json(subcategory);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الفئة الفرعية' });
  }
});


//#region DASHBOARD
// إضافة مسؤول جديد إلى قاعدة البيانات
app.post('/addAdmin', async (req, res) => {
  const { fullName, email, password, role } = req.body;

  // التحقق من القيم المدخلة
  if (!fullName || !email || !password || !role) {
    return res.status(400).json({ error: 'يرجى تقديم جميع الحقول المطلوبة.' });
  }

  try {
    // تحقق ما إذا كان البريد الإلكتروني مستخدم مسبقًا
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({ error: 'البريد الإلكتروني مستخدم بالفعل.' });
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // إنشاء سجل جديد في قاعدة البيانات
    const newAdmin = new Admin({
      fullName,
      email,
      password: hashedPassword,
      role,
    });

    await newAdmin.save();
    res.status(201).json({ message: 'تمت إضافة المسؤول بنجاح.' });
  } catch (error) {
    console.error('خطأ أثناء إضافة المسؤول:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة المسؤول.' });
  }
});

// // API لتسجيل الدخول
app.post('/adminLogin', async (req, res) => {
  const { email, password } = req.body;

  // التحقق من المدخلات
  if (!email || !password) {
    return res.status(400).json({ error: 'يرجى تقديم البريد الإلكتروني وكلمة المرور.' });
  }

  try {
    // البحث عن المسؤول في قاعدة البيانات
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ error: 'المسؤول غير موجود.' });
    }

    // التحقق من كلمة المرور
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'كلمة المرور غير صحيحة.' });
    }

    // إنشاء توكن
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({ message: 'تم تسجيل الدخول بنجاح.', token, adminInfo: admin });
  } catch (error) {
    console.error('خطأ أثناء تسجيل الدخول:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول.' });
  }
});

// ---------------------------
// APIs المحمية للـ Dashboard
// ---------------------------

// API لجلب جميع المستخدمين
app.get('/dashboard/getAllUsers', authenticateToken, async (req, res) => {
  try {
    const users = await User.find();
    if (users.length === 0) {
      return res.status(404).json({ message: 'لا يوجد مستخدمون.' });
    }
    res.status(200).json(users);
  } catch (error) {
    console.error('خطأ أثناء جلب المستخدمين:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المستخدمين.' });
  }
});

// API لجلب جميع المرضى
app.get('/dashboard/getAllPatients', authenticateToken, async (req, res) => {
  try {
    const patients = await Patient.find();
    if (patients.length === 0) {
      return res.status(404).json({ message: 'لا يوجد مرضى.' });
    }
    res.status(200).json(patients);
  } catch (error) {
    console.error('خطأ أثناء جلب المرضى:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المرضى.' });
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

// API لجلب المواعيد التي حالتها 'booked'
app.get('/dashboard/getBookedAppointments', authenticateToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: 'booked' });
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'لا يوجد مواعيد محجوزة.' });
    }
    res.status(200).json(appointments);
  } catch (error) {
    console.error('خطأ أثناء جلب المواعيد المحجوزة:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المواعيد المحجوزة.' });
  }
});

// API لجلب المواعيد التي حالتها 'booked'
app.get('/dashboard/getLockedAppointments', authenticateToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: 'locked' });
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'لا يوجد مواعيد مقفلة.' });
    }
    res.status(200).json(appointments);
  } catch (error) {
    console.error('خطأ أثناء جلب المواعيد المقفلة:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المواعيد المقفلة.' });
  }
});

// API لجلب المواعيد التي حالتها 'booked'
app.get('/dashboard/getAvailableAppointments', authenticateToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: 'available' });
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'لا يوجد مواعيد متاحة.' });
    }
    res.status(200).json(appointments);
  } catch (error) {
    console.error('خطأ أثناء جلب المواعيد المتاحة:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المواعيد المتاحة.' });
  }
});

// API لإضافة مقال جديد
app.post('/dashboard/addArticle', authenticateToken, async (req, res) => {
  const { title, content, images, videos, keywords, sources, author, category, summary, tags, comments_enabled, status } = req.body;

  if (!title || !content || !author || !category || !summary) {
    return res.status(400).json({ error: 'الرجاء توفير جميع الحقول المطلوبة.' });
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
    res.status(200).json({ message: 'تم إضافة المقال بنجاح!', articleId: article._id });
  } catch (error) {
    console.error('خطأ أثناء إضافة المقال:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة المقال.' });
  }
});

// API لجلب جميع المقالات
app.get('/dashboard/getAllArticles', authenticateToken, async (req, res) => {
  try {
    const articles = await Article.find();
    if (articles.length === 0) {
      return res.status(404).json({ message: 'لا يوجد مقالات.' });
    }
    res.status(200).json(articles);
  } catch (error) {
    console.error('خطأ أثناء جلب المقالات:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المقالات.' });
  }
});

app.get('/dashboard/getArticle/:id', async (req, res) => {
  try {
    const articleId = req.params.id; // الحصول على ID من الرابط
    const article = await Article.findById(articleId); // البحث عن المقال في قاعدة البيانات
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.status(200).json(article); // إرسال المقال كاستجابة
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the article' });
  }
});

// تحديث مقال بناءً على ID
app.put('/dashboard/updateArticle/:id', async (req, res) => {
  try {
    console.log(req.body)
    const articleId = req.params.id;
    const updatedData = req.body;

    // التأكد من أن المقال موجود
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // تحديث بيانات المقال في قاعدة البيانات
    const updatedArticle = await Article.findByIdAndUpdate(
      articleId,
      updatedData,
      { new: true } // إرجاع المقال بعد التحديث
    );

    res.json({ message: 'Article updated successfully', article: updatedArticle });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// تعديل حالة المقال (Published / Draft)
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

    // تحقق من الحقول المطلوبة
    if (!title || !content || !author || !category || !summary) {
      return res.status(400).json({ error: 'الرجاء توفير جميع الحقول المطلوبة.' });
    }

    // إنشاء المقال الجديد
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

    // حفظ المقال في قاعدة البيانات
    await article.save();

    res.status(201).json({ message: 'تم إضافة المقال بنجاح!', articleId: article._id });

  } catch (error) {
    console.error('خطأ أثناء إضافة المقال:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة المقال.' });
  }
});

// ✅ API لحذف المقال
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

    // التحقق من الحالة الجديدة
    if (!["available", "booked", "locked"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // البحث عن الموعد وتحديث حالته
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
// لإضافة خدمة جديدة
app.post('/dashboard/addService', verifyToken, async (req, res) => {
  try {
    console.log("Received Data:", req.body); // لفحص البيانات القادمة من العميل

    const { title, description, imageUrl, categories } = req.body;

    // التحقق من صحة البيانات الأساسية
    if (!title || !description || !imageUrl || !categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ message: "Missing required fields or invalid categories" });
    }

    // إنشاء كائن الخدمة الجديد بدون `serviceId` (MongoDB سيولده تلقائيًا)
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

    // حفظ الخدمة في قاعدة البيانات
    await newService.save();

    // إرجاع الاستجابة بنجاح
    res.status(201).json({ message: 'Service added successfully', service: newService });

  } catch (err) {
    console.error('Error adding service:', err);
    res.status(500).json({ message: 'Error adding service', error: err.message });
  }
});

//لجلب جميع الخدمات
app.get('/dashboard/services', authenticateToken, async (req, res) => {
  try {
    const { lang } = req.query; // الحصول على اللغة من الـ query parameters
    const services = await Service.find(); // جلب جميع الخدمات من قاعدة البيانات

    if (services.length === 0) return res.status(404).json({ message: "No services found" });

    // إذا لم يتم تحديد اللغة، أرسل جميع البيانات كما هي
    if (!lang) return res.json(services);

    // تجهيز البيانات حسب اللغة المطلوبة
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

// API لاسترجاع بيانات الخدمة
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

// تحديث حالة الخدمة أو الفئة أو الفئة الفرعية
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
      return res.status(400).json({ error: 'نوع غير صحيح' });
    }
    res.json(updatedService);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء تحديث الحالة' });
  }
});

// حذف خدمة
app.delete('/dashboard/service/:serviceId', verifyToken, async (req, res) => {
  try {
    await Service.findOneAndDelete({ serviceId: req.params.serviceId });
    res.json({ message: 'تم حذف الخدمة بنجاح' });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء حذف الخدمة' });
  }
});

// حذف فئة لخدمة معينة
// to do
//حذف فئة فرعية داخل فئة
// to do

// جلب الفئات لخدمة معينة
app.get('/dashboard/service/:serviceId/categories', verifyToken, async (req, res) => {
  try {
    const service = await Service.findOne({ serviceId: req.params.serviceId });
    if (!service) return res.status(404).json({ error: 'الخدمة غير موجودة' });
    res.json(service.categories);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الفئات' });
  }
});

// جلب الفئات الفرعية لفئة معينة
app.get('/dashboard/service/:serviceId/category/:categoryId/subcategories', verifyToken, async (req, res) => {
  try {
    console.log("req.params.serviceId:", req.params.serviceId);

    // البحث عن الخدمة باستخدام ObjectId
    const service = await Service.findOne({ serviceId: new mongoose.Types.ObjectId(req.params.serviceId) });
    console.log("Service Found:", service);

    if (!service) return res.status(404).json({ error: 'الخدمة غير موجودة' });

    // البحث عن الفئة باستخدام ObjectId
    const category = service.categories.find(cat => cat.categoryId.toString() === req.params.categoryId);
    console.log("Category Found:", category);

    if (!category) return res.status(404).json({ error: 'الفئة غير موجودة' });

    // إرجاع الفئات الفرعية
    res.json(category.subcategories);

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الفئات الفرعية' });
  }
});

// ✅ تحديث بيانات الخدمة
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

// ✅ تحديث بيانات الفئة داخل خدمة
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

// ✅ تحديث بيانات الفئة الفرعية داخل فئة
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

// 📌 استخدام الـ Routes
app.use("/api", clinicRoutes);

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`السيرفر يعمل على: http://localhost:${PORT}`);

});
