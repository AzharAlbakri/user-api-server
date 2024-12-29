const admin = require('firebase-admin');
const serviceAccount = require('./user-api-server-firebase-adminsdk-tqt8l-8a8e858efc.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://user-api-server.firebaseio.com" // تأكد من استخدام Project ID الخاص بمشروعك
});

const db = admin.firestore();

module.exports = db;
