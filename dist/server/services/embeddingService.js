"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingError = void 0;
exports.getEmbeddingDimensions = getEmbeddingDimensions;
exports.generateEmbedding = generateEmbedding;
exports.serializeEmbedding = serializeEmbedding;
exports.deserializeEmbedding = deserializeEmbedding;
const inference_1 = require("@huggingface/inference");
// Embedding dimensions
const CLIP_DIMENSIONS = 512;
const GEMINI_DIMENSIONS = 768;
// Model identifiers
const CLIP_MODEL = 'openai/clip-vit-base-patch32';
class EmbeddingError extends Error {
    constructor(message) {
        super(message);
        this.name = 'EmbeddingError';
    }
}
exports.EmbeddingError = EmbeddingError;
/**
 * Get the expected embedding dimensions based on available API keys.
 * Returns Gemini dimensions (768) if Gemini key is available, otherwise CLIP (512).
 */
function getEmbeddingDimensions(config) {
    const geminiKey = config?.geminiApiKey || process.env.GEMINI_API_KEY;
    if (geminiKey) {
        return GEMINI_DIMENSIONS;
    }
    return CLIP_DIMENSIONS;
}
/**
 * Generate embedding using Hugging Face CLIP API.
 */
async function generateClipEmbedding(imageBuffer, apiKey) {
    const hf = new inference_1.HfInference(apiKey);
    // Convert buffer to base64 for the API
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;
    const response = await hf.featureExtraction({
        model: CLIP_MODEL,
        inputs: dataUrl,
    });
    // Response can be number[] or number[][] - normalize to number[]
    if (Array.isArray(response)) {
        if (Array.isArray(response[0])) {
            return response[0];
        }
        return response;
    }
    throw new EmbeddingError('Unexpected response format from CLIP API');
}
/**
 * Generate a detailed description of an image using Gemini Vision.
 */
async function describeImageWithGemini(imageBuffer, apiKey) {
    const base64Image = imageBuffer.toString('base64');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: 'Describe this image in detail for copyright comparison. Include: main subjects, colors, composition, style, any text visible, distinctive features, and overall mood. Be specific and thorough.',
                        },
                        {
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: base64Image,
                            },
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 500,
            },
        }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new EmbeddingError(`Gemini Vision API error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
        throw new EmbeddingError('No description generated from Gemini Vision');
    }
    return text;
}
/**
 * Generate text embedding using Gemini embedding model.
 */
async function generateTextEmbedding(text, apiKey) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: {
                parts: [{ text }],
            },
        }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new EmbeddingError(`Gemini Embedding API error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    if (!data.embedding?.values || !Array.isArray(data.embedding.values)) {
        throw new EmbeddingError('Unexpected response format from Gemini Embedding API');
    }
    return data.embedding.values;
}
/**
 * Generate embedding using Google Gemini API.
 * Uses a two-step approach: Vision model describes the image, then embedding model creates vector.
 */
async function generateGeminiEmbedding(imageBuffer, apiKey) {
    // Step 1: Get detailed image description using Gemini Vision
    const description = await describeImageWithGemini(imageBuffer, apiKey);
    // Step 2: Generate embedding from the description
    const embedding = await generateTextEmbedding(description, apiKey);
    return embedding;
}
/**
 * Generate a vector embedding from an image buffer.
 * Uses Google Gemini API as primary (Vision + Embedding), with Hugging Face CLIP as fallback.
 *
 * @param imageBuffer - Processed JPEG image buffer
 * @param config - Optional configuration with API keys
 * @returns Vector array (768 dimensions for Gemini, 512 for CLIP)
 * @throws EmbeddingError if both APIs fail or no API keys are configured
 */
async function generateEmbedding(imageBuffer, config) {
    const geminiKey = config?.geminiApiKey || process.env.GEMINI_API_KEY;
    const hfKey = config?.huggingfaceApiKey || process.env.HUGGINGFACE_API_KEY;
    if (!geminiKey && !hfKey) {
        throw new EmbeddingError('No embedding API key configured. Set GEMINI_API_KEY or HUGGINGFACE_API_KEY.');
    }
    // Try Gemini first (primary)
    if (geminiKey) {
        try {
            return await generateGeminiEmbedding(imageBuffer, geminiKey);
        }
        catch (error) {
            // If HF key is available, fall back to it
            if (hfKey) {
                console.warn('Gemini API failed, falling back to CLIP:', error);
            }
            else {
                throw new EmbeddingError(`Gemini embedding failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    // Try Hugging Face CLIP as fallback
    if (hfKey) {
        try {
            return await generateClipEmbedding(imageBuffer, hfKey);
        }
        catch (error) {
            throw new EmbeddingError(`CLIP embedding failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    throw new EmbeddingError('All embedding APIs failed');
}
/**
 * Serialize an embedding vector to JSON string for storage.
 *
 * @param embedding - Vector array of numbers
 * @returns JSON string representation
 */
function serializeEmbedding(embedding) {
    return JSON.stringify(embedding);
}
/**
 * Deserialize a JSON string back to an embedding vector.
 *
 * @param json - JSON string representation of the vector
 * @returns Vector array of numbers
 * @throws EmbeddingError if JSON is invalid or not an array of numbers
 */
function deserializeEmbedding(json) {
    try {
        const parsed = JSON.parse(json);
        if (!Array.isArray(parsed)) {
            throw new EmbeddingError('Deserialized embedding is not an array');
        }
        // Validate all elements are numbers
        for (let i = 0; i < parsed.length; i++) {
            if (typeof parsed[i] !== 'number' || !Number.isFinite(parsed[i])) {
                throw new EmbeddingError(`Invalid embedding element at index ${i}: expected finite number`);
            }
        }
        return parsed;
    }
    catch (error) {
        if (error instanceof EmbeddingError) {
            throw error;
        }
        throw new EmbeddingError(`Failed to deserialize embedding: ${error instanceof Error ? error.message : String(error)}`);
    }
}
//# sourceMappingURL=embeddingService.js.map