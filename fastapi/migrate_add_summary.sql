-- Migration script to add summary columns to existing pdf_files table
-- Run this if you have an existing database without summary columns

ALTER TABLE pdf_files 
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS summary_generated_at TIMESTAMP;

-- Add index for better performance on summary queries
CREATE INDEX IF NOT EXISTS idx_pdf_files_summary ON pdf_files(summary_generated_at) WHERE summary IS NOT NULL;
