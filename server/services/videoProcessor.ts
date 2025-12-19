import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);
const readdir = promisify(fs.readdir);

const FRAME_WIDTH = 512;
const FRAME_PERCENTAGES = [10, 30, 50, 70, 90];

export class VideoProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VideoProcessingError';
  }
}

/**
 * Get video duration in seconds using ffprobe
 */
function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(new VideoProcessingError(`Failed to probe video: ${err.message}`));
        return;
      }
      const duration = metadata.format.duration;
      if (typeof duration !== 'number' || duration <= 0) {
        reject(new VideoProcessingError('Invalid video duration'));
        return;
      }
      resolve(duration);
    });
  });
}


/**
 * Extract a single frame at a specific timestamp
 */
function extractFrameAtTimestamp(
  videoPath: string,
  timestamp: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .seekInput(timestamp)
      .frames(1)
      .size(`${FRAME_WIDTH}x?`) // 512px width, maintain aspect ratio
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => {
        reject(new VideoProcessingError(`Failed to extract frame: ${err.message}`));
      })
      .run();
  });
}

/**
 * Clean up temporary directory and its contents
 */
async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    const files = await readdir(tempDir);
    for (const file of files) {
      await unlink(path.join(tempDir, file));
    }
    await rmdir(tempDir);
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Extract key frames from a video buffer at 10%, 30%, 50%, 70%, 90% timestamps.
 * Each frame is resized to 512px width maintaining aspect ratio.
 * 
 * @param videoBuffer - Raw video buffer (MP4)
 * @returns Array of 5 JPEG frame buffers
 * @throws VideoProcessingError if extraction fails
 */
export async function extractKeyFrames(videoBuffer: Buffer): Promise<Buffer[]> {
  if (!videoBuffer || videoBuffer.length === 0) {
    throw new VideoProcessingError('Video buffer is empty');
  }

  // Create temporary directory for processing
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'video-proc-'));
  const tempVideoPath = path.join(tempDir, 'input.mp4');

  try {
    // Write video buffer to temp file
    await writeFile(tempVideoPath, videoBuffer);

    // Get video duration
    const duration = await getVideoDuration(tempVideoPath);

    // Extract frames at specified percentages
    const frameBuffers: Buffer[] = [];

    for (let i = 0; i < FRAME_PERCENTAGES.length; i++) {
      const percentage = FRAME_PERCENTAGES[i];
      const timestamp = (percentage / 100) * duration;
      const framePath = path.join(tempDir, `frame_${i}.jpg`);

      await extractFrameAtTimestamp(tempVideoPath, timestamp, framePath);
      const frameBuffer = await readFile(framePath);
      frameBuffers.push(frameBuffer);
    }

    return frameBuffers;
  } finally {
    // Clean up temporary files
    await cleanupTempDir(tempDir);
  }
}
