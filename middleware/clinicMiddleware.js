const Clinic = require("../models/Clinic");
const redisClient = require("../config/redis");

const getClinicSettings = async (req, res, next) => {
    const domain = req.hostname;  // Get the clinic domain from the request

    try {
        // Check if the data is stored in Redis
        const cachedClinic = await redisClient.get(domain);
        if (cachedClinic) {
            req.clinic = JSON.parse(cachedClinic);
            return next();
        }

        // Fetch settings from the database
        const clinic = await Clinic.findOne({ domain });
        if (!clinic) return res.status(404).json({ message: "Clinic not found" });

        // Store the data in Redis to improve performance
        await redisClient.set(domain, JSON.stringify(clinic), { EX: 3600 }); // Save for one hour

        req.clinic = clinic;
        next();
    } catch (error) {
        console.error("❌ Error fetching clinic settings:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = getClinicSettings;
