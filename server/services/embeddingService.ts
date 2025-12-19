import { HfInference } from '@huggingface/inference';

// Embedding dimensions
const CLIP_DIMENSIONS = 512;
const GEMINI_DIMENSIONS = 768;

// Model identifiers
const CLIP_MODEL = 'openai/clip-vit-base-patch32';

export class EmbeddingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmbeddingError';
  }
}

export interface EmbeddingConfig {
  huggingfaceApiKey?: string;
  geminiApiKey?: string;
}

/**
 * Get the expected embedding dimensions based on available API keys.
 * Returns Gemini dimensions (768) if Gemini key is available, otherwise CLIP (512).
 */
export function getEmbeddingDimensions(config?: EmbeddingConfig): number {
  const geminiKey = config?.geminiApiKey || process.env.GEMINI_API_KEY;
  if (geminiKey) {
    return GEMINI_DIMENSIONS;
  }
  return CLIP_DIMENSIONS;
}

/**
 * Generate embedding using Hugging Face CLIP API.
 */
async function generateClipEmbedding(
  imageBuffer: Buffer,
  apiKey: string
): Promise<number[]> {
  const hf = new HfInference(apiKey);
  
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
      return response[0] as number[];
    }
    return response as number[];
  }
  
  throw new EmbeddingError('Unexpected response format from CLIP API');
}

/**
 * Enhanced face-focused prompt for highly accurate person identification.
 * Creates a biometric-style fingerprint that remains consistent across different photos.
 */
const FACE_IDENTIFICATION_PROMPT = `You are an expert biometric facial analysis system. Your task is to create a CONSISTENT facial identity signature that will match the SAME PERSON across different photos, regardless of:
- Different clothing or accessories
- Different backgrounds or settings  
- Different poses, angles, or expressions
- Different lighting or image quality
- Different ages (within reason)

CRITICAL: Focus ONLY on PERMANENT, UNCHANGEABLE facial structure.

STEP 1 - CELEBRITY IDENTIFICATION (MOST IMPORTANT):
If this person is a celebrity, public figure, athlete, actor, musician, politician, or any recognizable person, you MUST identify them by their FULL NAME. This is the primary identification method.

Known celebrities to look for include but are not limited to:
- Bollywood: Shah Rukh Khan, Amitabh Bachchan, Virat Kohli
- Hollywood: Johnny Depp, Taylor Swift, Dua Lipa
- Sports: Lionel Messi, Cristiano Ronaldo
- Tech: Elon Musk
- And any other recognizable public figure

STEP 2 - BIOMETRIC FACIAL SIGNATURE:
Analyze these PERMANENT bone structure and genetic features:

SKULL STRUCTURE:
- Overall face shape (oval/round/square/heart/oblong/diamond)
- Face length-to-width ratio
- Facial symmetry patterns

UPPER FACE:
- Forehead height and curvature
- Brow ridge prominence
- Hairline shape and position
- Temple width

EYE REGION:
- Eye shape (almond/round/hooded/monolid/downturned/upturned)
- Eye size relative to face
- Inter-eye distance (close-set/average/wide-set)
- Eye color
- Orbital bone structure

NOSE:
- Bridge height and width
- Nose length
- Tip shape (bulbous/pointed/upturned/downturned)
- Nostril shape and size
- Nose-to-face proportion

MOUTH REGION:
- Lip fullness (thin/medium/full)
- Lip shape and cupid's bow
- Mouth width
- Philtrum length and shape

LOWER FACE:
- Cheekbone prominence and position
- Jawline shape (angular/rounded/square)
- Chin shape (pointed/rounded/square/cleft)
- Jaw width

DISTINCTIVE MARKERS:
- Permanent moles, birthmarks, scars
- Dimples (cheek/chin)
- Cleft chin
- Unique asymmetries

OUTPUT FORMAT (use exactly this format):
CELEBRITY: [Full name if recognized, "Unknown" if not a public figure]
BIOMETRIC_SIGNATURE: [Detailed description using ONLY the permanent features above, written as a continuous identifying description that would match this same person in any photo]`;


/**
 * Generate a detailed description of an image using Gemini Vision.
 * Uses a face-focused prompt to capture permanent identifying features.
 */
async function describeImageWithGemini(
  imageBuffer: Buffer,
  apiKey: string
): Promise<string> {
  const base64Image = imageBuffer.toString('base64');
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
    {
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
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new EmbeddingError(`Gemini Vision API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };
  
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new EmbeddingError('No description generated from Gemini Vision');
  }
  
  return text;
}

/**
 * Extract celebrity name from Gemini response if identified.
 * Handles various response formats and cleans up the name.
 */
export function extractCelebrityName(description: string): string | null {
  // Try multiple patterns to extract celebrity name
  const patterns = [
    /CELEBRITY:\s*([^\n]+)/i,
    /IDENTITY:\s*([^\n]+)/i,
    /NAME:\s*([^\n]+)/i,
    /This is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/,
    /recognized as\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      let name = match[1].trim();
      // Remove common suffixes/noise
      name = name.replace(/[.,;:!?]$/, '').trim();
      name = name.replace(/\s*\(.*?\)\s*/g, '').trim();
      
      // Validate it's a real name (not "Unknown", "None", etc.)
      const invalidNames = ['unknown', 'none', 'not recognized', 'unidentified', 'n/a', 'not a celebrity'];
      if (name.length > 2 && !invalidNames.includes(name.toLowerCase())) {
        return name;
      }
    }
  }
  return null;
}

/**
 * Generate text embedding using Gemini embedding model.
 */
async function generateTextEmbedding(
  text: string,
  apiKey: string
): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
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
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new EmbeddingError(`Gemini Embedding API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json() as { embedding?: { values?: number[] } };
  
  if (!data.embedding?.values || !Array.isArray(data.embedding.values)) {
    throw new EmbeddingError('Unexpected response format from Gemini Embedding API');
  }
  
  return data.embedding.values;
}

/**
 * Generate embedding using Google Gemini API.
 * Uses a two-step approach: Vision model describes the image, then embedding model creates vector.
 */
async function generateGeminiEmbedding(
  imageBuffer: Buffer,
  apiKey: string
): Promise<number[]> {
  // Step 1: Get detailed image description using Gemini Vision
  const description = await describeImageWithGemini(imageBuffer, apiKey);
  
  // Step 2: Generate embedding from the description
  const embedding = await generateTextEmbedding(description, apiKey);
  
  return embedding;
}

/**
 * Generate embedding AND return the description (for celebrity name extraction).
 */
async function generateGeminiEmbeddingWithDescription(
  imageBuffer: Buffer,
  apiKey: string
): Promise<{ embedding: number[]; description: string }> {
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
export async function generateEmbedding(
  imageBuffer: Buffer,
  config?: EmbeddingConfig
): Promise<number[]> {
  const geminiKey = config?.geminiApiKey || process.env.GEMINI_API_KEY;
  const hfKey = config?.huggingfaceApiKey || process.env.HUGGINGFACE_API_KEY;
  
  if (!geminiKey && !hfKey) {
    throw new EmbeddingError(
      'No embedding API key configured. Set GEMINI_API_KEY or HUGGINGFACE_API_KEY.'
    );
  }
  
  // Try Gemini first (primary)
  if (geminiKey) {
    try {
      return await generateGeminiEmbedding(imageBuffer, geminiKey);
    } catch (error) {
      // If HF key is available, fall back to it
      if (hfKey) {
        console.warn('Gemini API failed, falling back to CLIP:', error);
      } else {
        throw new EmbeddingError(
          `Gemini embedding failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }
  
  // Try Hugging Face CLIP as fallback
  if (hfKey) {
    try {
      return await generateClipEmbedding(imageBuffer, hfKey);
    } catch (error) {
      throw new EmbeddingError(
        `CLIP embedding failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  throw new EmbeddingError('All embedding APIs failed');
}

/**
 * Generate embedding AND return description for celebrity name extraction.
 * This is used when we need both the embedding and the raw description.
 */
export async function generateEmbeddingWithDescription(
  imageBuffer: Buffer,
  config?: EmbeddingConfig
): Promise<{ embedding: number[]; description: string }> {
  const geminiKey = config?.geminiApiKey || process.env.GEMINI_API_KEY;
  
  if (!geminiKey) {
    // Fall back to regular embedding without description
    const embedding = await generateEmbedding(imageBuffer, config);
    return { embedding, description: '' };
  }
  
  try {
    return await generateGeminiEmbeddingWithDescription(imageBuffer, geminiKey);
  } catch (error) {
    throw new EmbeddingError(
      `Gemini embedding failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Serialize an embedding vector to JSON string for storage.
 * 
 * @param embedding - Vector array of numbers
 * @returns JSON string representation
 */
export function serializeEmbedding(embedding: number[]): string {
  return JSON.stringify(embedding);
}

/**
 * Deserialize a JSON string back to an embedding vector.
 * 
 * @param json - JSON string representation of the vector
 * @returns Vector array of numbers
 * @throws EmbeddingError if JSON is invalid or not an array of numbers
 */
export function deserializeEmbedding(json: string): number[] {
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
  } catch (error) {
    if (error instanceof EmbeddingError) {
      throw error;
    }
    throw new EmbeddingError(
      `Failed to deserialize embedding: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
