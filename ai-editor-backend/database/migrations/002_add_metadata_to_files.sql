-- Add metadata column to files table for folder information
ALTER TABLE files ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index on metadata for folder queries
CREATE INDEX IF NOT EXISTS idx_files_metadata ON files USING GIN (metadata);

