import { Queue } from "bullmq";
import { createRedisConnection } from "./connectionFactory";
import { KafkaBroker } from "../config/kafka";
import { Config } from "../config";

let queue: Queue;

export const createQueue = (): Queue => {
  if (!queue) {
    const connection = createRedisConnection();

    queue = new Queue("content-transcoder", {
      connection,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    });
  }

  return queue;
};
