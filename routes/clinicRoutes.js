const express = require("express");
const Clinic = require("../models/Clinic");
const router = express.Router();
const redis = require("../config/redis"); // استيراد Redis client

const CACHE_EXPIRY = 3600; // مدة التخزين المؤقت (ساعة)

// 🟢 **إضافة عيادة جديدة**
router.post("/clinics", async (req, res) => {
    try {
        const clinic = new Clinic(req.body);
        await clinic.save();

        // تخزين بيانات العيادة في Redis بعد الإضافة
        await redis.setEx(`clinic:${clinic.domain}`, CACHE_EXPIRY, JSON.stringify(clinic));

        res.status(201).json({ message: "✅ Clinic added successfully!", clinic });
    } catch (err) {
        res.status(400).json({ error: "❌ Failed to add clinic", details: err.message });
    }
});

// 🟢 **جلب جميع العيادات**
router.get("/clinics", async (req, res) => {
    try {
        const cachedClinics = await redis.get("clinics");
        if (cachedClinics) {
            return res.json(JSON.parse(cachedClinics));
        }

        const clinics = await Clinic.find();
        await redis.setEx("clinics", CACHE_EXPIRY, JSON.stringify(clinics)); // تخزين النتيجة في Redis
        res.json(clinics);
    } catch (err) {
        res.status(500).json({ error: "❌ Failed to retrieve clinics", details: err.message });
    }
});

// 🟢 **جلب بيانات عيادة حسب الدومين**
router.get("/clinics/:domain", async (req, res) => {
    const { domain } = req.params;

    try {
        const cachedClinic = await redis.get(`clinic:${domain}`);
        if (cachedClinic) {
            return res.json(JSON.parse(cachedClinic));
        }

        const clinic = await Clinic.findOne({ domain });
        if (!clinic) return res.status(404).json({ error: "❌ Clinic not found" });

        await redis.setEx(`clinic:${domain}`, CACHE_EXPIRY, JSON.stringify(clinic)); // تخزين في الكاش
        res.json(clinic);
    } catch (err) {
        res.status(500).json({ error: "❌ Failed to retrieve clinic", details: err.message });
    }
});

// 🟢 **تحديث بيانات العيادة**
router.put("/clinics/:domain", async (req, res) => {
    const { domain } = req.params;
    const { languageList } = req.body;

    try {
        const clinic = await Clinic.findOne({ domain });
        if (!clinic) return res.status(404).json({ error: "❌ Clinic not found" });

        if (languageList && Array.isArray(languageList)) {
            // التحقق من أن هناك لغة واحدة فقط بعلامة default: true
            const hasDefaultLang = languageList.some(lang => lang.default);
            if (!hasDefaultLang) {
                return res.status(400).json({ error: "❌ At least one language must be set as default." });
            }

            // تحديث قائمة اللغات
            clinic.languageList = languageList;
        }

        // تحديث العيادة في قاعدة البيانات
        await clinic.save();

        // تحديث الكاش بعد التعديل
        await redis.setEx(`clinic:${domain}`, CACHE_EXPIRY, JSON.stringify(clinic));

        res.json({ message: "✅ Clinic updated successfully!", clinic });
    } catch (err) {
        res.status(400).json({ error: "❌ Failed to update clinic", details: err.message });
    }
});
// 🟢 **حذف عيادة**
router.delete("/clinics/:domain", async (req, res) => {
    const { domain } = req.params;

    try {
        const deletedClinic = await Clinic.findOneAndDelete({ domain });

        if (!deletedClinic) return res.status(404).json({ error: "❌ Clinic not found" });

        // حذف العيادة من الكاش
        await redis.del(`clinic:${domain}`);

        res.json({ message: `✅ Clinic ${domain} deleted successfully!` });
    } catch (err) {
        res.status(500).json({ error: "❌ Failed to delete clinic", details: err.message });
    }
});

module.exports = router;
