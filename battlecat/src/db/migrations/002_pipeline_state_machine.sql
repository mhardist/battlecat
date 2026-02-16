-- Migration: Pipeline state machine
-- Adds step-level status tracking, intermediate result storage,
-- and retry logic to the submissions table.
--
-- Run this in the Supabase SQL editor BEFORE deploying the new pipeline code.
-- Backward compatible: existing rows get sensible defaults.

-- Step 1: Add pipeline tracking columns
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS retry_count smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_retries smallint NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS last_step text,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS extracted_text text,
  ADD COLUMN IF NOT EXISTS classification jsonb,
  ADD COLUMN IF NOT EXISTS generated_tutorial jsonb,
  ADD COLUMN IF NOT EXISTS tutorial_id uuid REFERENCES tutorials(id),
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Step 2: Migrate data BEFORE changing the constraint.
-- Old 'processing' and 'extracting' statuses are not in the new constraint.
-- Reset them so the new constraint won't be violated.
UPDATE submissions SET status = 'received'
  WHERE status IN ('extracting', 'processing');

-- Step 3: Mark existing published submissions as completed
UPDATE submissions SET completed_at = created_at
  WHERE status = 'published'
  AND completed_at IS NULL;

-- Step 4: Now safe to replace the status constraint
-- Drop old constraint (name may vary — try common patterns)
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check1;

ALTER TABLE submissions ADD CONSTRAINT submissions_status_check
  CHECK (status IN (
    'received',
    'extracting', 'extracted',
    'classifying', 'classified',
    'generating', 'generated',
    'publishing', 'published',
    'failed',
    'dead'
  ));

-- Step 5: Index for retry/admin queries
CREATE INDEX IF NOT EXISTS idx_submissions_retry
  ON submissions(status, retry_count, created_at)
  WHERE status NOT IN ('published', 'dead');
