const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('./utils/jwt'); // استيراد التحقق من التوكن
const Admin = require('./models/Admin'); // نموذج المسؤول
const User = require('./models/User'); // نموذج المستخدمين
const Patient = require('./models/Patient'); // نموذج المرضى
const Appointment = require('./models/Appointment'); // نموذج المواعيد
const Article = require('./models/Article'); // نموذج المقالات

const router = express.Router();

// Middleware للتحقق من التوكن
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'لم يتم توفير التوكن.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'التوكن غير صالح أو منتهي الصلاحية.' });
  }
};

// 1. API لتسجيل الدخول
router.post('/adminLogin', async (req, res) => {
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

    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'تم تسجيل الدخول بنجاح.', token });
  } catch (error) {
    console.error('خطأ أثناء تسجيل الدخول:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول.' });
  }
});

// 2. API لإضافة مستخدم (Users)
router.post('/addUser', authenticateToken, async (req, res) => {
  const { fullName, email, phone } = req.body;

  if (!fullName || !email || !phone) {
    return res.status(400).json({ error: 'الرجاء توفير جميع الحقول المطلوبة.' });
  }

  try {
    const newUser = new User({ fullName, email, phone, createdAt: new Date() });
    await newUser.save();
    res.status(201).json({ message: 'تمت إضافة المستخدم بنجاح.', userId: newUser._id });
  } catch (error) {
    console.error('خطأ أثناء إضافة المستخدم:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة المستخدم.' });
  }
});

// 3. API لإدارة المقالات
router.get('/getAllArticles', authenticateToken, async (req, res) => {
  try {
    const articles = await Article.find();
    res.status(200).json(articles);
  } catch (error) {
    console.error('خطأ أثناء جلب المقالات:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المقالات.' });
  }
});

router.post('/addArticle', authenticateToken, async (req, res) => {
  const { title, content, author, category } = req.body;

  if (!title || !content || !author || !category) {
    return res.status(400).json({ error: 'الرجاء توفير جميع الحقول المطلوبة.' });
  }

  try {
    const newArticle = new Article({ title, content, author, category, created_at: new Date() });
    await newArticle.save();
    res.status(201).json({ message: 'تمت إضافة المقال بنجاح.', articleId: newArticle._id });
  } catch (error) {
    console.error('خطأ أثناء إضافة المقال:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة المقال.' });
  }
});
