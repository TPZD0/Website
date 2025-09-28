-- Complete SQL script to add quiz functionality to Study Partner database
-- Run this script to add quiz sessions table and indexes

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

-- Create indexes for better performance on quiz_sessions table
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_file_id ON quiz_sessions(file_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_created_at ON quiz_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_completed ON quiz_sessions(completed);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_difficulty ON quiz_sessions(difficulty);

-- Optional: Add some sample data for testing (uncomment if needed)
/*
-- Insert a sample quiz session for testing
INSERT INTO quiz_sessions (user_id, file_id, quiz_data, total_questions, difficulty, completed)
VALUES (
    1, -- Assuming user_id 1 exists
    1, -- Assuming file_id 1 exists
    '{"quiz_title": "Sample Quiz", "questions": [{"question": "Sample question?", "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}, "correct_answer": "A", "explanation": "This is a sample explanation"}]}',
    1,
    'medium',
    false
) ON CONFLICT DO NOTHING;
*/
