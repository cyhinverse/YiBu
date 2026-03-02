import rabbitMQ from 'amqplib';

const config_rabbitmq = {
  url: 'http://localhost:5858',
};

const messageQueue = 'my_queue';

const connectRabbitMQ = async () => {
  try {
    const connection = await rabbitMQ.connect(config_rabbitmq.url);
    if (!connection) {
      throw new Error('Failed to connect to RabbitMQ');
    }
    const chanel = await connection.createChannel();
    await chanel.assertQueue(messageQueue);
    console.log('Connected to RabbitMQ');
    return { connection, chanel };
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
  }
};

export { connectRabbitMQ };
