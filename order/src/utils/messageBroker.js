const amqp = require("amqplib");
const config = require("../config");
const OrderService = require("../services/orderService");

class MessageBroker {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    if (this.channel) return this.channel;

    try {
      this.connection = await amqp.connect(config.rabbitMQUrl);
      this.channel = await this.connection.createChannel();

      console.log("✅ Connected to RabbitMQ (Order Service)");
      return this.channel;
    } catch (error) {
      console.error("❌ RabbitMQ connection error:", error);
      throw error;
    }
  }

  async startConsuming() {
    try {
      const channel = await this.connect();
      const queue = config.rabbitMQQueue || "orders";

      await channel.assertQueue(queue, { durable: true });
      console.log(`📩 Waiting for messages in queue: ${queue}`);

      channel.consume(queue, async (msg) => {
        if (!msg) return;
        try {
          const orderData = JSON.parse(msg.content.toString());
          console.log("📦 Received order message:", orderData);

          const orderService = new OrderService();
          await orderService.createOrder(orderData);

          // ✅ Gửi phản hồi lại cho product-service
          const responseQueue = "products";
          await channel.assertQueue(responseQueue, { durable: true });
          channel.sendToQueue(
            responseQueue,
            Buffer.from(
              JSON.stringify({
                orderId: orderData.orderId,
                status: "completed",
              })
            )
          );

          console.log("✅ Order processed and response sent to 'products'");
          channel.ack(msg);
        } catch (error) {
          console.error("❌ Failed to process message:", error);
          channel.nack(msg, false, false); // bỏ qua message lỗi
        }
      });
    } catch (error) {
      console.error("❌ Error in startConsuming:", error);
    }
  }
}

module.exports = new MessageBroker();
