# Kafka Testing Guide for Content Transcoding Service

This guide explains how to send test messages to your Kafka-based transcoding service and monitor the results.

## Prerequisites

- Docker and Docker Compose running with Kafka container
- Kafka topics created (`transcode-start` and `transcode-update`)

## Publishing Messages to Kafka

### Using Kafka Command Line Tools

To publish a message to the Kafka topic manually:

```bash
# Enter the Kafka container
docker exec -it kafka bash

# Publish a message to the transcode-start topic
./kafka-console-producer.sh --bootstrap-server localhost:9092 --topic transcode-start
```

After running the command, you can type or paste your JSON message and press Enter. Press Ctrl+D to exit the producer.

### Using the Helper Script

For convenience, use the provided `send-test-job.sh` script:

```bash
./send-test-job.sh /path/to/media/file.mp4 /optional/output/path
```

## Consuming Messages from Kafka

To check messages in a Kafka topic:

```bash
# Enter the Kafka container
docker exec -it kafka bash

# Check messages in the transcode-update topic
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic transcode-update --from-beginning
```

For the `transcode-start` topic:

```bash
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic transcode-start --from-beginning
```

## Sample Message Payloads

### 1. Video Transcoding Job

```json
{
  "contentId": "video-123",
  "inputPath": "/app/uploads/sample.mp4",
  "outputPath": "/app/transcoded/video-123",
  "format": "Video",
  "metadata": {
    "title": "Sample Video",
    "duration": 120,
    "width": 1920,
    "height": 1080
  }
}
```

### 2. Audio Transcoding Job

```json
{
  "contentId": "audio-456",
  "inputPath": "/app/uploads/podcast.mp3",
  "outputPath": "/app/transcoded/audio-456",
  "format": "Audio",
  "metadata": {
    "title": "Sample Podcast",
    "duration": 1800
  }
}
```

### 3. Minimal Required Fields

At minimum, your message must include these fields:

```json
{
  "contentId": "unique-id-123",
  "inputPath": "/path/to/input/file.mp4",
  "outputPath": "/path/to/output/directory",
  "format": "Video"
}
```

## Expected Response Messages

The service will send status updates to the `transcode-update` topic as the job progresses.

### Processing Status

```json
{
  "contentId": "video-123",
  "inputPath": "/app/uploads/sample.mp4",
  "outputPath": "/app/transcoded/video-123",
  "format": "Video",
  "status": "PROCESSING"
}
```

### Success Status

```json
{
  "contentId": "video-123",
  "inputPath": "/app/uploads/sample.mp4",
  "outputPath": "/app/transcoded/video-123",
  "format": "Video",
  "status": "SUCCESS"
}
```

### Failed Status

```json
{
  "contentId": "video-123",
  "inputPath": "/app/uploads/sample.mp4",
  "outputPath": "/app/transcoded/video-123",
  "format": "Video",
  "status": "FAILED"
}
```

## Troubleshooting

### Message Not Being Processed

If your message is published but not processed:

1. Check that your service is running and connected to Kafka
2. Verify the topic name is correct (`transcode-start`)
3. Ensure your JSON payload is valid
4. Check that the `inputPath` is accessible to the service

### File Path Issues

For Docker-based setups, ensure your file paths are accessible within the container context:

- Use volume mounts to expose the file system to both your host and container
- Use absolute paths within the container context
- Verify file permissions allow the service to read input files and write to output directories

### Format Validation

The service expects the `format` field to be exactly one of:
- `"Video"` (case-sensitive)
- `"Audio"` (case-sensitive)

Any other values will result in an error.

## Batch Testing

To test multiple files in batch, you can use a script like this:

```bash
#!/bin/bash
MEDIA_DIR="/path/to/media/files"
OUTPUT_DIR="/path/to/output"

for file in "$MEDIA_DIR"/*; do
  if [[ -f "$file" ]]; then
    echo "Sending job for $file"
    ./send-test-job.sh "$file" "$OUTPUT_DIR/$(basename "$file" | sed 's/\.[^.]*$//')"
    sleep 1
  fi
done
```

Save this as `batch-test.sh`, make it executable with `chmod +x batch-test.sh`, and run it.