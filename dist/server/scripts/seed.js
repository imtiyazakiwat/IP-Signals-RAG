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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const db_1 = require("../db");
const imageProcessor_1 = require("../services/imageProcessor");
const embeddingService_1 = require("../services/embeddingService");
// Supported image extensions and their MIME types
const EXTENSION_TO_MIME = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
};
/**
 * Get MIME type from file extension
 */
function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    return EXTENSION_TO_MIME[ext] || null;
}
/**
 * Read all image files from the copyrighted-content directory
 */
function getImageFiles(directory) {
    if (!fs.existsSync(directory)) {
        console.log(`Directory ${directory} does not exist`);
        return [];
    }
    const files = fs.readdirSync(directory);
    return files.filter((file) => {
        const mimeType = getMimeType(file);
        return mimeType !== null && (0, imageProcessor_1.isFormatSupported)(mimeType);
    });
}
/**
 * Insert copyrighted content into the database
 */
async function insertCopyrightedContent(filename, embedding, contentType) {
    const embeddingStr = `[${embedding.join(',')}]`;
    await db_1.pool.query(`INSERT INTO copyrighted_content (filename, embedding, content_type)
     VALUES ($1, $2::vector, $3)`, [filename, embeddingStr, contentType]);
}
/**
 * Main seed function
 */
async function seed() {
    const copyrightedContentDir = path.join(process.cwd(), 'copyrighted-content');
    console.log('Starting database seeding...');
    console.log(`Reading images from: ${copyrightedContentDir}`);
    // Initialize database (creates tables if they don't exist)
    await (0, db_1.initDatabase)();
    // Get all image files
    const imageFiles = getImageFiles(copyrightedContentDir);
    if (imageFiles.length === 0) {
        console.log('No image files found in copyrighted-content directory');
        console.log('Add images (JPEG, PNG, WebP, AVIF) to the copyrighted-content directory and run again');
        await db_1.pool.end();
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
            const processedBuffer = await (0, imageProcessor_1.processImage)(imageBuffer, mimeType);
            // Generate embedding
            const embedding = await (0, embeddingService_1.generateEmbedding)(processedBuffer);
            // Insert into database
            await insertCopyrightedContent(filename, embedding, 'image');
            console.log(`  ✓ Successfully processed and stored: ${filename}`);
            successCount++;
        }
        catch (error) {
            console.error(`  ✗ Error processing ${filename}:`, error instanceof Error ? error.message : error);
            errorCount++;
        }
    }
    console.log('\nSeeding complete!');
    console.log(`  Successful: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
    await db_1.pool.end();
}
// Run the seed script
seed().catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map