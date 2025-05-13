import { Config } from "../config";
import { KafkaBroker } from "../config/kafka";
import { MessageBroker } from "../types";

const { createQueue } = require("./bullmqFactory");
let broker: MessageBroker | null = null;

export const createMessageBroker = (): MessageBroker => {
  if (!Config.KAFKA_BROKER) {
    throw new Error("KAFKA_BROKER is not defined in environment/config");
  }

  if (!broker) {
    console.log("Connecting to Kafka broker...");
    broker = new KafkaBroker(
      "content-transcoder",
      Config.KAFKA_BROKER.split(",").map((b) => b.trim()),
      createQueue()
    );
  }

  return broker;
};
