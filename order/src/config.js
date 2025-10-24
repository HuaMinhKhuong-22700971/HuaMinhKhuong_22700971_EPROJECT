require("dotenv").config();

module.exports = {
  mongoURI: process.env.MONGO_URI || "mongodb://order-db:27017/order_db",
  rabbitMQURI: process.env.RABBITMQ_URI || "amqp://rabbitmq",
  orderQueue: "orders",
  productQueue: "products",
  port: process.env.PORT || 3002,
};
