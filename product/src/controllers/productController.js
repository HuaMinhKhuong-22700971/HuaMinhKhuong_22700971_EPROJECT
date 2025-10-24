const Product = require("../models/product");
const messageBroker = require("../utils/messageBroker");
const config = require("../config");
const uuid = require("uuid");

class ProductController {
  constructor() {
    this.createProduct = this.createProduct.bind(this);
    this.getProducts = this.getProducts.bind(this);
    this.createOrder = this.createOrder.bind(this);
    this.getOrderStatus = this.getOrderStatus.bind(this);
    this.getProductById = this.getProductById.bind(this);

    // Bộ nhớ tạm lưu trạng thái order
    this.ordersMap = new Map();
  }

  //  Tạo sản phẩm mới
  async createProduct(req, res) {
    try {
      const product = new Product(req.body);
      const validationError = product.validateSync();

      if (validationError) {
        return res.status(400).json({ message: validationError.message });
      }

      await product.save({ timeout: 30000 });

      res.status(201).json({
        message: "Product created successfully",
        product,
      });
    } catch (error) {
      console.error("❌ Error creating product:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  //  Lấy danh sách sản phẩm
  async getProducts(req, res) {
    try {
      const products = await Product.find({});
      res.status(200).json(products);
    } catch (error) {
      console.error("❌ Error getting products:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  //  Tạo đơn hàng (chỉ gửi message, không chờ phản hồi)
  async createOrder(req, res) {
    try {
      const { ids } = req.body;
      const username = req.user?.username;

      if (!username) {
        return res.status(403).json({ message: "Unauthorized user" });
      }

      const products = await Product.find({ _id: { $in: ids } });
      if (products.length === 0) {
        return res.status(404).json({ message: "No products found" });
      }

      const orderId = uuid.v4();
      const orderData = {
        orderId,
        products,
        user: username, // Sửa: Gửi trường 'user' thay vì 'username'
        status: "pending",
      };

      // Lưu trạng thái tạm
      this.ordersMap.set(orderId, orderData);

      //  Gửi message qua RabbitMQ để OrderService xử lý
      await messageBroker.publishMessage(config.orderQueue, orderData);

      console.log(`📦 Sent order ${orderId} to RabbitMQ`);

      //  Không chờ phản hồi — trả về luôn
      return res.status(202).json({
        message: "Order placed successfully, waiting for processing.",
        orderId,
        status: "pending",
      });
    } catch (error) {
      console.error("❌ Error creating order:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  //  Lấy trạng thái đơn hàng (theo orderId)
  async getOrderStatus(req, res) {
    const { orderId } = req.params;
    const order = this.ordersMap.get(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  }

  // Lấy sản phẩm theo ID
async getProductById(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

}

module.exports = ProductController;
