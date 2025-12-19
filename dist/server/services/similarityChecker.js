"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSimilarContent = findSimilarContent;
exports.determineStatus = determineStatus;
exports.checkSimilarity = checkSimilarity;
const db_1 = require("../db");
const DEFAULT_THRESHOLD = 0.85;
const MAX_RESULTS = 3;
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