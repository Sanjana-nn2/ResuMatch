-- ResuMatch PostgreSQL Database Schema
-- Production-ready schema with UUID primary keys, foreign keys, constraints, and optimized indexes.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (Authentication & Profile)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Resumes table (Parsed documents and raw text)
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(50), -- 'pdf', 'docx', 'text'
    raw_text TEXT NOT NULL,
    parsed_skills JSONB DEFAULT '[]'::jsonb,
    is_sample BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON resumes(created_at DESC);

-- 3. Job Descriptions table
CREATE TABLE IF NOT EXISTS job_descriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    company VARCHAR(150),
    raw_text TEXT NOT NULL,
    parsed_skills JSONB DEFAULT '[]'::jsonb,
    is_sample BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_descriptions_user_id ON job_descriptions(user_id);

-- 4. Analyses table (Comparison results, gap analysis, embeddings match, interview prep)
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
    comparison_resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL, -- for resume version comparison (v1 vs v2)
    job_description_id UUID REFERENCES job_descriptions(id) ON DELETE SET NULL,
    match_score NUMERIC(5, 2) NOT NULL, -- e.g. 78.50%
    comparison_score NUMERIC(5, 2), -- score of v2 if comparing
    score_delta NUMERIC(5, 2), -- e.g. +14.20%
    matched_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    actionable_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
    interview_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    latency_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_score ON analyses(match_score);

-- 5. Observability / Telemetry logs (for Admin system observability)
CREATE TABLE IF NOT EXISTS telemetry_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry_logs(timestamp DESC);
