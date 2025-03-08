const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('./utils/jwt'); // Import token verification
const Admin = require('./models/Admin'); // Admin model
const User = require('./models/User'); // User model
const Patient = require('./models/Patient'); // Patient model
const Appointment = require('./models/Appointment'); // Appointment model
const Article = require('./models/Article'); // Article model

const router = express.Router();

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token not provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// 1. API for admin login
router.post('/adminLogin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password.' });
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful.', token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'An error occurred during login.' });
  }
});

// 2. API to add a user (Users)
router.post('/addUser', authenticateToken, async (req, res) => {
  const { fullName, email, phone } = req.body;

  if (!fullName || !email || !phone) {
    return res.status(400).json({ error: 'Please provide all required fields.' });
  }

  try {
    const newUser = new User({ fullName, email, phone, createdAt: new Date() });
    await newUser.save();
    res.status(201).json({ message: 'User added successfully.', userId: newUser._id });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'An error occurred while adding the user.' });
  }
});

// 3. API to manage articles
router.get('/getAllArticles', authenticateToken, async (req, res) => {
  try {
    const articles = await Article.find();
    res.status(200).json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'An error occurred while fetching articles.' });
  }
});

router.post('/addArticle', authenticateToken, async (req, res) => {
  const { title, content, author, category } = req.body;

  if (!title || !content || !author || !category) {
    return res.status(400).json({ error: 'Please provide all required fields.' });
  }

  try {
    const newArticle = new Article({ title, content, author, category, created_at: new Date() });
    await newArticle.save();
    res.status(201).json({ message: 'Article added successfully.', articleId: newArticle._id });
  } catch (error) {
    console.error('Error adding article:', error);
    res.status(500).json({ error: 'An error occurred while adding the article.' });
  }
});

module.exports = router;