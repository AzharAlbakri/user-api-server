const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./firebase-config'); // استيراد إعدادات Firebase

const app = express();

app.use(cors()); // تفعيل CORS لجميع الطلبات

const PORT = 3000;

// إعداد body-parser لمعالجة بيانات JSON
app.use(bodyParser.json());

// API لجلب جميع المستخدمين
app.get('/getAllUsers', async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    if (usersSnapshot.empty) {
      return res.status(404).json({ message: 'لا يوجد مستخدمون.' });
    }

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(users);
  } catch (error) {
    console.error('خطأ أثناء جلب المستخدمين:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المستخدمين.' });
  }
});

// API لجلب جميع المرضى من patients collection
app.get('/getAllPatients', async (req, res) => {
  try {
    // جلب جميع المستندات من Collection patients
    const patientsSnapshot = await db.collection('patients').get();

    // التحقق إذا كانت Collection فارغة
    if (patientsSnapshot.empty) {
      return res.status(404).json({ message: 'لا يوجد مرضى.' });
    }

    // تحويل المستندات إلى مصفوفة من الكائنات
    const patients = patientsSnapshot.docs.map(doc => ({
      id: doc.id, // معرف المريض
      ...doc.data(), // البيانات الخاصة بالمريض
    }));

    res.status(200).json(patients);
  } catch (error) {
    console.error('خطأ أثناء جلب المرضى:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المرضى.' });
  }
});

// API لجلب جميع المواعيد
app.get('/getAllAppointments', async (req, res) => {
  try {
    const appointmentsSnapshot = await db.collection('appointments').get();
    if (appointmentsSnapshot.empty) {
      return res.status(404).json({ message: 'لا يوجد مواعيد.' });
    }

    const appointments = appointmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(appointments);
  } catch (error) {
    console.error('خطأ أثناء جلب المواعيد:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المواعيد.' });
  }
});


// API لجلب الأوقات المتاحة لتاريخ معين
app.get('/getAvailableTimes/:date', async (req, res) => {
  try {
      const { date } = req.params;

      const appointmentsSnapshot = await db.collection('appointments')
          .where('date', '==', date)
          .get();

      if (appointmentsSnapshot.empty) {
          return res.status(200).json({ availableTimes: ["05:00:00","06:00:00","07:00:00","08:00:00", "09:00:00", "10:00:00", "11:00:00", "12:00:00", "13:00:00", "14:00:00", "15:00:00", "16:00:00", "17:00:00", "18:00:00", "19:00:00", "20:00:00", "21:00:00", "22:00:00" ]});
      }

      // جمع الأوقات المحجوزة لهذا اليوم
      const bookedTimes = appointmentsSnapshot.docs
          .filter(doc => doc.data().status === 'booked')
          .map(doc => doc.data().time);

      // قائمة الأوقات الممكنة
      const allTimes = ["05:00:00","06:00:00","07:00:00","08:00:00", "09:00:00", "10:00:00", "11:00:00", "12:00:00", "13:00:00", "14:00:00", "15:00:00", "16:00:00", "17:00:00", "18:00:00", "19:00:00", "20:00:00", "21:00:00", "22:00:00" ];

      // الأوقات المتاحة = كل الأوقات - الأوقات المحجوزة
      const availableTimes = allTimes.filter(time => !bookedTimes.includes(time));

      res.status(200).json({ availableTimes });
  } catch (error) {
      console.error('خطأ أثناء جلب الأوقات المتاحة:', error);
      res.status(500).json({ error: 'حدث خطأ أثناء جلب الأوقات المتاحة.' });
  }
});




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

// API لحجز موعد
app.post('/bookAppointment', async (req, res) => {
  console.log(req.body);
  const {
    patient_name,
    phone_number,
    email,
    identity_number,
    appointment_date,
    appointment_time,
    appointment_reason,
    preferred_doctor,
    additional_notes,
    has_insurance,
    insurance_company,
    insurance_policy_number,
    agree_to_terms,
    reminder_method,
  } = req.body;

  // التحقق من الحقول المطلوبة
  if (
    !patient_name ||
    !phone_number ||
    !email ||
    !identity_number ||
    !appointment_date ||
    !appointment_time ||
    !appointment_reason ||
    !agree_to_terms ||
    !reminder_method
  ) {
    return res.status(400).json({ error: 'الرجاء توفير جميع الحقول المطلوبة.' });
  }

  try {
    // البحث عن الموعد باستخدام التاريخ والوقت
    const appointmentSnapshot = await db.collection('appointments')
      .where('date', '==', appointment_date)
      .where('time', '==', appointment_time)
      .get();

    if (appointmentSnapshot.empty) {
      return res.status(404).json({ error: 'الموعد غير موجود أو تم حجزه مسبقًا.' });
    }

    const appointmentDoc = appointmentSnapshot.docs[0]; // الموعد الأول في النتائج
    const appointmentRef = appointmentDoc.ref; // مرجع المستند
    const appointmentData = appointmentDoc.data();

    // التحقق إذا كان الموعد متاحًا
    if (appointmentData.status === 'booked') {
      return res.status(400).json({ error: 'الموعد غير متاح لأنه تم حجزه مسبقًا.' });
    }

    // إنشاء مستند جديد في Collection patients لتخزين بيانات المريض
    const patientRef = db.collection('patients').doc(); // إنشاء مستند جديد بمعرف عشوائي
    await patientRef.set({
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
      appointment_id: appointmentDoc.id, // ربط المريض بمعرف الموعد
      booked_at: new Date().toISOString(), // وقت الحجز
    });

    // تحديث حالة الموعد في Collection appointments إلى 'booked'
    await appointmentRef.update({
      status: 'booked',
      patient_id: patientRef.id, // إضافة معرف المريض إلى الموعد
    });

    res.status(200).json({
      message: 'تم حجز الموعد بنجاح!',
      appointmentId: appointmentDoc.id,
      patientId: patientRef.id, // إرجاع معرف المريض
    });
  } catch (error) {
    console.error('خطأ أثناء حجز الموعد:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء حجز الموعد.' });
  }
});


// API لإضافة مواعيد لجميع أيام السنة (2025)
app.post('/addYearAppointments', async (req, res) => {
  try {
    const year = 2025; // سنة محددة
    const startDate = new Date(`${year}-01-01T08:00:00`); // بداية السنة 2025
    const endDate = new Date(`${year}-12-31T17:00:00`); // نهاية السنة 2025

    const appointments = []; // مصفوفة لحفظ المواعيد

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      for (let hour = 8; hour <= 17; hour++) {
        const appointmentTime = new Date(date);
        appointmentTime.setHours(hour);

        appointments.push({
          appointment_id: `${date.toISOString().split('T')[0]}-${hour}`, // إضافة معرف الموعد
          date: appointmentTime.toISOString().split('T')[0], // تاريخ الموعد
          time: appointmentTime.toISOString().split('T')[1].split('.')[0], // وقت الموعد
          status: 'available', // حالة الموعد (متاح)
          patient_id: null, // لا يوجد مريض حالياً
          doctor_id: 'dr123', // معرف الطبيب الافتراضي
        });
      }
    }

    // إضافة جميع المواعيد إلى قاعدة البيانات
    const batch = db.batch(); // استخدام batch لإضافة المواعيد دفعة واحدة

    appointments.forEach(appointment => {
      const appointmentRef = db.collection('appointments').doc(appointment.appointment_id); // استخدام appointment_id كمفتاح
      batch.set(appointmentRef, appointment);
    });

    // تنفيذ عملية batch
    await batch.commit();

    res.status(200).json({ message: 'تم إضافة مواعيد السنة بنجاح!' });
  } catch (error) {
    console.error('خطأ أثناء إضافة مواعيد السنة:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة مواعيد السنة' });
  }
});

// API لإضافة مقال جديد
app.post('/addArticle', async (req, res) => {
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
    status,
  } = req.body;

  // التحقق من الحقول المطلوبة
  if (!title || !content || !author || !category || !summary) {
    return res.status(400).json({ error: 'الرجاء توفير جميع الحقول المطلوبة: title, content, author, category, summary.' });
  }

  try {
    const articleRef = db.collection('articles').doc(); // إنشاء مستند جديد
    await articleRef.set({
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    res.status(200).json({ message: 'تم إضافة المقال بنجاح!', articleId: articleRef.id });
  } catch (error) {
    console.error('خطأ أثناء إضافة المقال:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة المقال.' });
  }
});

app.get('/getAllArticles', async (req, res) => {
  try {
    const articlesSnapshot = await db.collection('articles').get();
    if (articlesSnapshot.empty) {
      return res.status(404).json({ message: 'لا يوجد مقالات.' });
    }

    const articles = articlesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(articles);
  } catch (error) {
    console.error('خطأ أثناء جلب المقالات:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المقالات.' });
  }
});

app.get('/getArticle/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const articleRef = db.collection('articles').doc(id);
    const articleDoc = await articleRef.get();

    if (!articleDoc.exists) {
      return res.status(404).json({ message: 'المقال غير موجود.' });
    }

    res.status(200).json({ id: articleDoc.id, ...articleDoc.data() });
  } catch (error) {
    console.error('خطأ أثناء جلب المقال:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المقال.' });
  }
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`السيرفر يعمل على: http://localhost:${PORT}`);
});
