-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_sentiment ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays_mt ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

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

-- Helper function to check if user is manager or admin
CREATE OR REPLACE FUNCTION is_manager_or_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role(user_id) IN ('manager', 'admin');
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is officer or higher
CREATE OR REPLACE FUNCTION is_officer_or_higher(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role(user_id) IN ('officer', 'manager', 'admin');
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's team members (for officers)
CREATE OR REPLACE FUNCTION get_team_members(user_id UUID)
RETURNS UUID[] AS $$
DECLARE
    user_role TEXT;
    team_members UUID[];
BEGIN
    user_role := get_user_role(user_id);
    
    IF user_role = 'officer' THEN
        -- Officers can see their own and inspector's inspections
        SELECT ARRAY_AGG(id) INTO team_members
        FROM users 
        WHERE role IN ('inspector', 'officer');
    ELSIF user_role = 'manager' THEN
        -- Managers can see all non-admin users
        SELECT ARRAY_AGG(id) INTO team_members
        FROM users 
        WHERE role IN ('inspector', 'officer', 'manager');
    ELSIF user_role = 'admin' THEN
        -- Admins can see everyone
        SELECT ARRAY_AGG(id) INTO team_members
        FROM users;
    ELSE
        -- Inspectors can only see themselves
        team_members := ARRAY[user_id];
    END IF;
    
    RETURN COALESCE(team_members, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Managers can view team users" ON users
    FOR SELECT USING (
        is_manager_or_admin(auth.uid()) AND 
        id = ANY(get_team_members(auth.uid()))
    );

CREATE POLICY "Admins can update users" ON users
    FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Sessions table policies
CREATE POLICY "Users can view own sessions" ON sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON sessions
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can create own sessions" ON sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Economic Operators table policies
CREATE POLICY "All authenticated users can view operators" ON economic_operators
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Officers can create operators" ON economic_operators
    FOR INSERT WITH CHECK (is_officer_or_higher(auth.uid()));

CREATE POLICY "Officers can update operators" ON economic_operators
    FOR UPDATE USING (is_officer_or_higher(auth.uid()));

CREATE POLICY "Admins can delete operators" ON economic_operators
    FOR DELETE USING (is_admin(auth.uid()));

-- Inspections table policies
CREATE POLICY "Inspectors can view own inspections" ON inspections
    FOR SELECT USING (
        auth.uid() = created_by OR 
        auth.uid() = assigned_to OR
        is_officer_or_higher(auth.uid())
    );

CREATE POLICY "Inspectors can create inspections" ON inspections
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Inspectors can update own inspections" ON inspections
    FOR UPDATE USING (auth.uid() = assigned_to);

CREATE POLICY "Officers can update team inspections" ON inspections
    FOR UPDATE USING (
        is_officer_or_higher(auth.uid()) AND
        assigned_to = ANY(get_team_members(auth.uid()))
    );

CREATE POLICY "Admins can delete inspections" ON inspections
    FOR DELETE USING (is_admin(auth.uid()));

-- Inspection Media table policies
CREATE POLICY "Users can view media for accessible inspections" ON inspection_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = inspection_media.inspection_id 
            AND (
                inspections.assigned_to = auth.uid() OR
                inspections.created_by = auth.uid() OR
                is_officer_or_higher(auth.uid())
            )
        )
    );

CREATE POLICY "Inspectors can upload media to own inspections" ON inspection_media
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = inspection_media.inspection_id 
            AND inspections.assigned_to = auth.uid()
        )
    );

CREATE POLICY "PII media access restricted to officers+" ON inspection_media
    FOR SELECT USING (
        NOT pii_flag OR is_officer_or_higher(auth.uid())
    );

-- Checklists table policies
CREATE POLICY "Published checklists visible to all" ON checklists
    FOR SELECT USING (status = 'published' OR auth.uid() IS NOT NULL);

CREATE POLICY "Officers can create checklists" ON checklists
    FOR INSERT WITH CHECK (is_officer_or_higher(auth.uid()));

CREATE POLICY "Users can update own checklists" ON checklists
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Managers can approve checklists" ON checklists
    FOR UPDATE USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Admins can publish/retire checklists" ON checklists
    FOR UPDATE USING (is_admin(auth.uid()));

-- Inspection Runs table policies
CREATE POLICY "Users can view runs for accessible inspections" ON inspection_runs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = inspection_runs.inspection_id 
            AND (
                inspections.assigned_to = auth.uid() OR
                inspections.created_by = auth.uid() OR
                is_officer_or_higher(auth.uid())
            )
        )
    );

CREATE POLICY "Inspectors can create runs for own inspections" ON inspection_runs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = inspection_runs.inspection_id 
            AND inspections.assigned_to = auth.uid()
        )
    );

-- Findings table policies
CREATE POLICY "Users can view findings for accessible inspections" ON findings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = findings.inspection_id 
            AND (
                inspections.assigned_to = auth.uid() OR
                inspections.created_by = auth.uid() OR
                is_officer_or_higher(auth.uid())
            )
        )
    );

CREATE POLICY "Inspectors can create findings for own inspections" ON findings
    FOR INSERT WITH CHECK (auth.uid() = drafted_by);

CREATE POLICY "Users can update own findings" ON findings
    FOR UPDATE USING (auth.uid() = drafted_by);

CREATE POLICY "Officers can approve findings" ON findings
    FOR UPDATE USING (is_officer_or_higher(auth.uid()));

-- Notices table policies
CREATE POLICY "Users can view notices for accessible inspections" ON notices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = notices.inspection_id 
            AND (
                inspections.assigned_to = auth.uid() OR
                inspections.created_by = auth.uid() OR
                is_officer_or_higher(auth.uid())
            )
        )
    );

CREATE POLICY "Officers can create notices" ON notices
    FOR INSERT WITH CHECK (auth.uid() = drafted_by_officer_id);

CREATE POLICY "Officers can update own notices" ON notices
    FOR UPDATE USING (auth.uid() = drafted_by_officer_id);

CREATE POLICY "Managers can sign notices" ON notices
    FOR UPDATE USING (is_manager_or_admin(auth.uid()));

-- AI Results table policies
CREATE POLICY "Users can view AI results for accessible inspections" ON ai_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = ai_results.inspection_id 
            AND (
                inspections.assigned_to = auth.uid() OR
                inspections.created_by = auth.uid() OR
                is_officer_or_higher(auth.uid())
            )
        )
    );

CREATE POLICY "Inspectors can create AI results for own inspections" ON ai_results
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = ai_results.inspection_id 
            AND inspections.assigned_to = auth.uid()
        )
    );

-- Integrations table policies
CREATE POLICY "Admins can manage integrations" ON integrations
    FOR ALL USING (is_admin(auth.uid()));

-- Report Templates table policies
CREATE POLICY "All authenticated users can view templates" ON report_templates
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage templates" ON report_templates
    FOR ALL USING (is_admin(auth.uid()));

-- Mail Log table policies
CREATE POLICY "Officers can view mail logs" ON mail_log
    FOR SELECT USING (is_officer_or_higher(auth.uid()));

CREATE POLICY "System can create mail logs" ON mail_log
    FOR INSERT WITH CHECK (true); -- Allow system operations

-- Feedback Tokens table policies
CREATE POLICY "System can manage feedback tokens" ON feedback_tokens
    FOR ALL USING (true); -- Allow system operations for token generation

-- Feedback table policies (public access for feedback submission)
CREATE POLICY "Public can submit feedback" ON feedback
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Officers can view feedback" ON feedback
    FOR SELECT USING (is_officer_or_higher(auth.uid()));

-- Feedback Sentiment table policies
CREATE POLICY "Officers can view sentiment analysis" ON feedback_sentiment
    FOR SELECT USING (is_officer_or_higher(auth.uid()));

CREATE POLICY "System can create sentiment analysis" ON feedback_sentiment
    FOR INSERT WITH CHECK (true); -- Allow system operations

-- Holidays Malta table policies
CREATE POLICY "All authenticated users can view holidays" ON holidays_mt
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage holidays" ON holidays_mt
    FOR ALL USING (is_admin(auth.uid()));

-- Audit Log table policies
CREATE POLICY "Admins can view all audit logs" ON audit_log
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Managers can view relevant audit logs" ON audit_log
    FOR SELECT USING (
        is_manager_or_admin(auth.uid()) AND
        (user_id = ANY(get_team_members(auth.uid())) OR user_id IS NULL)
    );

CREATE POLICY "System can create audit logs" ON audit_log
    FOR INSERT WITH CHECK (true); -- Allow system operations

-- Create function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_action TEXT,
    p_resource TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_log (
        user_id,
        action,
        resource,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        auth.uid(),
        p_action,
        p_resource,
        p_resource_id,
        p_details,
        inet_client_addr(),
        current_setting('request.headers', true)::JSON->>'user-agent',
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for critical tables
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_event(
            'CREATE',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_audit_event(
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id,
            jsonb_build_object(
                'old', to_jsonb(OLD),
                'new', to_jsonb(NEW)
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_event(
            'DELETE',
            TG_TABLE_NAME,
            OLD.id,
            to_jsonb(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_inspections_trigger
    AFTER INSERT OR UPDATE OR DELETE ON inspections
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_findings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON findings
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_notices_trigger
    AFTER INSERT OR UPDATE OR DELETE ON notices
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
