const Clinic = require("../models/Clinic");
const redisClient = require("../config/redis");

const getClinicSettings = async (req, res, next) => {
    const domain = req.hostname;  // جلب دومين العيادة من الـ Request

    try {
        // 🔍 تحقق إذا كانت البيانات مخزنة في Redis
        const cachedClinic = await redisClient.get(domain);
        if (cachedClinic) {
            req.clinic = JSON.parse(cachedClinic);
            return next();
        }

        // 🔍 جلب الإعدادات من قاعدة البيانات
        const clinic = await Clinic.findOne({ domain });
        if (!clinic) return res.status(404).json({ message: "Clinic not found" });

        // 🏎️ تخزين البيانات في Redis لتحسين الأداء
        await redisClient.set(domain, JSON.stringify(clinic), { EX: 3600 }); // حفظ لمدة ساعة

        req.clinic = clinic;
        next();
    } catch (error) {
        console.error("❌ Error fetching clinic settings:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = getClinicSettings;
