"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.initDatabase = initDatabase;
exports.closePool = closePool;
const pg_1 = require("pg");
const poolConfig = {
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/copyright_detector',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
exports.pool = new pg_1.Pool(poolConfig);
async function initDatabase() {
    const client = await exports.pool.connect();
    try {
        // Enable pgvector extension
        await client.query('CREATE EXTENSION IF NOT EXISTS vector');
        // Create copyrighted_content table with VECTOR column
        await client.query(`
      CREATE TABLE IF NOT EXISTS copyrighted_content (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        embedding VECTOR(768) NOT NULL,
        content_type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
        // Create HNSW index on embedding column for fast similarity search
        await client.query(`
      CREATE INDEX IF NOT EXISTS embedding_idx 
      ON copyrighted_content 
      USING hnsw (embedding vector_cosine_ops)
    `);
        console.log('Database initialized successfully');
    }
    finally {
        client.release();
    }
}
async function closePool() {
    await exports.pool.end();
}
//# sourceMappingURL=index.js.map