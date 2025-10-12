-- Settings system tables for Technical Regulations Inspections

-- Product Categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    code VARCHAR(50) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Product Categories (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_category_id)
);

-- Legislation table
CREATE TABLE IF NOT EXISTS legislation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    act_name VARCHAR(255) NOT NULL,
    article_number VARCHAR(50),
    section_number VARCHAR(50),
    content TEXT,
    effective_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report Templates table (enhanced)
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    format VARCHAR(50) NOT NULL DEFAULT 'html',
    template_content TEXT NOT NULL,
    mapping_json JSONB,
    version VARCHAR(20) DEFAULT '1.0.0',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geo Settings - Malta and Gozo streets
CREATE TABLE IF NOT EXISTS geo_streets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    locality VARCHAR(255) NOT NULL,
    region VARCHAR(255) NOT NULL,
    postcode VARCHAR(10),
    is_manual BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, locality, region)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_product_categories_code ON product_categories(code);
CREATE INDEX IF NOT EXISTS idx_user_product_categories_user_id ON user_product_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_product_categories_category_id ON user_product_categories(product_category_id);
CREATE INDEX IF NOT EXISTS idx_legislation_active ON legislation(is_active);
CREATE INDEX IF NOT EXISTS idx_legislation_act_name ON legislation(act_name);
-- CREATE INDEX IF NOT EXISTS idx_report_templates_active ON report_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_geo_streets_active ON geo_streets(is_active);
CREATE INDEX IF NOT EXISTS idx_geo_streets_locality ON geo_streets(locality);
CREATE INDEX IF NOT EXISTS idx_geo_streets_region ON geo_streets(region);
CREATE INDEX IF NOT EXISTS idx_geo_streets_manual ON geo_streets(is_manual);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_legislation_updated_at BEFORE UPDATE ON legislation FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_geo_streets_updated_at BEFORE UPDATE ON geo_streets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
