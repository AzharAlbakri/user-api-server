const express = require('express');
const bodyParser = require('body-parser');
const db = require('./firebase-config'); // استيراد إعدادات Firebase

const app = express();
const PORT = 3000;

// إعداد body-parser لمعالجة بيانات JSON
app.use(bodyParser.json());

// API لإضافة مستخدم
app.post('/addUser', async (req, res) => {
  const {
    fullName,
    email,
    phone,
    contactMethod,
    consultationType,
    additionalInfo,
  } = req.body;

  // التحقق من الحقول المطلوبة
  if (!fullName || !email || !phone || !contactMethod || !consultationType) {
    return res.status(400).json({
      error: 'الرجاء توفير جميع الحقول المطلوبة: fullName, email, phone, contactMethod, consultationType',
    });
  }

  try {
    // إنشاء مستند جديد عشوائي
    const userRef = db.collection('users').doc();
    await userRef.set({
      fullName,
      email,
      phone,
      contactMethod, // الطريقة المختارة للتواصل
      consultationType, // نوع الاستشارة
      additionalInfo: additionalInfo || '', // معلومات إضافية (اختيارية)
      createdAt: new Date().toISOString(), // تاريخ الإضافة
    });

    res.status(200).json({ message: 'تم إضافة المستخدم بنجاح!', userId: userRef.id });
  } catch (error) {
    console.error('خطأ أثناء إضافة المستخدم:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة المستخدم' });
  }
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`السيرفر يعمل على: http://localhost:${PORT}`);
});
