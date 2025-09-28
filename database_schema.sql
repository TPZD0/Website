-- Study Partner Database Schema
-- Run this script to create the necessary tables

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    tel VARCHAR(20),
    -- Email verification fields
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create pdf_files table
CREATE TABLE IF NOT EXISTS pdf_files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    summary TEXT,
    summary_generated_at TIMESTAMP
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz_sessions table to store quiz attempts
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    file_id INTEGER REFERENCES pdf_files(id) ON DELETE CASCADE,
    quiz_data JSONB NOT NULL, -- Store the complete quiz questions and answers
    user_answers JSONB, -- Store user's answers
    score INTEGER, -- Score out of total questions
    total_questions INTEGER NOT NULL,
    difficulty VARCHAR(10) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_pdf_files_user_id ON pdf_files(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_files_uploaded_at ON pdf_files(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_due_date ON goals(due_date);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_file_id ON quiz_sessions(file_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_created_at ON quiz_sessions(created_at);

-- For existing deployments, ensure new columns exist on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP;

-- Insert a test user (password is 'testpassword123')
-- You can use this to test the login functionality
INSERT INTO users (username, password_hash, email, first_name, last_name) 
VALUES (
    'testuser', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXzgVrqUfLrm', -- bcrypt hash of 'testpassword123'
    'test@example.com', 
    'Test', 
    'User'
) ON CONFLICT (username) DO NOTHING;

-- Alternative test user with email login
INSERT INTO users (username, password_hash, email, first_name, last_name) 
VALUES (
    'student1', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXzgVrqUfLrm', -- same password hash
    'student@kmitl.ac.th', 
    'Student', 
    'One'
) ON CONFLICT (username) DO NOTHING;
