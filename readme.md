# Content Transcoding Service

A robust Node.js/TypeScript service for transcoding audio and video content using FFmpeg, Kafka, and BullMQ.

## Overview

This service enables efficient media transcoding with the following features:

- **Distributed messaging** via Kafka for communication between microservices
- **Job queue management** with BullMQ and Redis for reliable task processing
- **High-quality transcoding** using FFmpeg for both audio and video files
- **Adaptive streaming** support with HLS (HTTP Live Streaming) output format
- **Multiple resolution** support for video content

## Architecture

The system follows a message-driven architecture:

1. **Input**: Messages arrive on the `transcode-start` Kafka topic
2. **Processing**: Jobs are queued and processed by workers using BullMQ
3. **Transcoding**: FFmpeg handles the actual media conversion
4. **Output**: Status updates are sent to the `transcode-update` Kafka topic

## Prerequisites

- Node.js (v20+)
- Docker and Docker Compose
- FFmpeg (installed automatically via dependencies)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/vinodjarare/c_content_transcode.git
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root:

```
NODE_ENV=development
PORT=3000

# Kafka
KAFKA_BROKER=localhost:9092

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false
```

### 4. Start infrastructure services

The project includes a Docker Compose file for Kafka and Redis:

```bash
docker-compose up -d
```

This will start:
- Redis on port 6379
- Kafka on port 9092

### 5. Create Kafka topics

You'll need to create the Kafka topics used by the application:

```bash
# Enter the Kafka container
docker exec -it kafka /bin/bash

# Create topics
kafka-topics.sh --create --topic transcode-start --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --topic transcode-update --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1

# Verify topics were created
kafka-topics.sh --list --bootstrap-server localhost:9092
```

### 6. Build and start the service

```bash
# Build TypeScript
npm run build

# Start the service
npm start
```

For development with auto-restart:

```bash
npm run dev
```

## Usage

### Sending a transcoding job

To send a job to the transcoding service, publish a message to the `transcode-start` Kafka topic:

```json
{
  "contentId": "video-123",
  "inputPath": "/path/to/input/file.mp4",
  "outputPath": "/path/to/output/directory",
  "format": "Video"
}
```

For audio content:

```json
{
  "contentId": "audio-456",
  "inputPath": "/path/to/input/file.mp3",
  "outputPath": "/path/to/output/directory",
  "format": "Audio"
}
```

### Tracking job status

Subscribe to the `transcode-update` Kafka topic to receive updates on job status:

- `PENDING`: Job has been received but not yet started
- `PROCESSING`: Transcoding is in progress
- `SUCCESS`: Transcoding completed successfully
- `FAILED`: Transcoding failed

## Key Components

### Kafka Broker

The `KafkaBroker` class implements the `MessageBroker` interface, providing:
- Producer and consumer management
- Topic subscription
- Message sending and receiving

### Redis Connection

Redis provides the backend for BullMQ, storing:
- Job data
- Job states
- Execution history

### BullMQ Workers

Workers process transcoding jobs with:
- Configurable concurrency
- Rate limiting
- Retry strategies
- Error handling

### Transcoding Service

The service offers:
- Audio to HLS transcoding
- Video to multi-resolution HLS transcoding
- Progress tracking
- Error handling

## Outputs

### Audio Transcoding

- HLS playlist (`index.m3u8`)
- Audio segments (`.ts` files)

### Video Transcoding

- Master playlist (`master.m3u8`)
- Resolution-specific playlists (e.g., `360p/index.m3u8`)
- Video segments (`.ts` files) for each resolution

## Troubleshooting

### Kafka Connection Issues

If the service cannot connect to Kafka:
1. Verify Kafka is running: `docker ps | grep kafka`
2. Check Kafka logs: `docker logs kafka`
3. Ensure the `KAFKA_BROKER` environment variable matches the container's address

### Redis Connection Issues

If BullMQ reports Redis connection errors:
1. Verify Redis is running: `docker ps | grep redis`
2. Check Redis logs: `docker logs redis`
3. Validate Redis connection settings in your `.env` file

### Transcoding Failures

If jobs fail during transcoding:
1. Check that input paths are accessible to the service
2. Verify FFmpeg is installed and accessible
3. Check for specific error messages in the logs

## Performance Tuning

### Worker Concurrency

Adjust the worker concurrency settings in `transcodeWorker.ts` based on your server's CPU capacity:

```typescript
{
  concurrency: 5,  // Increase for more powerful servers
  limiter: {
    max: 5,        // Maximum jobs per duration
    duration: 1000 // Time window in milliseconds
  }
}
```

### FFmpeg Settings

Modify FFmpeg parameters in `transcodingService.ts` to balance quality and processing speed:

- Increase `-b:v` for better video quality
- Adjust `-hls_time` for different segment lengths
- Customize the resolution list for specific use cases

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

