-- Add randomize_options column and update correct_answer to support multiple answers
-- This migration:
-- 1. Adds randomize_options to control answer shuffling
-- 2. Changes correct_answer to JSONB to support multiple correct answers
-- 3. Migrates existing data from TEXT to JSONB array format

-- Add randomize_options column
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS randomize_options BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN questions.randomize_options IS 'Whether to randomize answer order during gameplay (default: true)';

-- Rename old column and create new one with JSONB type
ALTER TABLE questions
RENAME COLUMN correct_answer TO correct_answer_old;

ALTER TABLE questions
ADD COLUMN correct_answer JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Migrate existing data: convert single answer to array format
UPDATE questions
SET correct_answer = jsonb_build_array(correct_answer_old);

-- Drop old column
ALTER TABLE questions
DROP COLUMN correct_answer_old;

-- Add constraint to ensure at least one correct answer
ALTER TABLE questions
ADD CONSTRAINT at_least_one_correct_answer CHECK (jsonb_array_length(correct_answer) >= 1);

COMMENT ON COLUMN questions.correct_answer IS 'JSONB array of correct answer indices (e.g., ["0", "2"] for multiple correct answers)';
