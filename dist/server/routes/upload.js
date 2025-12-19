"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const imageProcessor_1 = require("../services/imageProcessor");
const videoProcessor_1 = require("../services/videoProcessor");
const embeddingService_1 = require("../services/embeddingService");
const similarityChecker_1 = require("../services/similarityChecker");
const router = (0, express_1.Router)();
// Configure multer for memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
});
// Supported MIME types
const SUPPORTED_IMAGE_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
]);
const SUPPORTED_VIDEO_TYPES = new Set([
    'video/mp4',
]);
/**
 * Detect if the uploaded file is an image or video based on MIME type.
 */
function detectFileType(mimeType) {
    if (SUPPORTED_IMAGE_TYPES.has(mimeType)) {
        return 'image';
    }
    if (SUPPORTED_VIDEO_TYPES.has(mimeType)) {
        return 'video';
    }
    return 'unsupported';
}
/**
 * Format similarity matches for response.
 */
function formatMatches(matches) {
    return matches.map(match => ({
        filename: match.filename,
        similarity: `${(match.similarity * 100).toFixed(1)}%`,
    }));
}
/**
 * Process an image upload and check for similarity.
 * Uses dual-matching: embedding similarity + celebrity name matching.
 */
async function processImageUpload(buffer, mimeType) {
    // Process the image (resize, convert to JPEG)
    const processedImage = await (0, imageProcessor_1.processImage)(buffer, mimeType);
    // Generate embedding and get description for celebrity name extraction
    const { embedding, description } = await (0, embeddingService_1.generateEmbeddingWithDescription)(processedImage);
    // Check embedding similarity
    const embeddingResult = await (0, similarityChecker_1.checkSimilarity)(embedding);
    // Also check by celebrity name if identified
    const celebrityName = (0, embeddingService_1.extractCelebrityName)(description);
    let nameMatches = [];
    if (celebrityName) {
        console.log(`Celebrity identified: ${celebrityName}`);
        nameMatches = await (0, similarityChecker_1.findByCelebrityName)(celebrityName);
    }
    // Merge matches, prioritizing name matches (more reliable for same person different photo)
    const allMatches = [...nameMatches];
    for (const match of embeddingResult.matches) {
        if (!allMatches.some(m => m.id === match.id)) {
            allMatches.push(match);
        }
    }
    // Sort by similarity and limit
    allMatches.sort((a, b) => b.similarity - a.similarity);
    const topMatches = allMatches.slice(0, 3);
    const isFlagged = topMatches.length > 0 && topMatches[0].similarity > 0.70;
    return {
        status: isFlagged ? 'flagged' : 'safe',
        matches: topMatches,
    };
}
/**
 * Process a video upload and check for similarity.
 * Extracts key frames and checks each for similarity.
 */
async function processVideoUpload(buffer) {
    // Extract key frames
    const frames = await (0, videoProcessor_1.extractKeyFrames)(buffer);
    // Process each frame and collect all matches
    const allMatches = [];
    let isFlagged = false;
    for (const frame of frames) {
        // Generate embedding for each frame
        const embedding = await (0, embeddingService_1.generateEmbedding)(frame);
        // Check similarity
        const result = await (0, similarityChecker_1.checkSimilarity)(embedding);
        if (result.status === 'flagged') {
            isFlagged = true;
        }
        // Collect unique matches (by id)
        for (const match of result.matches) {
            if (!allMatches.some(m => m.id === match.id)) {
                allMatches.push(match);
            }
        }
    }
    // Sort by similarity descending and limit to top 3
    allMatches.sort((a, b) => b.similarity - a.similarity);
    const topMatches = allMatches.slice(0, 3);
    return {
        status: isFlagged ? 'flagged' : 'safe',
        matches: topMatches,
    };
}
/**
 * POST /upload - Handle file uploads and check for copyright infringement.
 */
router.post('/', upload.single('file'), async (req, res, next) => {
    const startTime = Date.now();
    try {
        if (!req.file) {
            res.status(400).json({
                error: 'No file uploaded',
                details: 'Please provide a file in the "file" field',
            });
            return;
        }
        const { buffer, mimetype } = req.file;
        const fileType = detectFileType(mimetype);
        if (fileType === 'unsupported') {
            res.status(400).json({
                error: 'Unsupported format',
                details: 'Accepted formats: JPEG, PNG, WebP, AVIF (images), MP4 (video)',
            });
            return;
        }
        let result;
        if (fileType === 'image') {
            result = await processImageUpload(buffer, mimetype);
        }
        else {
            result = await processVideoUpload(buffer);
        }
        const processingTime = (Date.now() - startTime) / 1000;
        const response = {
            status: result.status,
            matches: formatMatches(result.matches),
            processingTime,
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=upload.js.map