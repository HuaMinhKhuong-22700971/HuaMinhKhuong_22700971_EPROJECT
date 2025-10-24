const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  products: [
    {
      type: mongoose.Schema.Types.Mixed, // Mixed để lưu mọi kiểu object (id, name, price,…)
      required: true,
    },
  ],
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { collection: 'orders' });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
