require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  mongoURI: process.env.MONGO_URI || "mongodb://auth-db:27017/auth_db",
  jwtSecret: process.env.JWT_SECRET || "supersecret123"
};
