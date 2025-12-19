"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingError = void 0;
exports.getEmbeddingDimensions = getEmbeddingDimensions;
exports.extractCelebrityName = extractCelebrityName;
exports.generateEmbedding = generateEmbedding;
exports.generateEmbeddingWithDescription = generateEmbeddingWithDescription;
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
 * Face-focused prompt for person identification.
 * Ignores clothing, background, pose - focuses ONLY on permanent facial features.
 */
const FACE_IDENTIFICATION_PROMPT = `FACE IDENTIFICATION TASK - IGNORE EVERYTHING EXCEPT THE FACE.

You are a facial recognition system. Analyze ONLY the face in this image.

COMPLETELY IGNORE:
- Clothing, accessories, jewelry
- Background, location, setting
- Pose, camera angle, lighting
- Image quality, filters

ANALYZE ONLY THESE PERMANENT FACIAL FEATURES:
1. IDENTITY: If this is a celebrity or public figure, state their FULL NAME first
2. FACE SHAPE: oval, round, square, heart, oblong
3. FOREHEAD: height, width, hairline shape
4. EYEBROWS: shape, thickness, arch, spacing
5. EYES: shape (almond, round, hooded), size, spacing, color
6. NOSE: length, width, bridge shape, tip shape, nostril size
7. CHEEKBONES: prominence, position
8. LIPS: fullness, shape, cupid's bow
9. JAW & CHIN: jawline shape, chin prominence, width
10. EARS: size, shape, position (if visible)
11. SKIN: tone, texture, any permanent marks (moles, scars, birthmarks)
12. FACIAL HAIR: beard/mustache pattern (if any)
13. DISTINCTIVE FEATURES: dimples, cleft chin, unique characteristics

Output format:
CELEBRITY: [Name if recognized, otherwise "Unknown"]
FACE_FINGERPRINT: [Detailed description of permanent facial features only]`;
/**
 * Generate a detailed description of an image using Gemini Vision.
 * Uses a face-focused prompt to capture permanent identifying features.
 */
async function describeImageWithGemini(imageBuffer, apiKey) {
    const base64Image = imageBuffer.toString('base64');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: FACE_IDENTIFICATION_PROMPT,
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
                maxOutputTokens: 600,
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
 * Extract celebrity name from Gemini response if identified.
 */
function extractCelebrityName(description) {
    const match = description.match(/CELEBRITY:\s*([^\n]+)/i);
    if (match && match[1]) {
        const name = match[1].trim();
        if (name.toLowerCase() !== 'unknown' && name.toLowerCase() !== 'none' && name.length > 2) {
            return name;
        }
    }
    return null;
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
 * Generate embedding AND return the description (for celebrity name extraction).
 */
async function generateGeminiEmbeddingWithDescription(imageBuffer, apiKey) {
    const description = await describeImageWithGemini(imageBuffer, apiKey);
    const embedding = await generateTextEmbedding(description, apiKey);
    return { embedding, description };
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
 * Generate embedding AND return description for celebrity name extraction.
 * This is used when we need both the embedding and the raw description.
 */
async function generateEmbeddingWithDescription(imageBuffer, config) {
    const geminiKey = config?.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!geminiKey) {
        // Fall back to regular embedding without description
        const embedding = await generateEmbedding(imageBuffer, config);
        return { embedding, description: '' };
    }
    try {
        return await generateGeminiEmbeddingWithDescription(imageBuffer, geminiKey);
    }
    catch (error) {
        throw new EmbeddingError(`Gemini embedding failed: ${error instanceof Error ? error.message : String(error)}`);
    }
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