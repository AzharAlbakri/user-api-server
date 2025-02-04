// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const Account = require('../models/Account');



const passport = require('../utils/passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

// POST endpoint لتسجيل حساب جديد
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


// POST endpoint لتسجيل الدخول
router.post('/login', async (req, res) => {
    console.log("11111111");
    const { email, password } = req.body;
    console.log("*****", req.body);

    // تحقق من وجود البيانات المطلوبة
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // البحث عن حساب المستخدم باستخدام البريد الإلكتروني
        const existingAccount = await Account.findOne({ email });
        if (!existingAccount) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // التحقق من كلمة المرور
        const isPasswordCorrect = await bcrypt.compare(password, existingAccount.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // توليد توكن JWT للمستخدم
        const token = jwt.sign(
            { userId: existingAccount._id, fullName: existingAccount.fullName, email: existingAccount.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }  // تنتهي صلاحية التوكن بعد ساعة
        );

        // إرجاع الاستجابة مع بيانات المستخدم والتوكن
        res.status(200).json({
            message: 'Login successful',
            user: {
                fullName: existingAccount.fullName,
                email: existingAccount.email,
            },
            token: token,  // إرسال التوكن مع الاستجابة
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error' });
    }
});



// تسجيل الدخول عبر جوجل
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));



router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    console.log('✅ Google Login Successful:', req.user);
    res.json({
        message: 'Login successful',
        user: req.user
    });
});



// رد على جوجل بعد تسجيل الدخول
// router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
//     // يمكنك هنا عمل عملية تخزين للمستخدم في قاعدة البيانات
//     res.redirect('/dashboard'); // توجيه المستخدم إلى الصفحة الرئيسية
// });

// تسجيل الدخول عبر مايكروسوفت
router.get('/microsoft', passport.authenticate('microsoft', { scope: ['user.read'] }));

// رد على مايكروسوفت بعد تسجيل الدخول
router.get('/microsoft/callback', passport.authenticate('microsoft', { failureRedirect: '/login' }), (req, res) => {
    // يمكنك هنا عمل عملية تخزين للمستخدم في قاعدة البيانات
    res.redirect('/dashboard'); // توجيه المستخدم إلى الصفحة الرئيسية
});


module.exports = router;
