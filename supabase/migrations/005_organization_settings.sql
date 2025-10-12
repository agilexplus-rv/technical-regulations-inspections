-- Organization Settings table for storing general system configuration
CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Organization Information
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    description TEXT,
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    inspection_prefix VARCHAR(10) DEFAULT 'INS',
    
    -- Regional Settings
    timezone VARCHAR(100) DEFAULT 'Europe/Malta',
    language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(10) DEFAULT 'EUR',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(10) DEFAULT '24h',
    
    -- System Preferences
    auto_generate_reports BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    
    -- Data Management
    backup_frequency VARCHAR(20) DEFAULT 'daily',
    data_retention_days INTEGER DEFAULT 2555,
    
    -- Audit fields
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_organization_settings_updated_at
    BEFORE UPDATE ON organization_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default organization settings
INSERT INTO organization_settings (
    name,
    short_name,
    description,
    website,
    email,
    phone,
    address,
    inspection_prefix,
    timezone,
    language,
    currency,
    date_format,
    time_format,
    auto_generate_reports,
    email_notifications,
    sms_notifications,
    backup_frequency,
    data_retention_days
) VALUES (
    'Malta Competition and Consumer Affairs Authority',
    'MCCAA',
    'Regulatory authority responsible for consumer protection and market surveillance in Malta',
    'https://www.mccaa.org.mt',
    'info@mccaa.org.mt',
    '+356 2395 2000',
    'Malta Competition and Consumer Affairs Authority, Mizzi House, National Road, Blata l-Bajda HMR 9010, Malta',
    'INS',
    'Europe/Malta',
    'en',
    'EUR',
    'DD/MM/YYYY',
    '24h',
    true,
    true,
    false,
    'daily',
    2555
) ON CONFLICT DO NOTHING;

-- Create RLS policies
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read and update organization settings
CREATE POLICY "Admins can view organization settings" ON organization_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update organization settings" ON organization_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert organization settings" ON organization_settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );
