import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { initDatabase } from './db';
import uploadRouter from './routes/upload';
import { UnsupportedFormatError } from './services/imageProcessor';
import { VideoProcessingError } from './services/videoProcessor';
import { EmbeddingError } from './services/embeddingService';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Routes
app.use('/upload', uploadRouter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  
  // Handle unsupported format errors (400)
  if (err instanceof UnsupportedFormatError) {
    res.status(400).json({
      error: 'Unsupported format',
      details: err.message,
    });
    return;
  }
  
  // Handle video processing errors (500)
  if (err instanceof VideoProcessingError) {
    res.status(500).json({
      error: 'Video processing failed',
      details: err.message,
    });
    return;
  }
  
  // Handle embedding errors - check for rate limits (429)
  if (err instanceof EmbeddingError) {
    const message = err.message.toLowerCase();
    if (message.includes('rate limit') || message.includes('429') || message.includes('too many')) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        details: 'Please try again later',
      });
      return;
    }
    
    res.status(500).json({
      error: 'Embedding generation failed',
      details: err.message,
    });
    return;
  }
  
  // Handle multer errors
  if (err.name === 'MulterError') {
    res.status(400).json({
      error: 'Upload error',
      details: err.message,
    });
    return;
  }
  
  // Generic server error
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

// Start server
async function start() {
  try {
    // Initialize database
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export { app };
