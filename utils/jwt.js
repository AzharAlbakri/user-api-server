const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Account = require('../models/Account'); // Make sure to adjust this path according to the location of the model in your project

// Create JWT token
function generateToken(payload) {
  console.log(jwt);
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // Expires in one hour
}

// Verify token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from header

  if (!token) {
    return res.status(403).json({ error: 'Please provide a token to access.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded; // Save authenticated user data in the request
    next(); // Proceed to the next step
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token not provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token validity
    req.user = decoded; // Store user information
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = { generateToken, verifyToken, authenticateToken };