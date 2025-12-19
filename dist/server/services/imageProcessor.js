"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedFormatError = void 0;
exports.isFormatSupported = isFormatSupported;
exports.processImage = processImage;
const sharp_1 = __importDefault(require("sharp"));
const SUPPORTED_FORMATS = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
]);
const MAX_DIMENSION = 512;
const JPEG_QUALITY = 90;
class UnsupportedFormatError extends Error {
    constructor(mimeType) {
        super(`Unsupported format: ${mimeType}. Accepted formats: JPEG, PNG, WebP, AVIF`);
        this.name = 'UnsupportedFormatError';
    }
}
exports.UnsupportedFormatError = UnsupportedFormatError;
function isFormatSupported(mimeType) {
    return SUPPORTED_FORMATS.has(mimeType);
}
/**
 * Process an image buffer: validate format, resize to max 512x512, convert to JPEG.
 *
 * @param inputBuffer - Raw image buffer
 * @param mimeType - MIME type of the input image
 * @returns Processed JPEG buffer (max 512x512, 90% quality)
 * @throws UnsupportedFormatError if format is not supported
 */
async function processImage(inputBuffer, mimeType) {
    if (!isFormatSupported(mimeType)) {
        throw new UnsupportedFormatError(mimeType);
    }
    const image = (0, sharp_1.default)(inputBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    // Calculate new dimensions maintaining aspect ratio
    let newWidth;
    let newHeight;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
            newWidth = MAX_DIMENSION;
            newHeight = Math.round((height / width) * MAX_DIMENSION);
        }
        else {
            newHeight = MAX_DIMENSION;
            newWidth = Math.round((width / height) * MAX_DIMENSION);
        }
    }
    // Build the processing pipeline
    let pipeline = image;
    if (newWidth !== undefined && newHeight !== undefined) {
        pipeline = pipeline.resize(newWidth, newHeight, {
            fit: 'inside',
            withoutEnlargement: true,
        });
    }
    // Convert to JPEG at 90% quality
    const outputBuffer = await pipeline
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer();
    return outputBuffer;
}
//# sourceMappingURL=imageProcessor.js.map