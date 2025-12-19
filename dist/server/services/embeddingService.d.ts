export declare class EmbeddingError extends Error {
    constructor(message: string);
}
export interface EmbeddingConfig {
    huggingfaceApiKey?: string;
    geminiApiKey?: string;
}
/**
 * Get the expected embedding dimensions based on available API keys.
 * Returns Gemini dimensions (768) if Gemini key is available, otherwise CLIP (512).
 */
export declare function getEmbeddingDimensions(config?: EmbeddingConfig): number;
/**
 * Extract celebrity name from Gemini response if identified.
 */
export declare function extractCelebrityName(description: string): string | null;
/**
 * Generate a vector embedding from an image buffer.
 * Uses Google Gemini API as primary (Vision + Embedding), with Hugging Face CLIP as fallback.
 *
 * @param imageBuffer - Processed JPEG image buffer
 * @param config - Optional configuration with API keys
 * @returns Vector array (768 dimensions for Gemini, 512 for CLIP)
 * @throws EmbeddingError if both APIs fail or no API keys are configured
 */
export declare function generateEmbedding(imageBuffer: Buffer, config?: EmbeddingConfig): Promise<number[]>;
/**
 * Generate embedding AND return description for celebrity name extraction.
 * This is used when we need both the embedding and the raw description.
 */
export declare function generateEmbeddingWithDescription(imageBuffer: Buffer, config?: EmbeddingConfig): Promise<{
    embedding: number[];
    description: string;
}>;
/**
 * Serialize an embedding vector to JSON string for storage.
 *
 * @param embedding - Vector array of numbers
 * @returns JSON string representation
 */
export declare function serializeEmbedding(embedding: number[]): string;
/**
 * Deserialize a JSON string back to an embedding vector.
 *
 * @param json - JSON string representation of the vector
 * @returns Vector array of numbers
 * @throws EmbeddingError if JSON is invalid or not an array of numbers
 */
export declare function deserializeEmbedding(json: string): number[];
//# sourceMappingURL=embeddingService.d.ts.map