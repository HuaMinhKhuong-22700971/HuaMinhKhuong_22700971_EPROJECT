const express = require("express");
const mongoose = require("mongoose");
const amqp = require("amqplib");
const Order = require("./models/order");
require("dotenv").config();

class App {
    constructor() {
        this.app = express();
        this.app.use(express.json());
    }

    // ✅ Kết nối MongoDB
    async connectDB() {
        try {
            await mongoose.connect(process.env.MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log("✅ MongoDB connected (Order Service)");
        } catch (error) {
            console.error("❌ MongoDB connection failed:", error.message);
        }
    }

    // ✅ Kết nối RabbitMQ và lắng nghe queue
    async setupOrderConsumer() {
        console.log("⏳ Waiting for RabbitMQ to be ready...");

        setTimeout(async () => {
            try {
                const connection = await amqp.connect(process.env.RABBITMQ_URI);
                const channel = await connection.createChannel();

                const ORDER_QUEUE = "orders";
                const PRODUCT_QUEUE = "products";

                await channel.assertQueue(ORDER_QUEUE, { durable: true });
                await channel.assertQueue(PRODUCT_QUEUE, { durable: true });

                console.log(`✅ Listening for messages on queue [${ORDER_QUEUE}]`);

                channel.consume(ORDER_QUEUE, async (msg) => {
                    if (!msg) return;

                    try {
                        // 🎯 SỬA LỖI 1: Lấy trường 'user' (tên trường được gửi từ Product Service)
                        const { products, user, orderId } = JSON.parse(msg.content.toString());
                        console.log(`📩 Received order from user: ${user}`); // Log đúng

                        // Tính tổng giá
                        const totalPrice = products.reduce((acc, p) => acc + (p.price || 0), 0);

                        const newOrder = new Order({
                            // 🎯 SỬA LỖI 2: Lưu toàn bộ object products (vì Model là Mixed Type)
                            products: products, 
                            totalPrice,
                            // 🎯 SỬA LỖI 1: Lưu vào trường 'user' (tên trường Order Model yêu cầu)
                            user: user, 
                            status: "completed",
                        });

                        await newOrder.save();
                        console.log(`💾 Order saved to MongoDB (ID: ${newOrder._id})`);

                        // 🎯 SỬA LỖI 3: Gửi phản hồi, dùng trường 'user'
                        const response = { orderId, user, totalPrice, status: "completed" };
                        channel.sendToQueue(PRODUCT_QUEUE, Buffer.from(JSON.stringify(response)), { persistent: true });
                        console.log(`📤 Sent confirmation to [${PRODUCT_QUEUE}]`);

                        channel.ack(msg);
                    } catch (err) {
                        console.error("❌ Error processing order:", err.message);
                        channel.nack(msg, false, false); // Trả message về queue nếu bị lỗi
                    }
                });
            } catch (err) {
                console.error("❌ RabbitMQ connection failed:", err.message);
            }
        }, 10000);
    }

    // ✅ Khởi động server
    async start() {
        await this.connectDB();
        await this.setupOrderConsumer();
        const PORT = process.env.PORT || 3002;
        this.app.listen(PORT, () => console.log(`🚀 Order Service running on port ${PORT}`));
    }
}

module.exports = App;