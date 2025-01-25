const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


// استيراد نموذج المستخدم والمريض والمواعيد
const User = require('./models/User');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const Article = require('./models/Article');
const Admin = require('./models/Admin'); // استيراد النموذج
const { verifyToken } = require('./utils/jwt'); // استيراد التحقق من التوكن

const app = express();
app.use(cors()); // تفعيل CORS لجميع الطلبات
app.use(bodyParser.json()); // إعداد body-parser لمعالجة بيانات JSON

const PORT = process.env.PORT || 3000;

// اتصال بقاعدة البيانات MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("تم الاتصال بقاعدة البيانات MongoDB بنجاح"))
  .catch(err => console.log("فشل الاتصال بقاعدة البيانات", err));


// API لجلب جميع المستخدمين
app.get('/getAllUsers', async (req, res) => {
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

    const allTimes = ["05:00:00","06:00:00","07:00:00","08:00:00", "09:00:00", "10:00:00", "11:00:00", "12:00:00", "13:00:00", "14:00:00", "15:00:00", "16:00:00", "17:00:00", "18:00:00", "19:00:00", "20:00:00", "21:00:00", "22:00:00"];
    const availableTimes = allTimes.filter(time => !bookedTimes.includes(time));

    res.status(200).json({ availableTimes });
  } catch (error) {
    console.error('خطأ أثناء جلب الأوقات المتاحة:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الأوقات المتاحة.' });
  }
});

app.post('/addYearAppointments', async (req, res) => {
  try {
    const year = 2025; // السنة المحددة
    const startDate = new Date(`${year}-01-01T08:00:00`); // بداية السنة 2025
    const endDate = new Date(`${year}-12-31T17:00:00`); // نهاية السنة 2025

    const appointments = []; // مصفوفة لتخزين المواعيد

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      for (let hour = 8; hour <= 17; hour++) {
        const appointmentTime = new Date(date);
        appointmentTime.setHours(hour);

        appointments.push({
          appointment_id: `${date.toISOString().split('T')[0]}-${hour}`, // معرف الموعد
          date: appointmentTime.toISOString().split('T')[0], // تاريخ الموعد
          time: appointmentTime.toISOString().split('T')[1].split('.')[0], // وقت الموعد
          status: 'available', // حالة الموعد (متاح)
          patient_id: null, // لا يوجد مريض حالياً
          doctor_id: 'dr123', // معرف الطبيب الافتراضي
        });
      }
    }

    // إضافة المواعيد إلى MongoDB دفعة واحدة باستخدام Promise.all
    await Appointment.insertMany(appointments);

    res.status(200).json({ message: 'تم إضافة مواعيد السنة بنجاح!' });
  } catch (error) {
    console.error('خطأ أثناء إضافة مواعيد السنة:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة مواعيد السنة' });
  }
});

// API لإضافة مستخدم
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

//DASHBOARD
// API لتسجيل الدخول والحصول على توكن
// API لإضافة Admin (مسؤول)
app.post('/addAdmin', async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'يرجى توفير جميع الحقول المطلوبة.' });
  }

  try {
    // تحقق من وجود المسؤول في قاعدة البيانات
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل.' });
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // إضافة المسؤول الجديد إلى قاعدة البيانات
    const newAdmin = new Admin({
      fullName,
      email,
      password: hashedPassword,
    });

    await newAdmin.save();
    res.status(200).json({ message: 'تم إضافة المسؤول بنجاح!' });
  } catch (error) {
    console.error('خطأ أثناء إضافة المسؤول:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة المسؤول.' });
  }
});

// API لتسجيل الدخول (Login) للمسؤولين
app.post('/adminLogin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'يرجى تقديم البريد الإلكتروني وكلمة المرور.' });
  }

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ error: 'المسؤول غير موجود.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'كلمة المرور غير صحيحة.' });
    }

    // إنشاء توكن
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'تم تسجيل الدخول بنجاح.', token });
  } catch (error) {
    console.error('خطأ أثناء تسجيل الدخول:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول.' });
  }
});

// Middleware للتحقق من التوكن
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // استخراج التوكن من الهيدر

  if (!token) {
    return res.status(401).json({ error: 'لم يتم توفير التوكن.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // التحقق من صحة التوكن
    req.user = decoded;  // تخزين معلومات المسؤول في الطلب
    next();
  } catch (err) {
    return res.status(403).json({ error: 'التوكن غير صالح أو منتهي الصلاحية.' });
  }
};






// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`السيرفر يعمل على: http://localhost:${PORT}`);
});
