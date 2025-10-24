const Order = require("../models/order");

class OrderController {
  async getAllOrders(req, res) {
    try {
      const orders = await Order.find();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new OrderController();
