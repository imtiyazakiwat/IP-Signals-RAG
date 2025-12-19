import { pool } from '../db';

export interface SimilarityMatch {
  id: number;
  filename: string;
  similarity: number;
  matchType?: 'embedding' | 'celebrity_name';
}

export type ContentStatus = 'flagged' | 'safe';

export interface SimilarityResult {
  status: ContentStatus;
  matches: SimilarityMatch[];
}

// Higher threshold to reduce false positives (like Dhoni matching Virat)
// Only flag when we're very confident it's the same person
const DEFAULT_THRESHOLD = 0.85;
const MAX_RESULTS = 3;

/**
 * Find content by celebrity name match.
 * Searches filenames for celebrity name patterns.
 * Returns only DISTINCT matches.
 */
export async function findByCelebrityName(
  celebrityName: string
): Promise<SimilarityMatch[]> {
  if (!celebrityName) return [];

  const client = await pool.connect();

  try {
    // Normalize name for matching
    const nameParts = celebrityName
      .toLowerCase()
      .split(/\s+/)
      .filter((p) => p.length > 2);
    if (nameParts.length === 0) return [];

    // Use the most distinctive part of the name (usually last name)
    const searchTerm =
      nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];

    const result = await client.query<{
      id: number;
      filename: string;
    }>(
      `SELECT DISTINCT id, filename 
       FROM copyrighted_content 
       WHERE LOWER(filename) LIKE $1 
       LIMIT $2`,
      [`%${searchTerm}%`, MAX_RESULTS]
    );

    return result.rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      similarity: 0.95, // High confidence for name match
      matchType: 'celebrity_name' as const,
    }));
  } finally {
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
export async function findSimilarContent(
  embedding: number[],
  threshold: number = DEFAULT_THRESHOLD
): Promise<SimilarityMatch[]> {
  const client = await pool.connect();

  try {
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

    return result.rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      similarity: row.similarity,
      matchType: 'embedding' as const,
    }));
  } finally {
    client.release();
  }
}

/**
 * Determine the status based on similarity matches.
 * Returns "flagged" if any match has similarity > threshold, otherwise "safe".
 */
export function determineStatus(matches: SimilarityMatch[]): ContentStatus {
  if (matches.length === 0) {
    return 'safe';
  }

  const maxSimilarity = Math.max(...matches.map((m) => m.similarity));
  return maxSimilarity > DEFAULT_THRESHOLD ? 'flagged' : 'safe';
}

/**
 * Check content for similarity and return status with matches.
 */
export async function checkSimilarity(
  embedding: number[],
  threshold: number = DEFAULT_THRESHOLD
): Promise<SimilarityResult> {
  const matches = await findSimilarContent(embedding, threshold);
  const status = determineStatus(matches);

  return { status, matches };
}
