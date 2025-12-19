import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { pool, initDatabase } from '../db';
import { processImage, isFormatSupported } from '../services/imageProcessor';
import { generateEmbedding } from '../services/embeddingService';

const EXTENSION_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

function getMimeType(filename: string): string | null {
  const ext = path.extname(filename).toLowerCase();
  return EXTENSION_TO_MIME[ext] || null;
}

async function seedSpecificFiles(filenames: string[]): Promise<void> {
  const copyrightedContentDir = path.join(process.cwd(), 'copyrighted-content');
  
  console.log('Seeding specific files...');
  await initDatabase();

  for (const filename of filenames) {
    const filePath = path.join(copyrightedContentDir, filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filename}`);
      continue;
    }

    const mimeType = getMimeType(filename);
    if (!mimeType || !isFormatSupported(mimeType)) {
      console.log(`Unsupported format: ${filename}`);
      continue;
    }

    try {
      console.log(`Processing: ${filename}`);
      
      // Delete existing entry if exists
      await pool.query('DELETE FROM copyrighted_content WHERE filename = $1', [filename]);
      
      const imageBuffer = fs.readFileSync(filePath);
      const processedBuffer = await processImage(imageBuffer, mimeType);
      const embedding = await generateEmbedding(processedBuffer);
      const embeddingStr = `[${embedding.join(',')}]`;
      
      await pool.query(
        `INSERT INTO copyrighted_content (filename, embedding, content_type) VALUES ($1, $2::vector, $3)`,
        [filename, embeddingStr, 'image']
      );
      
      console.log(`  ✓ Done: ${filename}`);
    } catch (error) {
      console.error(`  ✗ Error: ${filename}`, error instanceof Error ? error.message : error);
    }
  }

  await pool.end();
  console.log('Done!');
}

// Get filenames from command line args
const files = process.argv.slice(2);
if (files.length === 0) {
  console.log('Usage: ts-node server/scripts/seed-specific.ts file1.jpg file2.jpg');
  process.exit(1);
}

seedSpecificFiles(files);
