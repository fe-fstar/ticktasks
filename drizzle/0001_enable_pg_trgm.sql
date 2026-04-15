-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index on plans.title for faster fuzzy search
CREATE INDEX IF NOT EXISTS plans_title_trgm_idx ON plans USING GIN (title gin_trgm_ops);
