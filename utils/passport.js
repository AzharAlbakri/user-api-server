const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const Account = require('../models/Account'); // استيراد نموذج حساب المستخدم (قم بتعديل المسار حسب الحاجة)
const bcrypt = require('bcrypt');
require('dotenv').config();


// بيانات جوجل ومايكروسوفت
// بيانات جوجل ومايكروسوفت من .env
// const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
// const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;


module.exports = passport;


// // إعداد جوجل OAuth 2.0
// passport.use(new GoogleStrategy({
//     clientID: GOOGLE_CLIENT_ID,
//     clientSecret: GOOGLE_CLIENT_SECRET,
//     callbackURL: 'http://localhost:3000/api/auth/google/callback',
//     scope: ['profile', 'email']
// }, async (accessToken, refreshToken, profile, done) => {
//     try {
//         // تحقق إذا كان المستخدم موجودًا بالفعل في قاعدة البيانات
//         let account = await Account.findOne({ email: profile.emails[0].value });

//         // إذا لم يكن موجودًا، أنشئ حساب جديد
//         if (!account) {
//             const newAccount = new Account({
//                 fullName: profile.displayName,
//                 email: profile.emails[0].value,
//                 password: '', // يمكن أن تترك كلمة المرور فارغة إذا كان المستخدم يسجل باستخدام جوجل
//                 authType: 'google', // تحديد نوع التسجيل
//             });
//             account = await newAccount.save();
//         }

//         return done(null, account);
//     } catch (error) {
//         return done(error, null);
//     }
// }));

// // إعداد مايكروسوفت OAuth 2.0
// passport.use(new MicrosoftStrategy({
//     clientID: MICROSOFT_CLIENT_ID,
//     clientSecret: MICROSOFT_CLIENT_SECRET,
//     callbackURL: 'http://localhost:3000/api/auth/microsoft/callback',
//     scope: ['user.read']
// }, async (accessToken, refreshToken, profile, done) => {
//     try {
//         // تحقق إذا كان المستخدم موجودًا بالفعل في قاعدة البيانات
//         let account = await Account.findOne({ email: profile.emails[0].value });

//         // إذا لم يكن موجودًا، أنشئ حساب جديد
//         if (!account) {
//             const newAccount = new Account({
//                 fullName: profile.displayName,
//                 email: profile.emails[0].value,
//                 password: '', // كلمة المرور ستكون فارغة للمستخدمين الذين سجلوا باستخدام مايكروسوفت
//                 authType: 'microsoft', // تحديد نوع التسجيل
//             });
//             account = await newAccount.save();
//         }

//         return done(null, account);
//     } catch (error) {
//         return done(error, null);
//     }
// }));

// // تسلسل المستخدم (لتخزين البيانات في الجلسة)
// passport.serializeUser((account, done) => {
//     done(null, account.id);
// });

// // إعادة تحميل المستخدم باستخدام ID (مفيدة لطلب البيانات مرة أخرى من الجلسة)
// passport.deserializeUser(async (id, done) => {
//     try {
//         const account = await Account.findById(id);
//         done(null, account);
//     } catch (error) {
//         done(error, null);
//     }
// });

// module.exports = passport;
