-- RLS policies for settings system tables

-- Enable Row Level Security
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE legislation ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_streets ENABLE ROW LEVEL SECURITY;

-- Product Categories policies
CREATE POLICY "Anyone can view active product categories" ON product_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all product categories" ON product_categories
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage product categories" ON product_categories
    FOR ALL USING (is_admin(auth.uid()));

-- User Product Categories policies
CREATE POLICY "Users can view their own product categories" ON user_product_categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user product categories" ON user_product_categories
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage user product categories" ON user_product_categories
    FOR ALL USING (is_admin(auth.uid()));

-- Legislation policies
CREATE POLICY "Anyone can view active legislation" ON legislation
    FOR SELECT USING (is_active = true);

CREATE POLICY "Officers and above can view all legislation" ON legislation
    FOR SELECT USING (get_user_role(auth.uid()) IN ('officer', 'manager', 'admin'));

CREATE POLICY "Officers and above can manage legislation" ON legislation
    FOR ALL USING (get_user_role(auth.uid()) IN ('officer', 'manager', 'admin'));

-- Report Templates policies
-- CREATE POLICY "Anyone can view active report templates" ON report_templates
--     FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all report templates" ON report_templates
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage report templates" ON report_templates
    FOR ALL USING (is_admin(auth.uid()));

-- Geo Streets policies
CREATE POLICY "Anyone can view active geo streets" ON geo_streets
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all geo streets" ON geo_streets
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage geo streets" ON geo_streets
    FOR ALL USING (is_admin(auth.uid()));

-- Helper function to get user's assigned product categories
CREATE OR REPLACE FUNCTION get_user_product_categories(user_id UUID)
RETURNS TABLE(category_id UUID, category_name VARCHAR, category_code VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.id,
        pc.name,
        pc.code
    FROM product_categories pc
    JOIN user_product_categories upc ON pc.id = upc.product_category_id
    WHERE upc.user_id = get_user_product_categories.user_id
    AND pc.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
