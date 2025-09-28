-- Migration script to add quiz_sessions table
-- Run this script to add quiz functionality to existing database

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
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_file_id ON quiz_sessions(file_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_created_at ON quiz_sessions(created_at);
