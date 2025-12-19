"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoProcessingError = void 0;
exports.extractKeyFrames = extractKeyFrames;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const util_1 = require("util");
const readFile = (0, util_1.promisify)(fs.readFile);
const writeFile = (0, util_1.promisify)(fs.writeFile);
const unlink = (0, util_1.promisify)(fs.unlink);
const rmdir = (0, util_1.promisify)(fs.rmdir);
const readdir = (0, util_1.promisify)(fs.readdir);
const FRAME_WIDTH = 512;
const FRAME_PERCENTAGES = [10, 30, 50, 70, 90];
class VideoProcessingError extends Error {
    constructor(message) {
        super(message);
        this.name = 'VideoProcessingError';
    }
}
exports.VideoProcessingError = VideoProcessingError;
/**
 * Get video duration in seconds using ffprobe
 */
function getVideoDuration(videoPath) {
    return new Promise((resolve, reject) => {
        fluent_ffmpeg_1.default.ffprobe(videoPath, (err, metadata) => {
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
function extractFrameAtTimestamp(videoPath, timestamp, outputPath) {
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(videoPath)
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
async function cleanupTempDir(tempDir) {
    try {
        const files = await readdir(tempDir);
        for (const file of files) {
            await unlink(path.join(tempDir, file));
        }
        await rmdir(tempDir);
    }
    catch {
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
async function extractKeyFrames(videoBuffer) {
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
        const frameBuffers = [];
        for (let i = 0; i < FRAME_PERCENTAGES.length; i++) {
            const percentage = FRAME_PERCENTAGES[i];
            const timestamp = (percentage / 100) * duration;
            const framePath = path.join(tempDir, `frame_${i}.jpg`);
            await extractFrameAtTimestamp(tempVideoPath, timestamp, framePath);
            const frameBuffer = await readFile(framePath);
            frameBuffers.push(frameBuffer);
        }
        return frameBuffers;
    }
    finally {
        // Clean up temporary files
        await cleanupTempDir(tempDir);
    }
}
//# sourceMappingURL=videoProcessor.js.map