-- Remove unique constraint from product_categories.code
-- This allows multiple categories to have the same code

-- Drop the unique constraint on the code column
ALTER TABLE product_categories DROP CONSTRAINT IF EXISTS product_categories_code_key;

-- The index will remain for performance, but without the unique constraint
-- The existing index on line 74 of 003_settings_tables.sql will still work
