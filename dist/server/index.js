"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const db_1 = require("./db");
const upload_1 = __importDefault(require("./routes/upload"));
const imageProcessor_1 = require("./services/imageProcessor");
const videoProcessor_1 = require("./services/videoProcessor");
const embeddingService_1 = require("./services/embeddingService");
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 3001;
// Middleware
app.use(express_1.default.json());
// Routes
app.use('/upload', upload_1.default);
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error('Error:', err);
    // Handle unsupported format errors (400)
    if (err instanceof imageProcessor_1.UnsupportedFormatError) {
        res.status(400).json({
            error: 'Unsupported format',
            details: err.message,
        });
        return;
    }
    // Handle video processing errors (500)
    if (err instanceof videoProcessor_1.VideoProcessingError) {
        res.status(500).json({
            error: 'Video processing failed',
            details: err.message,
        });
        return;
    }
    // Handle embedding errors - check for rate limits (429)
    if (err instanceof embeddingService_1.EmbeddingError) {
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
        await (0, db_1.initDatabase)();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=index.js.map