const express = require("express");
const mongoose = require("mongoose");
const config = require("./config");
const MessageBroker = require("./utils/messageBroker");
const productsRouter = require("./routes/productRoutes");
const ProductController = require("./controllers/productController"); // 🎯 IMPORT CONTROLLER
require("dotenv").config();

// Khởi tạo ProductController DUY NHẤT để dùng chung ordersMap cho cả Router và Consumer
const productController = new ProductController(); 

class App {
    constructor() {
        this.app = express();
        this.connectDB();
        this.setMiddlewares();
        this.setRoutes();
        this.setupMessageBroker(); 
    }

    async connectDB() {
        await mongoose.connect(config.mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB connected");
    }

    async disconnectDB() {
        await mongoose.disconnect();
        console.log("MongoDB disconnected");
    }

    setMiddlewares() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));
    }

    setRoutes() {
        //  SỬA: GỌI HÀM VÀ TRUYỀN INSTANCE CONTROLLER VÀO ROUTER
        // Router sử dụng instance controller đã được tạo (dùng chung ordersMap)
        this.app.use("/api/products", productsRouter(productController)); 
    }

    setupMessageBroker() {
        MessageBroker.connect();
        
        //  SỬA: THÊM LOGIC LẮNG NGHE message phản hồi từ Order Service
        MessageBroker.consumeMessage(config.productQueue, async (orderData) => {
            console.log(`✅ PS received confirmation for order ${orderData.orderId}`);
            
            // Cập nhật bộ nhớ tạm (ordersMap) bằng dữ liệu đã hoàn thành
            if (orderData.status === "completed" && orderData.totalPrice !== undefined) {
                 // Dùng chung instance productController đã tạo ở đầu file
                 productController.ordersMap.set(orderData.orderId, orderData); 
                 console.log(`✅ PS updated order ${orderData.orderId} to COMPLETED.`);
            }
        });
    }

    start() {
        this.server = this.app.listen(3001, () =>
            console.log("Server started on port 3001")
        );
    }

    async stop() {
        await mongoose.disconnect();
        this.server.close();
        console.log("Server stopped");
    }
}

module.exports = App;