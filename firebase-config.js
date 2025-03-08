const admin = require("firebase-admin");
require("dotenv").config();

try {
  // Read FIREBASE_CONFIG variable from .env file
  const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);

  // Initialize Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
    databaseURL: `https://${firebaseConfig.project_id}.firebaseio.com`,
  });

  console.log("Firebase initialized successfully!");

  // Export the database
  const db = admin.firestore();
  module.exports = db;
} catch (error) {
  console.error("Error initializing Firebase:", error.message);
  process.exit(1); // Terminate the program in case of an error
}