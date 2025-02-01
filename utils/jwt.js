const jwt = require('jsonwebtoken');

// إنشاء توكن JWT
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // تنتهي الصلاحية خلال ساعة
}

// التحقق من التوكن
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]; // استخراج التوكن من الهيدر

  if (!token) {
    return res.status(403).json({ error: 'يرجى تقديم توكن للوصول.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded; // حفظ بيانات المستخدم المصادق عليه في الطلب
    next(); // الانتقال إلى الخطوة التالية
  } catch (error) {
    res.status(401).json({ error: 'التوكن غير صالح أو منتهي الصلاحية.' });
  }
}

// Middleware للتحقق من التوكن
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'لم يتم توفير التوكن.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // التحقق من صحة التوكن
    req.user = decoded; // تخزين معلومات المستخدم
    next();
  } catch (err) {
    return res.status(403).json({ error: 'التوكن غير صالح أو منتهي الصلاحية.' });
  }
};

module.exports = { generateToken, verifyToken, authenticateToken };
