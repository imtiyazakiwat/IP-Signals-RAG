export declare class UnsupportedFormatError extends Error {
    constructor(mimeType: string);
}
export declare function isFormatSupported(mimeType: string): boolean;
/**
 * Process an image buffer: validate format, resize to max 512x512, convert to JPEG.
 *
 * @param inputBuffer - Raw image buffer
 * @param mimeType - MIME type of the input image
 * @returns Processed JPEG buffer (max 512x512, 90% quality)
 * @throws UnsupportedFormatError if format is not supported
 */
export declare function processImage(inputBuffer: Buffer, mimeType: string): Promise<Buffer>;
//# sourceMappingURL=imageProcessor.d.ts.map