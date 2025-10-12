-- Simple RLS Policies for Settings Tables
-- Run this AFTER running the simple-settings-tables.sql

-- Enable RLS on settings tables
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE legislation ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = user_id);
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role(user_id) = 'admin';
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Product Categories Policies
CREATE POLICY "Admins can manage product categories" ON product_categories
    FOR ALL USING (is_admin(auth.uid()));

-- User Product Categories Policies  
CREATE POLICY "Admins can manage user product categories" ON user_product_categories
    FOR ALL USING (is_admin(auth.uid()));

-- Legislation Policies
CREATE POLICY "Admins can manage legislation" ON legislation
    FOR ALL USING (is_admin(auth.uid()));

-- Streets Policies
CREATE POLICY "Admins can manage streets" ON streets
    FOR ALL USING (is_admin(auth.uid()));

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('product_categories', 'user_product_categories', 'legislation', 'streets')
ORDER BY tablename;
