import { pool } from '../db';

export interface SimilarityMatch {
  id: number;
  filename: string;
  similarity: number;
}

export type ContentStatus = 'flagged' | 'safe';

export interface SimilarityResult {
  status: ContentStatus;
  matches: SimilarityMatch[];
}

const DEFAULT_THRESHOLD = 0.85;
const MAX_RESULTS = 3;

/**
 * Find similar content in the database using pgvector cosine similarity.
 * 
 * @param embedding - Query embedding vector
 * @param threshold - Minimum similarity threshold (default 0.85)
 * @returns Array of matches above threshold, ordered by similarity descending, limited to 3
 */
export async function findSimilarContent(
  embedding: number[],
  threshold: number = DEFAULT_THRESHOLD
): Promise<SimilarityMatch[]> {
  const client = await pool.connect();
  
  try {
    // pgvector uses cosine distance (1 - similarity), so we convert
    // The <=> operator returns cosine distance, we need similarity = 1 - distance
    const vectorString = `[${embedding.join(',')}]`;
    
    const result = await client.query<{
      id: number;
      filename: string;
      similarity: number;
    }>(
      `SELECT 
        id,
        filename,
        1 - (embedding <=> $1::vector) as similarity
      FROM copyrighted_content
      WHERE 1 - (embedding <=> $1::vector) > $2
      ORDER BY similarity DESC
      LIMIT $3`,
      [vectorString, threshold, MAX_RESULTS]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      filename: row.filename,
      similarity: row.similarity,
    }));
  } finally {
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
export function determineStatus(matches: SimilarityMatch[]): ContentStatus {
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
export async function checkSimilarity(
  embedding: number[],
  threshold: number = DEFAULT_THRESHOLD
): Promise<SimilarityResult> {
  const matches = await findSimilarContent(embedding, threshold);
  const status = determineStatus(matches);
  
  return { status, matches };
}
