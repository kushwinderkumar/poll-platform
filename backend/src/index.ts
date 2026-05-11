import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { initSocket } from './socket/socketManager';
import authRoutes from './routes/authRoutes';
import pollRoutes from './routes/pollRoutes';
import { errorHandler, notFound } from './middleware/errorHandler';
import { query } from './config/database';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Health check
app.get('/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'poll-platform-api' });
  } catch {
    res.status(503).json({ status: 'error', message: 'Database unavailable' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);

// 404 & Error handlers
app.use(notFound);
app.use(errorHandler);

// Auto-run migrations on startup
const runMigrations = async () => {
  const { default: pool } = await import('./config/database');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS polls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        is_anonymous BOOLEAN DEFAULT false,
        expires_at TIMESTAMPTZ,
        is_published BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        public_link VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        is_mandatory BOOLEAN DEFAULT true,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        text VARCHAR(500) NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
        respondent_id UUID REFERENCES users(id) ON DELETE SET NULL,
        submitted_at TIMESTAMPTZ DEFAULT NOW(),
        ip_address VARCHAR(45)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS answers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        option_id UUID NOT NULL REFERENCES options(id) ON DELETE CASCADE,
        UNIQUE(response_id, question_id)
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_polls_creator ON polls(creator_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_polls_public_link ON polls(public_link)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_questions_poll ON questions(poll_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_options_question ON options(question_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_responses_poll ON responses(poll_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_answers_response ON answers(response_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id)`);
    console.log('✅ Database schema ready');
  } catch (err) {
    console.error('❌ Migration error:', err);
  }
};

const PORT = parseInt(process.env.PORT || '5000', 10);

const start = async () => {
  await runMigrations();
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  });
};

start().catch(console.error);

export default app;
