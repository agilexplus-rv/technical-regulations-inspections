-- Add missing columns to report_templates table
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS template_content TEXT;

-- Update existing templates to be active by default
UPDATE report_templates SET is_active = true WHERE is_active IS NULL;

-- Add index for is_active column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_report_templates_active ON report_templates(is_active);
