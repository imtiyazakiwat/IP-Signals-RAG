import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { pool, initDatabase } from '../db';
import { processImage, isFormatSupported } from '../services/imageProcessor';
import { generateEmbedding, serializeEmbedding } from '../services/embeddingService';

// Supported image extensions and their MIME types
const EXTENSION_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

/**
 * Get MIME type from file extension
 */
function getMimeType(filename: string): string | null {
  const ext = path.extname(filename).toLowerCase();
  return EXTENSION_TO_MIME[ext] || null;
}

/**
 * Read all image files from the copyrighted-content directory
 */
function getImageFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    console.log(`Directory ${directory} does not exist`);
    return [];
  }

  const files = fs.readdirSync(directory);
  return files.filter((file) => {
    const mimeType = getMimeType(file);
    return mimeType !== null && isFormatSupported(mimeType);
  });
}

/**
 * Insert copyrighted content into the database
 */
async function insertCopyrightedContent(
  filename: string,
  embedding: number[],
  contentType: string
): Promise<void> {
  const embeddingStr = `[${embedding.join(',')}]`;
  
  await pool.query(
    `INSERT INTO copyrighted_content (filename, embedding, content_type)
     VALUES ($1, $2::vector, $3)`,
    [filename, embeddingStr, contentType]
  );
}

/**
 * Main seed function
 */
async function seed(): Promise<void> {
  const copyrightedContentDir = path.join(process.cwd(), 'copyrighted-content');
  
  console.log('Starting database seeding...');
  console.log(`Reading images from: ${copyrightedContentDir}`);

  // Initialize database (creates tables if they don't exist)
  await initDatabase();

  // Get all image files
  const imageFiles = getImageFiles(copyrightedContentDir);
  
  if (imageFiles.length === 0) {
    console.log('No image files found in copyrighted-content directory');
    console.log('Add images (JPEG, PNG, WebP, AVIF) to the copyrighted-content directory and run again');
    await pool.end();
    return;
  }

  console.log(`Found ${imageFiles.length} image(s) to process`);

  let successCount = 0;
  let errorCount = 0;

  for (const filename of imageFiles) {
    const filePath = path.join(copyrightedContentDir, filename);
    const mimeType = getMimeType(filename);

    if (!mimeType) {
      console.log(`Skipping ${filename}: unknown format`);
      continue;
    }

    try {
      console.log(`Processing: ${filename}`);

      // Read the image file
      const imageBuffer = fs.readFileSync(filePath);

      // Process the image (resize, convert to JPEG)
      const processedBuffer = await processImage(imageBuffer, mimeType);

      // Generate embedding
      const embedding = await generateEmbedding(processedBuffer);

      // Insert into database
      await insertCopyrightedContent(filename, embedding, 'image');

      console.log(`  ✓ Successfully processed and stored: ${filename}`);
      successCount++;
    } catch (error) {
      console.error(`  ✗ Error processing ${filename}:`, error instanceof Error ? error.message : error);
      errorCount++;
    }
  }

  console.log('\nSeeding complete!');
  console.log(`  Successful: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);

  await pool.end();
}

// Run the seed script
seed().catch((error) => {
  console.error('Seed script failed:', error);
  process.exit(1);
});
