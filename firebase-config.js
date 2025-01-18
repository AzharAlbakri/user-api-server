const admin = require("firebase-admin");
require("dotenv").config();

try {
  // قراءة المتغير FIREBASE_CONFIG من ملف .env
  const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);

  // تهيئة Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
    databaseURL: `https://${firebaseConfig.project_id}.firebaseio.com`,
  });

  console.log("Firebase initialized successfully!");

  // تصدير قاعدة البيانات
  const db = admin.firestore();
  module.exports = db;
} catch (error) {
  console.error("Error initializing Firebase:", error.message);
  process.exit(1); // إنهاء البرنامج في حال وجود خطأ
}
