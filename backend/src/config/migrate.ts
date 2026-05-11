import { query } from './database';
import dotenv from 'dotenv';

dotenv.config();

const migrate = async () => {
  console.log('Running database migrations...');

  try {
    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Polls table
    await query(`
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

    // Questions table
    await query(`
      CREATE TABLE IF NOT EXISTS questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        is_mandatory BOOLEAN DEFAULT true,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Options table
    await query(`
      CREATE TABLE IF NOT EXISTS options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        text VARCHAR(500) NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Responses table
    await query(`
      CREATE TABLE IF NOT EXISTS responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
        respondent_id UUID REFERENCES users(id) ON DELETE SET NULL,
        submitted_at TIMESTAMPTZ DEFAULT NOW(),
        ip_address VARCHAR(45)
      )
    `);

    // Answers table
    await query(`
      CREATE TABLE IF NOT EXISTS answers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        option_id UUID NOT NULL REFERENCES options(id) ON DELETE CASCADE,
        UNIQUE(response_id, question_id)
      )
    `);

    // Indexes for performance
    await query(`CREATE INDEX IF NOT EXISTS idx_polls_creator ON polls(creator_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_polls_public_link ON polls(public_link)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_questions_poll ON questions(poll_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_options_question ON options(question_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_responses_poll ON responses(poll_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_answers_response ON answers(response_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id)`);

    // Updated_at trigger function
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    await query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    await query(`
      DROP TRIGGER IF EXISTS update_polls_updated_at ON polls;
      CREATE TRIGGER update_polls_updated_at
        BEFORE UPDATE ON polls
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    console.log('✅ Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
