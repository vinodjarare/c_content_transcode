import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import path from "path";

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath || "");

// Define stream variant interface for video transcoding
interface StreamVariant {
  resolution: string;
  size: string;
  bitrate: string;
  bandwidth: number;
}

// Available video quality variants
const videoStreams: StreamVariant[] = [
  { resolution: "360p", size: "640x360", bitrate: "800k", bandwidth: 800000 },
  { resolution: "480p", size: "842x480", bitrate: "1400k", bandwidth: 1400000 },
  {
    resolution: "720p",
    size: "1280x720",
    bitrate: "2800k",
    bandwidth: 2800000,
  },
  {
    resolution: "1080p",
    size: "1920x1080",
    bitrate: "5000k",
    bandwidth: 5000000,
  },
];

/**
 * Handles transcoding of audio files to HLS format
 * @param inputPath Path to the input audio file
 * @param outputDir Directory to save transcoded files
 * @returns Promise that resolves when transcoding is complete
 */
export const transcodeAudio = (
  inputPath: string,
  outputDir: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputM3U8: string = path.join(outputDir, "index.m3u8");
    const segmentPattern: string = path.join(outputDir, "segment_%03d.ts");

    ffmpeg(inputPath)
      .audioCodec("aac")
      .outputOptions([
        "-vn", // no video
        "-hls_time 6",
        "-hls_list_size 0",
        `-hls_segment_filename ${segmentPattern}`,
      ])
      .format("hls")
      .output(outputM3U8)
      .on("start", () => {
        console.log(`🚀 Starting audio transcoding for ${inputPath}...`);
      })
      .on("progress", (progress) => {
        if (progress.percent) {
          console.log(`🔄 Progress: ${progress.percent.toFixed(2)}%`);
        }
      })
      .on("end", () => {
        console.log(`✅ Audio HLS conversion completed for ${inputPath}`);
        resolve();
      })
      .on("error", (err: Error) => {
        console.error(`❌ Transcoding error for ${inputPath}:`, err.message);
        reject(err);
      })
      .run();
  });
};

/**
 * Handles transcoding of video files to HLS format with multiple resolutions
 * @param inputPath Path to the input video file
 * @param outputDir Directory to save transcoded files
 * @returns Promise that resolves when transcoding is complete
 */
export const transcodeVideo = (
  inputPath: string,
  outputDir: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Ensure output directory exists
    fs.mkdirSync(outputDir, { recursive: true });

    // Track completion of individual stream transcoding
    let completedStreams = 0;
    let hasError = false;

    // Create transcoding promises for each stream
    videoStreams.forEach((stream) => {
      const resolutionDir = path.join(outputDir, stream.resolution);
      fs.mkdirSync(resolutionDir, { recursive: true });

      const output = path.join(resolutionDir, "index.m3u8");

      ffmpeg(inputPath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions([
          "-profile:v baseline",
          "-level 3.0",
          "-start_number 0",
          "-hls_time 6",
          "-hls_list_size 0",
          `-s ${stream.size}`,
          `-b:v ${stream.bitrate}`,
          `-maxrate ${stream.bitrate}`,
          "-bufsize 2M",
          `-hls_segment_filename ${path.join(
            resolutionDir,
            "segment_%03d.ts"
          )}`,
        ])
        .format("hls")
        .output(output)
        .on("start", () => {
          console.log(
            `🚀 Starting ${stream.resolution} conversion for ${inputPath}`
          );
        })
        .on("progress", (progress) => {
          if (progress.percent) {
            console.log(
              `🔄 ${stream.resolution} progress: ${progress.percent.toFixed(
                2
              )}%`
            );
          }
        })
        .on("end", () => {
          console.log(
            `✅ ${stream.resolution} conversion finished for ${inputPath}`
          );
          completedStreams++;

          // Check if all streams are complete
          if (completedStreams === videoStreams.length && !hasError) {
            // Generate master playlist
            const masterPlaylist = path.join(outputDir, "master.m3u8");

            const playlistContent = [
              "#EXTM3U",
              "#EXT-X-VERSION:3",
              ...videoStreams.map(
                (stream) =>
                  `#EXT-X-STREAM-INF:BANDWIDTH=${stream.bandwidth},RESOLUTION=${stream.size}\n${stream.resolution}/index.m3u8`
              ),
            ].join("\n");

            fs.writeFile(masterPlaylist, playlistContent, (err) => {
              if (err) {
                console.error("❌ Error writing master playlist:", err);
                reject(err);
              } else {
                console.log("✅ Master playlist created");
                resolve();
              }
            });
          }
        })
        .on("error", (err: Error) => {
          console.error(
            `❌ ${stream.resolution} error for ${inputPath}:`,
            err.message
          );
          hasError = true;
          reject(err);
        })
        .run();
    });
  });
};

/**
 * Main function to handle transcoding of both audio and video files
 * @param inputPath Path to the input media file
 * @param outputPath Path to save transcoded files
 * @param format Media format ("Audio" or "Video")
 * @returns Promise that resolves when transcoding is complete
 */
export const transcodeMedia = async (
  inputPath: string,
  outputPath: string,
  format: string
): Promise<void> => {
  // Ensure input file exists

  console.log("process::", process.cwd());

  inputPath = path.join(process.cwd(), inputPath);
  outputPath = path.join(process.cwd(), outputPath);

  console.log(
    `Transcoding media from ${inputPath} to ${outputPath}...`
  );
 
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // Process based on format
  if (format.toLowerCase() === "audio") {
    return transcodeAudio(inputPath, outputPath);
  } else if (format.toLowerCase() === "video") {
    return transcodeVideo(inputPath, outputPath);
  } else {
    throw new Error(`Unsupported format: ${format}`);
  }
};
