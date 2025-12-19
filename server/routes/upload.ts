import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { processImage } from '../services/imageProcessor';
import { extractKeyFrames } from '../services/videoProcessor';
import { generateEmbedding } from '../services/embeddingService';
import { checkSimilarity, SimilarityMatch } from '../services/similarityChecker';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
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

export interface UploadResponse {
  status: 'flagged' | 'safe';
  matches: Array<{
    filename: string;
    similarity: string;
  }>;
  processingTime: number;
}

/**
 * Detect if the uploaded file is an image or video based on MIME type.
 */
function detectFileType(mimeType: string): 'image' | 'video' | 'unsupported' {
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
function formatMatches(matches: SimilarityMatch[]): Array<{ filename: string; similarity: string }> {
  return matches.map(match => ({
    filename: match.filename,
    similarity: `${(match.similarity * 100).toFixed(1)}%`,
  }));
}

/**
 * Process an image upload and check for similarity.
 */
async function processImageUpload(buffer: Buffer, mimeType: string): Promise<{
  status: 'flagged' | 'safe';
  matches: SimilarityMatch[];
}> {
  // Process the image (resize, convert to JPEG)
  const processedImage = await processImage(buffer, mimeType);
  
  // Generate embedding
  const embedding = await generateEmbedding(processedImage);
  
  // Check similarity
  return await checkSimilarity(embedding);
}

/**
 * Process a video upload and check for similarity.
 * Extracts key frames and checks each for similarity.
 */
async function processVideoUpload(buffer: Buffer): Promise<{
  status: 'flagged' | 'safe';
  matches: SimilarityMatch[];
}> {
  // Extract key frames
  const frames = await extractKeyFrames(buffer);
  
  // Process each frame and collect all matches
  const allMatches: SimilarityMatch[] = [];
  let isFlagged = false;
  
  for (const frame of frames) {
    // Generate embedding for each frame
    const embedding = await generateEmbedding(frame);
    
    // Check similarity
    const result = await checkSimilarity(embedding);
    
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
router.post('/', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
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
    
    let result: { status: 'flagged' | 'safe'; matches: SimilarityMatch[] };
    
    if (fileType === 'image') {
      result = await processImageUpload(buffer, mimetype);
    } else {
      result = await processVideoUpload(buffer);
    }
    
    const processingTime = (Date.now() - startTime) / 1000;
    
    const response: UploadResponse = {
      status: result.status,
      matches: formatMatches(result.matches),
      processingTime,
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
