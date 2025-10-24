const amqp = require("amqplib");
const config = require("../config");

class MessageBroker {
  static connection = null;
  static channel = null;

  // 🔗 Kết nối RabbitMQ 
  static async connect() {
    if (this.channel) return this.channel; // Đã có thì dùng lại

    try {
      const connection = await amqp.connect(config.rabbitMQURI);
      const channel = await connection.createChannel();

      // Đảm bảo tồn tại queue cho cả Product & Order
      await channel.assertQueue(config.orderQueue, { durable: true });
      await channel.assertQueue(config.productQueue, { durable: true });

      this.connection = connection;
      this.channel = channel;

      console.log("✅ Connected to RabbitMQ (Product Service)");
      return channel;
    } catch (error) {
      console.error("❌ Failed to connect RabbitMQ:", error.message);
      throw error;
    }
  }

  //  Gửi message tới 1 queue cụ thể
  static async publishMessage(queue, message) {
    try {
      const channel = await this.connect();
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        persistent: true,
      });
      console.log(`📦 Message sent to queue [${queue}]`);
    } catch (error) {
      console.error("❌ Error publishing message:", error.message);
    }
  }

  //  Nhận message từ 1 queue (dùng cho phản hồi từ Order → Product)
  static async consumeMessage(queue, callback) {
    try {
      const channel = await this.connect();
      await channel.consume(
        queue,
        async (msg) => {
          if (msg) {
            try {
              const content = JSON.parse(msg.content.toString());
              await callback(content);
              channel.ack(msg);
            } catch (err) {
              console.error("❌ Error processing message:", err.message);
              channel.nack(msg, false, false);
            }
          }
        },
        { noAck: false }
      );
      console.log(`👂 Listening for messages on queue [${queue}]`);
    } catch (error) {
      console.error("❌ Error consuming message:", error.message);
    }
  }
}

module.exports = MessageBroker;
