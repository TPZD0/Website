-- Debug Quiz Sessions SQL Script
-- Run these queries to check and fix quiz_sessions table data

-- 1. Check current quiz_sessions table structure and data
SELECT 
    id,
    user_id,
    file_id,
    score,
    total_questions,
    difficulty,
    completed,
    completed_at,
    created_at,
    CASE 
        WHEN quiz_data IS NOT NULL THEN 'Has quiz_data'
        ELSE 'No quiz_data'
    END as quiz_data_status,
    CASE 
        WHEN user_answers IS NOT NULL THEN 'Has user_answers'
        ELSE 'No user_answers'
    END as user_answers_status
FROM quiz_sessions 
ORDER BY created_at DESC;

-- 2. Check quiz_data structure for existing sessions
SELECT 
    id,
    user_id,
    file_id,
    jsonb_typeof(quiz_data) as quiz_data_type,
    CASE 
        WHEN quiz_data ? 'questions' THEN jsonb_array_length(quiz_data->'questions')
        WHEN quiz_data ? 'quiz' AND quiz_data->'quiz' ? 'questions' THEN jsonb_array_length(quiz_data->'quiz'->'questions')
        ELSE 0
    END as questions_count,
    quiz_data->'title' as quiz_title
FROM quiz_sessions 
WHERE quiz_data IS NOT NULL
ORDER BY created_at DESC;

-- 3. Check for missing or incorrect total_questions values
SELECT 
    id,
    user_id,
    file_id,
    total_questions,
    CASE 
        WHEN quiz_data ? 'questions' THEN jsonb_array_length(quiz_data->'questions')
        WHEN quiz_data ? 'quiz' AND quiz_data->'quiz' ? 'questions' THEN jsonb_array_length(quiz_data->'quiz'->'questions')
        ELSE 0
    END as actual_questions_count
FROM quiz_sessions 
WHERE quiz_data IS NOT NULL
AND (
    total_questions = 0 
    OR total_questions IS NULL 
    OR total_questions != CASE 
        WHEN quiz_data ? 'questions' THEN jsonb_array_length(quiz_data->'questions')
        WHEN quiz_data ? 'quiz' AND quiz_data->'quiz' ? 'questions' THEN jsonb_array_length(quiz_data->'quiz'->'questions')
        ELSE 0
    END
);

-- 4. Fix total_questions for sessions where it's incorrect
UPDATE quiz_sessions 
SET total_questions = CASE 
    WHEN quiz_data ? 'questions' THEN jsonb_array_length(quiz_data->'questions')
    WHEN quiz_data ? 'quiz' AND quiz_data->'quiz' ? 'questions' THEN jsonb_array_length(quiz_data->'quiz'->'questions')
    ELSE total_questions
END
WHERE quiz_data IS NOT NULL
AND (
    total_questions = 0 
    OR total_questions IS NULL 
    OR total_questions != CASE 
        WHEN quiz_data ? 'questions' THEN jsonb_array_length(quiz_data->'questions')
        WHEN quiz_data ? 'quiz' AND quiz_data->'quiz' ? 'questions' THEN jsonb_array_length(quiz_data->'quiz'->'questions')
        ELSE 0
    END
);

-- 4. User quiz statistics with attempt counts and averages
SELECT 
    user_id,
    COUNT(*) as total_attempts,
    COUNT(DISTINCT file_name) as unique_files,
    AVG(CASE WHEN completed THEN score::float / total_questions ELSE NULL END) as avg_score_percentage,
    MAX(created_at) as last_attempt
FROM quiz_sessions 
WHERE completed = true
GROUP BY user_id
ORDER BY total_attempts DESC;

-- 5. Quiz attempts per file with latest scores
WITH latest_attempts AS (
    SELECT 
        file_name,
        user_id,
        COUNT(*) as attempt_count,
        MAX(created_at) as latest_attempt_date
    FROM quiz_sessions 
    WHERE completed = true
    GROUP BY file_name, user_id
),
latest_scores AS (
    SELECT DISTINCT
        qs.file_name,
        qs.user_id,
        FIRST_VALUE(qs.score) OVER (PARTITION BY qs.file_name, qs.user_id ORDER BY qs.created_at DESC) as latest_score,
        FIRST_VALUE(qs.total_questions) OVER (PARTITION BY qs.file_name, qs.user_id ORDER BY qs.created_at DESC) as latest_total_questions
    FROM quiz_sessions qs
    WHERE completed = true
)
SELECT 
    la.file_name,
    la.user_id,
    la.attempt_count,
    la.latest_attempt_date,
    ls.latest_score,
    ls.latest_total_questions,
    ROUND((ls.latest_score::float / ls.latest_total_questions * 100), 2) as latest_percentage
FROM latest_attempts la
JOIN latest_scores ls ON la.file_name = ls.file_name AND la.user_id = ls.user_id
ORDER BY la.user_id, la.latest_attempt_date DESC;

-- 6. Detailed attempt history for each file
WITH ranked_attempts AS (
    SELECT 
        *,
        ROW_NUMBER() OVER (PARTITION BY file_name, user_id ORDER BY created_at DESC) as attempt_number_desc,
        ROW_NUMBER() OVER (PARTITION BY file_name, user_id ORDER BY created_at ASC) as attempt_number_asc
    FROM quiz_sessions 
    WHERE completed = true
)
SELECT 
    file_name,
    user_id,
    attempt_number_asc as attempt_number,
    score,
    total_questions,
    ROUND((score::float / total_questions * 100), 2) as percentage,
    created_at,
    completed_at,
    CASE 
        WHEN attempt_number_desc = 1 THEN 'Latest'
        ELSE 'Previous'
    END as attempt_status
FROM ranked_attempts
ORDER BY user_id, file_name, attempt_number_asc;

-- 7. Check files with quiz sessions
SELECT 
    pf.name as file_name,
    pf.user_id,
    COUNT(qs.id) as quiz_attempts,
    MAX(qs.score) as best_score,
    MAX(qs.total_questions) as questions_count,
    MAX(qs.created_at) as last_quiz_date
FROM pdf_files pf
LEFT JOIN quiz_sessions qs ON pf.id = qs.file_id
GROUP BY pf.id, pf.name, pf.user_id
HAVING COUNT(qs.id) > 0
ORDER BY quiz_attempts DESC;

-- 7. Sample quiz_data structure (for reference)
SELECT 
    id,
    quiz_data
FROM quiz_sessions 
WHERE quiz_data IS NOT NULL
LIMIT 1;
