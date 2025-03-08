// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const Account = require('../models/Account');



const passport = require('../utils/passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

// POST endpoint for registering a new account
router.post('/signup', async (req, res) => {
    console.log("123");
    const { fullName, email, password, registrationType } = req.body;

    // تحقق من وجود البيانات المطلوبة
    if (!fullName || !email || !password || !registrationType) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // تحقق من وجود حساب بنفس البريد الإلكتروني
        const existingAccount = await Account.findOne({ email });
        if (existingAccount) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, 10);

        // إنشاء حساب جديد
        const newAccount = new Account({
            fullName,
            email,
            password: hashedPassword,
            registrationType,
        });

        // حفظ الحساب في قاعدة البيانات
        await newAccount.save();

        // توليد توكن JWT للمستخدم الجديد
        const token = jwt.sign(
            { userId: newAccount._id, fullName: newAccount.fullName, email: newAccount.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }  // تنتهي صلاحية التوكن بعد ساعة
        );

        // إرجاع الاستجابة مع بيانات الحساب والتوكن
        res.status(201).json({
            message: 'Account created successfully',
            user: {
                fullName: newAccount.fullName,
                email: newAccount.email,
            },
            token: token,  // إرسال التوكن مع الاستجابة
        });
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// POST endpoint for logging in
router.post('/login', async (req, res) => {
    console.log("11111111");
    const { email, password } = req.body;
    console.log("*****", req.body);

    // Check for required data
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
       // Find user account by email
        const existingAccount = await Account.findOne({ email });
        if (!existingAccount) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Verify password
        const isPasswordCorrect = await bcrypt.compare(password, existingAccount.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token for the user
        const token = jwt.sign(
            { userId: existingAccount._id, fullName: existingAccount.fullName, email: existingAccount.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }  // Token expires after one hour
        );

        // Return response with user data and token
        res.status(200).json({
            message: 'Login successful',
            user: {
                fullName: existingAccount.fullName,
                email: existingAccount.email,
            },
            token: token,  // Send the token with the response
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error' });
    }
});



// Google login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));



router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    console.log('✅ Google Login Successful:', req.user);
    res.json({
        message: 'Login successful',
        user: req.user
    });
});



// Respond to Google after login
// router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
//     // You can perform user storage in the database here
//     res.redirect('/dashboard'); // Redirect the user to the main page
// });

// Microsoft login
router.get('/microsoft', passport.authenticate('microsoft', { scope: ['user.read'] }));

// Respond to Microsoft after login
router.get('/microsoft/callback', passport.authenticate('microsoft', { failureRedirect: '/login' }), (req, res) => {
    // You can perform user storage in the database here
    res.redirect('/dashboard'); // Redirect the user to the main page
});


module.exports = router;
