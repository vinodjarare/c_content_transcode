import { createMessageBroker } from "./factories/brokerFactory";
import { MessageBroker } from "./types";
import("./worker/transcodeWorker");
const startServer = async () => {
  let broker: MessageBroker | null = null;
  try {
    broker = createMessageBroker();

    await broker.connectConsumer().then(() => {
      console.log("🔗 Connected to message broker");
    });

    await broker.connectProducer().then(() => {
      console.log("🔗 Connected to message producer");
    });

    await broker.consumeMessage(["transcode-start"], false);
    console.log("🔗 Listening for messages on topic: transcode:start");

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("🔻 Graceful shutdown...");
      if (broker) {
        await broker.disconnectConsumer();
        await broker.disconnectProducer();
      }
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("🔻 Graceful shutdown...");
      if (broker) {
        await broker.disconnectConsumer();
      }
      process.exit(0);
    });
  } catch (err) {
    console.error("🚨 Failed to start transcoder service:", err);
    if (broker) {
      await broker.disconnectConsumer();
    }
    process.exit(1);
  }
};

void startServer();
