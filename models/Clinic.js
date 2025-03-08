const mongoose = require("mongoose");

const ClinicSchema = new mongoose.Schema({
    domain: { type: String, unique: true, required: true },  // Clinic domain
    name: { type: String, required: true },  // Clinic name
    logo: { type: String, default: "/default-logo.png" }, // Clinic logo
    icon: { type: String, default: "/default-icon.png" }, // Clinic icon

    theme: {
        primaryColor: { type: String, default: "#FF5733" },
        secondaryColor: { type: String, default: "#33FF57" },
        font: { type: String, default: "Roboto" },
        primaryFontColor: { type: String, default: "#FFFFFF" },
        secondaryFontColor: { type: String, default: "#000000" },

        buttonPrimaryColor: { type: String, default: "#FF5733" },
        buttonPrimaryFontColor: { type: String, default: "#FFFFFF" },

        buttonSecondaryColor: { type: String, default: "#33FF57" },
        buttonSecondaryFontColor: { type: String, default: "#000000" },

        primaryFontFamily: { type: String, default: "Roboto" },
        secondaryFontFamily: { type: String, default: "Arial" }
    },

    features: {
        enableOnlineBooking: { type: Boolean, default: true },
        enableChat: { type: Boolean, default: false }
    },

    sections: {
        heroSection: { type: Boolean, default: true },
        appointmentSection: { type: Boolean, default: true },
        consultationForm: { type: Boolean, default: true },
        aboutSection: { type: Boolean, default: true },
        servicesSection: { type: Boolean, default: true },
        footerSection: { type: Boolean, default: true },
        login: { type: Boolean, default: true },
        signup: { type: Boolean, default: true }
    },

    socialMedia: {
        whatsapp: { type: String, default: "" },
        facebook: { type: String, default: "" },
        linkedin: { type: String, default: "" },
        instagram: { type: String, default: "" }
    },

    clinicInfo: {
        fullNameAndTitles: { type: String, required: true }, 
        specialty: { type: String, required: true },
        jobTitle: { type: String, required: true },
        additionalDegree: { type: String, default: "" },
        academicPosition: { type: String, default: "" },

        about: { type: String, required: true },
        mobile: { type: String, required: true },
        whatsapp: { type: String, default: "" },
        hospitalName: { type: String, default: "" },
        email: { type: String, required: true },
        location: { type: String, required: true },
        contact: { type: String, default: "" },

        legalNotice: { type: String, default: "" },
        privacyPolicy: { type: String, default: "" },
        cookiePolicy: { type: String, default: "" },
        copyright: { type: String, default: "© 2025" }
    },

    languageList: {
        type: [
            {
                code: { type: String, required: true }, // Language code
                name: { type: String, required: true }, // Language name
                default: { type: Boolean, default: false } // Is it the default language?
            }
        ],
        default: [
            { code: "en", name: "English", default: true },
            { code: "ar", name: "العربية" }
        ]
    }});

module.exports = mongoose.model("Clinic", ClinicSchema);
