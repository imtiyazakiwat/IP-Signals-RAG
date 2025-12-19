import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { processImage } from '../services/imageProcessor';
import { extractKeyFrames } from '../services/videoProcessor';
import { generateEmbedding, generateEmbeddingWithDescription, extractCelebrityName } from '../services/embeddingService';
import { checkSimilarity, findByCelebrityName, SimilarityMatch } from '../services/similarityChecker';

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
 * Uses celebrity name matching as the PRIMARY method.
 * 
 * Logic:
 * - If celebrity name is identified AND matches a file in DB -> FLAGGED
 * - If celebrity name is identified but NO match in DB -> SAFE (person not in our protected list)
 * - If no celebrity identified, fall back to embedding similarity with HIGH threshold (90%)
 * - Otherwise -> SAFE
 */
async function processImageUpload(buffer: Buffer, mimeType: string): Promise<{
  status: 'flagged' | 'safe';
  matches: SimilarityMatch[];
}> {
  // Process the image (resize, convert to JPEG)
  const processedImage = await processImage(buffer, mimeType);
  
  // Generate embedding and get description for celebrity name extraction
  const { embedding, description } = await generateEmbeddingWithDescription(processedImage);
  
  // Extract celebrity name from the description
  const celebrityName = extractCelebrityName(description);
  console.log(`Celebrity identified: ${celebrityName || 'None'}`);
  
  // If a celebrity was identified, use name matching ONLY
  if (celebrityName) {
    const nameMatches = await findByCelebrityName(celebrityName);
    console.log(`Name matches found: ${nameMatches.length}`);
    
    if (nameMatches.length > 0) {
      // Celebrity found in our protected database
      return {
        status: 'flagged',
        matches: nameMatches.slice(0, 3),
      };
    }
    
    // Celebrity identified but NOT in our database = SAFE
    // This prevents Dhoni from matching Kohli just because they look similar
    console.log(`Celebrity "${celebrityName}" not in protected database - marking as safe`);
    return {
      status: 'safe',
      matches: [],
    };
  }
  
  // No celebrity identified - fall back to embedding similarity
  // Use very high threshold (90%) to avoid false positives
  const embeddingResult = await checkSimilarity(embedding, 0.90);
  
  if (embeddingResult.status === 'flagged' && embeddingResult.matches.length > 0) {
    return {
      status: 'flagged',
      matches: embeddingResult.matches,
    };
  }
  
  // No confident match found - return safe
  return {
    status: 'safe',
    matches: [],
  };
}

/**
 * Process a video upload and check for similarity.
 * Extracts key frames and uses celebrity name matching with CONSENSUS requirement.
 * 
 * Logic:
 * - Extract frames from video
 * - For each frame, identify celebrity name
 * - Only flag if the SAME protected celebrity is identified in MULTIPLE frames (>=2)
 * - This prevents false positives from single-frame misidentification
 */
async function processVideoUpload(buffer: Buffer): Promise<{
  status: 'flagged' | 'safe';
  matches: SimilarityMatch[];
}> {
  // Extract key frames
  const frames = await extractKeyFrames(buffer);
  console.log(`Extracted ${frames.length} frames from video`);
  
  // Track how many times each protected celebrity is identified
  const celebrityCount: Map<string, { count: number; matches: SimilarityMatch[] }> = new Map();
  
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    console.log(`Processing frame ${i + 1}/${frames.length}`);
    
    // Generate embedding and get description for celebrity name extraction
    const { description } = await generateEmbeddingWithDescription(frame);
    
    // Extract celebrity name from the description
    const celebrityName = extractCelebrityName(description);
    console.log(`Frame ${i + 1} - Celebrity identified: ${celebrityName || 'None'}`);
    
    if (celebrityName) {
      // Check if this celebrity is in our protected database
      const nameMatches = await findByCelebrityName(celebrityName);
      
      if (nameMatches.length > 0) {
        // Celebrity found in our protected database - increment count
        const existing = celebrityCount.get(celebrityName);
        if (existing) {
          existing.count++;
        } else {
          celebrityCount.set(celebrityName, { count: 1, matches: nameMatches });
        }
        console.log(`Protected celebrity "${celebrityName}" found (count: ${celebrityCount.get(celebrityName)?.count})`);
      } else {
        console.log(`Celebrity "${celebrityName}" not in protected database`);
      }
    }
  }
  
  // Only flag if a protected celebrity was identified in at least 2 frames (consensus)
  // This prevents false positives from single-frame hallucinations
  const MIN_FRAMES_FOR_CONSENSUS = 2;
  
  const confirmedMatches: SimilarityMatch[] = [];
  const confirmedCelebrities: string[] = [];
  
  for (const [name, data] of celebrityCount.entries()) {
    if (data.count >= MIN_FRAMES_FOR_CONSENSUS) {
      confirmedCelebrities.push(name);
      for (const match of data.matches) {
        if (!confirmedMatches.some(m => m.id === match.id)) {
          confirmedMatches.push(match);
        }
      }
    } else {
      console.log(`Celebrity "${name}" only found in ${data.count} frame(s) - not enough for consensus`);
    }
  }
  
  if (confirmedMatches.length > 0) {
    console.log(`Confirmed protected celebrities (>=2 frames): ${confirmedCelebrities.join(', ')}`);
    return {
      status: 'flagged',
      matches: confirmedMatches.slice(0, 3),
    };
  }
  
  // No confirmed protected celebrities found - return safe
  console.log('No protected celebrities confirmed in video (need >=2 frames)');
  return {
    status: 'safe',
    matches: [],
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
