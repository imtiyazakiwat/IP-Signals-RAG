export declare class VideoProcessingError extends Error {
    constructor(message: string);
}
/**
 * Extract key frames from a video buffer at 10%, 30%, 50%, 70%, 90% timestamps.
 * Each frame is resized to 512px width maintaining aspect ratio.
 *
 * @param videoBuffer - Raw video buffer (MP4)
 * @returns Array of 5 JPEG frame buffers
 * @throws VideoProcessingError if extraction fails
 */
export declare function extractKeyFrames(videoBuffer: Buffer): Promise<Buffer[]>;
//# sourceMappingURL=videoProcessor.d.ts.map