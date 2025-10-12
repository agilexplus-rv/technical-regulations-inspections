-- Simple Settings Tables Creation Script
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing tables if they exist (to start clean)
DROP TABLE IF EXISTS user_product_categories CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS legislation CASCADE;
DROP TABLE IF EXISTS streets CASCADE;
DROP TABLE IF EXISTS geo_streets CASCADE;

-- Step 2: Create the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 3: Create Product Categories table
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    code VARCHAR(50) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create User Product Categories table (many-to-many relationship)
CREATE TABLE user_product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_category_id)
);

-- Step 5: Create Legislation table
CREATE TABLE legislation (
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

-- Step 6: Create Streets table
CREATE TABLE streets (
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

-- Step 7: Create indexes (only after tables are created)
CREATE INDEX idx_product_categories_active ON product_categories(is_active);
CREATE INDEX idx_product_categories_code ON product_categories(code);
CREATE INDEX idx_user_product_categories_user_id ON user_product_categories(user_id);
CREATE INDEX idx_user_product_categories_category_id ON user_product_categories(product_category_id);
CREATE INDEX idx_legislation_active ON legislation(is_active);
CREATE INDEX idx_legislation_act_name ON legislation(act_name);
CREATE INDEX idx_streets_active ON streets(is_active);
CREATE INDEX idx_streets_locality ON streets(locality);
CREATE INDEX idx_streets_region ON streets(region);
CREATE INDEX idx_streets_manual ON streets(is_manual);

-- Step 8: Create triggers for updated_at columns
CREATE TRIGGER update_product_categories_updated_at 
    BEFORE UPDATE ON product_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legislation_updated_at 
    BEFORE UPDATE ON legislation 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streets_updated_at 
    BEFORE UPDATE ON streets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Verify tables were created
SELECT 
    table_name,
    'Table created successfully' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('product_categories', 'user_product_categories', 'legislation', 'streets')
ORDER BY table_name;
