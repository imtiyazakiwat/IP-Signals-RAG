# Copyright Detector

An AI-powered content moderation system that detects potential copyright infringement by comparing uploaded media against a database of known copyrighted content using vector embeddings and RAG (Retrieval-Augmented Generation) approach.

## 🎯 Overview

This system accepts uploads of images (JPEG, PNG, WebP, AVIF) and short videos (MP4), processes them, generates vector embeddings using Google Gemini API, and checks similarity against a PostgreSQL database with pgvector extension.

**Key Features:**
- AVIF image support with automatic conversion
- Video frame extraction (5 key frames at 10%, 30%, 50%, 70%, 90% timestamps)
- Vector similarity search using cosine distance
- 85% similarity threshold for flagging potential infringement
- Simple Next.js frontend for testing

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ARCHITECTURE FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────────────────────────────────────────────┐
│   Next.js    │     │                  Express.js Backend                  │
│   Frontend   │     │                                                      │
│              │     │  ┌─────────────┐   ┌─────────────┐   ┌───────────┐  │
│  ┌────────┐  │     │  │   Image     │   │  Embedding  │   │Similarity │  │
│  │ Upload │──┼────►│  │  Processor  │──►│   Service   │──►│  Checker  │  │
│  │  Form  │  │POST │  │   (Sharp)   │   │  (Gemini)   │   │           │  │
│  └────────┘  │/upload│ └─────────────┘   └─────────────┘   └─────┬─────┘  │
│              │     │                                             │        │
│  ┌────────┐  │     │  ┌─────────────┐                            │        │
│  │Results │◄─┼─────│  │   Video     │                            ▼        │
│  │Display │  │JSON │  │  Processor  │──►  (same flow)    ┌─────────────┐  │
│  └────────┘  │     │  │  (FFmpeg)   │                    │ PostgreSQL  │  │
│              │     │  └─────────────┘                    │ + pgvector  │  │
└──────────────┘     │                                     │             │  │
                     │                                     │ cosine      │  │
                     │                                     │ similarity  │  │
                     └─────────────────────────────────────┴─────────────┴──┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              PROCESSING FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

  Upload          Process           Embed            Search           Result
    │                │                │                │                │
    ▼                ▼                ▼                ▼                ▼
┌───────┐      ┌──────────┐     ┌──────────┐    ┌──────────┐     ┌──────────┐
│ Image │─────►│ Resize   │────►│ Gemini   │───►│ pgvector │────►│ flagged  │
│  or   │      │ Convert  │     │ Embedding│    │ Cosine   │     │   or     │
│ Video │      │ Extract  │     │   API    │    │ Search   │     │  safe    │
└───────┘      └──────────┘     └──────────┘    └──────────┘     └──────────┘
                   │                                                   │
                   │ AVIF→JPEG                                        │
                   │ MP4→5 frames                                     │
                   │ Max 512x512                                      │
                   ▼                                                   ▼
              768-dim vector ──────────────────────────────► >85% = flagged
```

## 🛠️ Tech Stack

| Component | Technology | Why |
|-----------|------------|-----|
| Backend | Express.js + TypeScript | Fast, lightweight, familiar ecosystem |
| Image Processing | Sharp | Native AVIF support, excellent performance |
| Video Processing | FFmpeg (fluent-ffmpeg) | Industry standard, reliable frame extraction |
| Embeddings | Google Gemini API | Multimodal support, generous free tier |
| Vector DB | PostgreSQL + pgvector | Production-ready, HNSW index for fast search |
| Frontend | Next.js 14 + Tailwind | Quick to build, good DX |
| Container | Docker + docker-compose | Consistent environments, easy setup |

## 📁 Project Structure

```
├── server/
│   ├── index.ts              # Express server entry
│   ├── db/index.ts           # PostgreSQL + pgvector setup
│   ├── routes/upload.ts      # POST /upload endpoint
│   ├── services/
│   │   ├── imageProcessor.ts # Sharp image processing
│   │   ├── videoProcessor.ts # FFmpeg frame extraction
│   │   ├── embeddingService.ts # Gemini embedding generation
│   │   └── similarityChecker.ts # pgvector cosine search
│   └── scripts/seed.ts       # Database seeding script
├── client/                   # Next.js frontend
├── copyrighted-content/      # Sample copyrighted images (10-20)
├── test-uploads/             # Test files (AVIF, MP4)
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Gemini API Key (get from https://makersuite.google.com/app/apikey)

### 1. Clone and Setup
```bash
git clone <repo-url>
cd copyright-detector

# Install dependencies
npm install
cd client && npm install && cd ..

# Create .env file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 2. Start with Docker
```bash
# Start PostgreSQL with pgvector
docker-compose up db -d

# Wait for DB to be ready, then seed with sample images
npm run seed

# Start the backend server
npm run dev
```

### 3. Start Frontend (separate terminal)
```bash
cd client
npm run dev
```

### 4. Test
- Open http://localhost:3000
- Upload an image or video
- View results (flagged/safe with similarity scores)

## 📊 API Reference

### POST /upload

Upload a file to check for copyright infringement.

**Request:**
```
Content-Type: multipart/form-data
Body: file (image or video)
```

**Response:**
```json
{
  "status": "flagged" | "safe",
  "matches": [
    { "filename": "sample1.jpg", "similarity": "92.5%" }
  ],
  "processingTime": 3.2
}
```

## ⚡ Performance

| Operation | Time |
|-----------|------|
| Image processing (AVIF→JPEG, resize) | ~50-100ms |
| Single embedding generation (Gemini) | ~500-800ms |
| pgvector similarity search | ~5-20ms |
| **Total image upload** | **~1-2 seconds** |
| Video frame extraction (30s video) | ~2-3 seconds |
| **Total video upload (5 frames)** | **~4-6 seconds** |

*Tested on MacBook Pro M1, results may vary based on network latency to Gemini API.*

## 🔧 Challenges & Solutions

### 1. AVIF Support
**Challenge:** Many image processing libraries don't support AVIF natively.
**Solution:** Sharp v0.32+ has built-in AVIF support via libvips. No extra configuration needed.

### 2. Video Frame Extraction
**Challenge:** Node.js doesn't have native video processing.
**Solution:** FFmpeg via fluent-ffmpeg wrapper. Dockerized to ensure FFmpeg availability.

### 3. Embedding Consistency
**Challenge:** Different embedding models produce different dimensions.
**Solution:** Standardized on Gemini (768 dimensions). Database schema uses `VECTOR(768)`.

### 4. Similarity Search Performance
**Challenge:** Linear scan of embeddings is slow at scale.
**Solution:** pgvector HNSW index for approximate nearest neighbor search (sub-linear time).

## 🌩️ GCP Deployment Architecture

For production deployment on Google Cloud Platform:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GCP PRODUCTION ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────────┐
                                    │   Cloud      │
                                    │   Storage    │
                                    │  (uploads)   │
                                    └──────┬───────┘
                                           │
┌──────────┐    ┌──────────────┐    ┌──────▼───────┐    ┌──────────────┐
│  Users   │───►│ Cloud Load   │───►│  Cloud Run   │───►│  Cloud SQL   │
│          │    │  Balancer    │    │  (Backend)   │    │ PostgreSQL   │
└──────────┘    └──────────────┘    └──────┬───────┘    │ + pgvector   │
                                           │            └──────────────┘
                                    ┌──────▼───────┐
                                    │   Pub/Sub    │ (async processing)
                                    │    Queue     │
                                    └──────┬───────┘
                                           │
                                    ┌──────▼───────┐
                                    │  Cloud Run   │
                                    │   Workers    │
                                    │ (processing) │
                                    └──────────────┘

Components:
- Cloud Run: Serverless containers for API and workers (auto-scaling)
- Cloud SQL: Managed PostgreSQL with pgvector extension
- Cloud Storage: Store uploaded files and processed frames
- Pub/Sub: Queue for async video processing (decouple upload from processing)
- Cloud Load Balancer: HTTPS termination, global distribution

Scaling Strategy:
- Cloud Run scales to 0 when idle (cost-effective)
- Pub/Sub handles burst uploads by queuing
- Cloud SQL can scale vertically or use read replicas
- Estimated cost: ~$50-100/month for moderate traffic
```

## 🔮 Future Improvements

With more time, I would add:

1. **Audio fingerprinting** - Extend to audio/music copyright detection
2. **Batch processing** - Upload multiple files at once
3. **Caching layer** - Redis for frequently checked content
4. **Admin dashboard** - Manage copyrighted content database
5. **Webhook notifications** - Alert when infringement detected
6. **Rate limiting** - Prevent API abuse
7. **LangChain integration** - Generate natural language explanations for matches

## 📝 License

MIT
