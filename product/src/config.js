require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3001,
  mongoURI: process.env.MONGO_URI || "mongodb://product-db:27017/product_db",
  rabbitMQURI: process.env.RABBITMQ_URI || "amqp://rabbitmq",
  jwtSecret: process.env.JWT_SECRET || "your_secret_key",
  orderQueue: "orders",
  productQueue: "products",
};
