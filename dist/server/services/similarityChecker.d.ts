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
/**
 * Find content by celebrity name match.
 * Searches filenames for celebrity name patterns.
 */
export declare function findByCelebrityName(celebrityName: string): Promise<SimilarityMatch[]>;
/**
 * Find similar content in the database using pgvector cosine similarity.
 *
 * @param embedding - Query embedding vector
 * @param threshold - Minimum similarity threshold (default 0.85)
 * @returns Array of matches above threshold, ordered by similarity descending, limited to 3
 */
export declare function findSimilarContent(embedding: number[], threshold?: number): Promise<SimilarityMatch[]>;
/**
 * Determine the status based on similarity matches.
 * Returns "flagged" if any match has similarity > 0.85, otherwise "safe".
 *
 * @param matches - Array of similarity matches
 * @returns "flagged" or "safe"
 */
export declare function determineStatus(matches: SimilarityMatch[]): ContentStatus;
/**
 * Check content for similarity and return status with matches.
 * Combines findSimilarContent and determineStatus for convenience.
 *
 * @param embedding - Query embedding vector
 * @param threshold - Minimum similarity threshold (default 0.85)
 * @returns Object with status and matches
 */
export declare function checkSimilarity(embedding: number[], threshold?: number): Promise<SimilarityResult>;
//# sourceMappingURL=similarityChecker.d.ts.map