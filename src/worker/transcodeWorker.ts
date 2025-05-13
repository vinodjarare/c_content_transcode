import { Worker } from "bullmq";
import { createRedisConnection } from "../factories/connectionFactory";
import { createMessageBroker } from "../factories/brokerFactory";
import { TranscodingStatus } from "../types";
import { transcodeMedia } from "../services/transcodingService";

const broker = createMessageBroker();

const transcodeWorker = new Worker(
  "content-transcoder",
  async (job) => {
    const { inputPath, outputPath, contentId, format } = job.data;

    console.log(
      `Transcoding ${contentId} from ${inputPath} to ${outputPath} in ${format} format`
    );
    try {
      // Send status update: processing
      broker.sendMessage(
        "transcode-update",
        JSON.stringify({ ...job.data, status: TranscodingStatus.PROCESSING }),
        String(contentId)
      );

      // Perform actual transcoding using our service
      await transcodeMedia(inputPath, outputPath, format);
      
      return { success: true, contentId, outputPath };
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(`Transcoding of ${contentId} failed: ${err.message}`);
      }
      // Send status update: failed
      broker.sendMessage(
        "transcode-update",
        JSON.stringify({ ...job.data, status: TranscodingStatus.FAILED }),
        String(contentId)
      );
      throw err;
    }
  },
  {
    connection: createRedisConnection(),
    concurrency: 5,
    limiter: {
      max: 5,
      duration: 1000,
    },
  }
);

// Handle job completion
transcodeWorker.on("completed", (job) => {
  const { contentId } = job.data;
  console.log(`Transcoding of ${contentId} completed`);
  broker.sendMessage(
    "transcode-update",
    JSON.stringify({ ...job.data, status: TranscodingStatus.SUCCESS }),
    String(contentId)
  );
});

// Handle job failure
transcodeWorker.on("failed", (job, err) => {
  if (!job) {
    return;
  }
  const { contentId } = job.data;
  console.error(`Transcoding of ${contentId} failed: ${err.message}`);
  broker.sendMessage(
    "transcode-update",
    JSON.stringify({ ...job.data, status: TranscodingStatus.FAILED }),
    String(contentId)
  );
});

// Log worker events
transcodeWorker.on("active", job => {
  console.log(`Job ${job.id} has started processing`);
});

transcodeWorker.on("progress", (job, progress) => {
  console.log(`Job ${job.id} reported progress: ${progress}%`);
});

// Export the worker
export default transcodeWorker;