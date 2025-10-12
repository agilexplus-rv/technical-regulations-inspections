-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('inspector', 'officer', 'manager', 'admin');
CREATE TYPE inspection_status AS ENUM ('draft', 'in_progress', 'submitted', 'approved_officer', 'approved_manager', 'completed', 'returned');
CREATE TYPE vat_status AS ENUM ('provided', 'not_available', 'not_provided');
CREATE TYPE media_type AS ENUM ('image', 'document', 'video');
CREATE TYPE media_category AS ENUM ('id_front', 'id_back', 'facade', 'product', 'ce_mark', 'nb_number', 'warning', 'name_address', 'plug', 'other');
CREATE TYPE checklist_status AS ENUM ('draft', 'pending_approval', 'approved', 'published', 'retired');
CREATE TYPE question_type AS ENUM ('text', 'number', 'boolean', 'single_choice', 'multi_choice', 'photo', 'barcode', 'ocr');
CREATE TYPE finding_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE finding_status AS ENUM ('draft', 'approved_officer', 'approved_manager', 'rejected');
CREATE TYPE notice_type AS ENUM ('improvement', 'warning', 'stop_sale', 'recall');
CREATE TYPE notice_status AS ENUM ('draft', 'pending_signature', 'signed', 'issued', 'retracted');
CREATE TYPE ai_agent AS ENUM ('label_compliance', 'chemicals_ingredients', 'safety_gate_recall');
CREATE TYPE mail_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'bounced');
CREATE TYPE feedback_type AS ENUM ('inspection', 'outcome');
CREATE TYPE sentiment_label AS ENUM ('positive', 'neutral', 'negative');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'inspector',
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    mfa_enabled BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table (for audit and security)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);

-- Economic Operators table
CREATE TABLE economic_operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    vat_number VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inspections table
CREATE TABLE inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status inspection_status DEFAULT 'draft',
    created_by UUID REFERENCES users(id) NOT NULL,
    assigned_to UUID REFERENCES users(id) NOT NULL,
    economic_operator_id UUID REFERENCES economic_operators(id),
    vat_number VARCHAR(50),
    vat_status vat_status DEFAULT 'not_provided',
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    address_suggested TEXT,
    address_final TEXT,
    address_accuracy_m INTEGER,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    investigation_id VARCHAR(50),
    ai_summary_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inspection Media table
CREATE TABLE inspection_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
    type media_type NOT NULL,
    category media_category NOT NULL,
    storage_uri TEXT NOT NULL,
    hash VARCHAR(64) NOT NULL,
    exif_json JSONB,
    redaction_mask_json JSONB,
    pii_flag BOOLEAN DEFAULT FALSE,
    enc_key_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklists table
CREATE TABLE checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    json_schema JSONB NOT NULL,
    version VARCHAR(50) NOT NULL,
    status checklist_status DEFAULT 'draft',
    created_by UUID REFERENCES users(id) NOT NULL,
    approved_by UUID REFERENCES users(id),
    published_by UUID REFERENCES users(id),
    superseded_by UUID REFERENCES checklists(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inspection Runs table
CREATE TABLE inspection_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
    checklist_id UUID REFERENCES checklists(id),
    checklist_version VARCHAR(50) NOT NULL,
    answers_json JSONB NOT NULL,
    score_json JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Findings table
CREATE TABLE findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity finding_severity NOT NULL,
    drafted_by UUID REFERENCES users(id) NOT NULL,
    approved_by_officer_id UUID REFERENCES users(id),
    approved_by_manager_id UUID REFERENCES users(id),
    legal_refs_json JSONB NOT NULL DEFAULT '[]',
    status finding_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notices table
CREATE TABLE notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
    type notice_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    drafted_by_officer_id UUID REFERENCES users(id) NOT NULL,
    signed_by_manager_id UUID REFERENCES users(id),
    status notice_status DEFAULT 'draft',
    pdf_uri TEXT,
    signature_hash VARCHAR(255),
    issued_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Results table
CREATE TABLE ai_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
    agent ai_agent NOT NULL,
    input_refs_json JSONB NOT NULL,
    output_json JSONB NOT NULL,
    confidence_overall DECIMAL(3, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integrations table
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    config_json JSONB DEFAULT '{}',
    status_msg TEXT,
    last_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report Templates table
CREATE TABLE report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    format VARCHAR(50) DEFAULT 'html',
    mapping_json JSONB NOT NULL,
    version VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mail Log table
CREATE TABLE mail_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status mail_status DEFAULT 'pending',
    provider_msg_id VARCHAR(255),
    error_msg TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback Tokens table
CREATE TABLE feedback_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type feedback_type NOT NULL,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE
);

-- Feedback table
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID REFERENCES feedback_tokens(id) ON DELETE CASCADE,
    type feedback_type NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    agree_disagree BOOLEAN,
    comments_text TEXT,
    attachments_json JSONB DEFAULT '[]',
    consent_to_contact BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_ip INET,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback Sentiment table
CREATE TABLE feedback_sentiment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
    label sentiment_label NOT NULL,
    score DECIMAL(3, 2) NOT NULL,
    key_phrases_json JSONB DEFAULT '[]',
    model_version VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Holidays Malta table
CREATE TABLE holidays_mt (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    holiday_date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    is_recurring BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_inspections_created_by ON inspections(created_by);
CREATE INDEX idx_inspections_assigned_to ON inspections(assigned_to);
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_inspections_economic_operator_id ON inspections(economic_operator_id);
CREATE INDEX idx_inspection_media_inspection_id ON inspection_media(inspection_id);
CREATE INDEX idx_inspection_media_type ON inspection_media(type);
CREATE INDEX idx_inspection_media_pii_flag ON inspection_media(pii_flag);
CREATE INDEX idx_checklists_status ON checklists(status);
CREATE INDEX idx_checklists_created_by ON checklists(created_by);
CREATE INDEX idx_findings_inspection_id ON findings(inspection_id);
CREATE INDEX idx_findings_drafted_by ON findings(drafted_by);
CREATE INDEX idx_findings_status ON findings(status);
CREATE INDEX idx_notices_inspection_id ON notices(inspection_id);
CREATE INDEX idx_notices_status ON notices(status);
CREATE INDEX idx_ai_results_inspection_id ON ai_results(inspection_id);
CREATE INDEX idx_ai_results_agent ON ai_results(agent);
CREATE INDEX idx_feedback_tokens_token_hash ON feedback_tokens(token_hash);
CREATE INDEX idx_feedback_tokens_expires_at ON feedback_tokens(expires_at);
CREATE INDEX idx_feedback_token_id ON feedback(token_id);
CREATE INDEX idx_feedback_type ON feedback(type);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_resource ON audit_log(resource);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_economic_operators_updated_at BEFORE UPDATE ON economic_operators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_checklists_updated_at BEFORE UPDATE ON checklists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_findings_updated_at BEFORE UPDATE ON findings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON notices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
