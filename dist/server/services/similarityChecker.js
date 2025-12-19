"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findByCelebrityName = findByCelebrityName;
exports.findSimilarContent = findSimilarContent;
exports.determineStatus = determineStatus;
exports.checkSimilarity = checkSimilarity;
const db_1 = require("../db");
// Lower threshold for face-based matching (face embeddings are more discriminative)
const DEFAULT_THRESHOLD = 0.70;
const MAX_RESULTS = 3;
/**
 * Find content by celebrity name match.
 * Searches filenames for celebrity name patterns.
 */
async function findByCelebrityName(celebrityName) {
    if (!celebrityName)
        return [];
    const client = await db_1.pool.connect();
    try {
        // Normalize name for matching (e.g., "Taylor Swift" -> "taylor_swift" or "taylor-swift")
        const nameParts = celebrityName.toLowerCase().split(/\s+/);
        const searchPatterns = nameParts.map(part => `%${part}%`);
        // Build dynamic query for multiple name parts
        const conditions = searchPatterns.map((_, i) => `LOWER(filename) LIKE $${i + 1}`).join(' AND ');
        const result = await client.query(`SELECT id, filename FROM copyrighted_content WHERE ${conditions} LIMIT $${searchPatterns.length + 1}`, [...searchPatterns, MAX_RESULTS]);
        return result.rows.map(row => ({
            id: row.id,
            filename: row.filename,
            similarity: 0.95, // High confidence for name match
            matchType: 'celebrity_name',
        }));
    }
    finally {
        client.release();
    }
}
/**
 * Find similar content in the database using pgvector cosine similarity.
 *
 * @param embedding - Query embedding vector
 * @param threshold - Minimum similarity threshold (default 0.85)
 * @returns Array of matches above threshold, ordered by similarity descending, limited to 3
 */
async function findSimilarContent(embedding, threshold = DEFAULT_THRESHOLD) {
    const client = await db_1.pool.connect();
    try {
        // pgvector uses cosine distance (1 - similarity), so we convert
        // The <=> operator returns cosine distance, we need similarity = 1 - distance
        const vectorString = `[${embedding.join(',')}]`;
        const result = await client.query(`SELECT 
        id,
        filename,
        1 - (embedding <=> $1::vector) as similarity
      FROM copyrighted_content
      WHERE 1 - (embedding <=> $1::vector) > $2
      ORDER BY similarity DESC
      LIMIT $3`, [vectorString, threshold, MAX_RESULTS]);
        return result.rows.map(row => ({
            id: row.id,
            filename: row.filename,
            similarity: row.similarity,
        }));
    }
    finally {
        client.release();
    }
}
/**
 * Determine the status based on similarity matches.
 * Returns "flagged" if any match has similarity > 0.85, otherwise "safe".
 *
 * @param matches - Array of similarity matches
 * @returns "flagged" or "safe"
 */
function determineStatus(matches) {
    if (matches.length === 0) {
        return 'safe';
    }
    const maxSimilarity = Math.max(...matches.map(m => m.similarity));
    return maxSimilarity > DEFAULT_THRESHOLD ? 'flagged' : 'safe';
}
/**
 * Check content for similarity and return status with matches.
 * Combines findSimilarContent and determineStatus for convenience.
 *
 * @param embedding - Query embedding vector
 * @param threshold - Minimum similarity threshold (default 0.85)
 * @returns Object with status and matches
 */
async function checkSimilarity(embedding, threshold = DEFAULT_THRESHOLD) {
    const matches = await findSimilarContent(embedding, threshold);
    const status = determineStatus(matches);
    return { status, matches };
}
//# sourceMappingURL=similarityChecker.js.map