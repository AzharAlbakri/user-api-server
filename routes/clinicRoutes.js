const express = require("express");
const Clinic = require("../models/Clinic");
const router = express.Router();
const redis = require("../config/redis"); // Import Redis client

const CACHE_EXPIRY = 3600; // Cache expiry duration (1 hour)

// 🟢 **Add a new clinic**
router.post("/clinics", async (req, res) => {
    try {
        const clinic = new Clinic(req.body);
        await clinic.save();

        // Store clinic data in Redis after adding
        await redis.setEx(`clinic:${clinic.domain}`, CACHE_EXPIRY, JSON.stringify(clinic));

        res.status(201).json({ message: "✅ Clinic added successfully!", clinic });
    } catch (err) {
        res.status(400).json({ error: "❌ Failed to add clinic", details: err.message });
    }
});

// 🟢 **Fetch all clinics**
router.get("/clinics", async (req, res) => {
    try {
        const cachedClinics = await redis.get("clinics");
        if (cachedClinics) {
            return res.json(JSON.parse(cachedClinics));
        }

        const clinics = await Clinic.find();
        await redis.setEx("clinics", CACHE_EXPIRY, JSON.stringify(clinics)); // Store result in Redis
        res.json(clinics);
    } catch (err) {
        res.status(500).json({ error: "❌ Failed to retrieve clinics", details: err.message });
    }
});

// 🟢 **Fetch clinic data by domain**
router.get("/clinics/:domain", async (req, res) => {
    const { domain } = req.params;

    try {
        const cachedClinic = await redis.get(`clinic:${domain}`);
        if (cachedClinic) {
            return res.json(JSON.parse(cachedClinic));
        }

        const clinic = await Clinic.findOne({ domain });
        if (!clinic) return res.status(404).json({ error: "❌ Clinic not found" });

        await redis.setEx(`clinic:${domain}`, CACHE_EXPIRY, JSON.stringify(clinic)); // Store in cache
        res.json(clinic);
    } catch (err) {
        res.status(500).json({ error: "❌ Failed to retrieve clinic", details: err.message });
    }
});

// 🟢 **Update clinic data**
// 🟢 **Update clinic data (any field)**
router.put("/clinics/:domain", async (req, res) => {
    const { domain } = req.params;
    const updateData = req.body; // Capture the whole request body to update

    try {
        const clinic = await Clinic.findOne({ domain });
        if (!clinic) return res.status(404).json({ error: "❌ Clinic not found" });

        // If languageList is provided, check for the default language and update it
        if (updateData.languageList && Array.isArray(updateData.languageList)) {
            const hasDefaultLang = updateData.languageList.some(lang => lang.default);
            if (!hasDefaultLang) {
                return res.status(400).json({ error: "❌ At least one language must be set as default." });
            }
            // Update languageList field
            clinic.languageList = updateData.languageList;
        }

        // Merge other fields from the request body into the clinic
        Object.keys(updateData).forEach(key => {
            if (key !== "languageList") {
                clinic[key] = updateData[key]; // Dynamically update clinic fields
            }
        });

        // Save the updated clinic data to the database
        await clinic.save();

        // Update the cache with the modified clinic data
        await redis.setEx(`clinic:${domain}`, CACHE_EXPIRY, JSON.stringify(clinic));

        res.json({ message: "✅ Clinic updated successfully!", clinic });
    } catch (err) {
        res.status(400).json({ error: "❌ Failed to update clinic", details: err.message });
    }
});


// 🟢 **Delete a clinic**
router.delete("/clinics/:domain", async (req, res) => {
    const { domain } = req.params;

    try {
        const deletedClinic = await Clinic.findOneAndDelete({ domain });

        if (!deletedClinic) return res.status(404).json({ error: "❌ Clinic not found" });

        // Remove clinic from cache
        await redis.del(`clinic:${domain}`);

        res.json({ message: `✅ Clinic ${domain} deleted successfully!` });
    } catch (err) {
        res.status(500).json({ error: "❌ Failed to delete clinic", details: err.message });
    }
});

module.exports = router;