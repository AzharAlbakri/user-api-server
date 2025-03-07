const redis = require("redis");
require("dotenv").config();

// REDIS LOCAL
// const redisClient = redis.createClient({
//     socket: {
//         host: "127.0.0.1",
//         port: 6379
//     }
// });

// REDIS CLOUD
const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    },
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASSWORD
});

redisClient.on("error", (err) => {
    console.error("❌ Redis Connection Error:", err);
});

redisClient.connect()
    .then(() => console.log("✅ Connected to Redis..."))
    .catch(err => console.error("❌ Redis Connection Failed:", err));

module.exports = redisClient;


