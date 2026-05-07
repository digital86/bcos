-- ============================================================================
-- Migration: CRM Integration System
-- Version: 002
-- Description: Adds CRM integration capabilities with webhook, email, and API support
-- Date: December 5, 2025
-- ============================================================================

-- ============================================================================
-- 1. CREATE CRM INTEGRATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('webhook', 'email', 'api')),
  provider TEXT, -- 'hubspot', 'salesforce', 'pipedrive', 'custom', etc.
  config JSONB NOT NULL, -- Configuration specific to each type/provider
  is_active BOOLEAN DEFAULT true,
  last_tested_at TIMESTAMP WITH TIME ZONE,
  test_status TEXT CHECK (test_status IN ('success', 'failed', 'pending')),
  test_message TEXT, -- Details from last test
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on name for quick lookups
CREATE INDEX IF NOT EXISTS idx_crm_integrations_name ON crm_integrations(name);

-- Add index on type for filtering
CREATE INDEX IF NOT EXISTS idx_crm_integrations_type ON crm_integrations(type);

-- Add index on is_active for active integrations queries
CREATE INDEX IF NOT EXISTS idx_crm_integrations_active ON crm_integrations(is_active) WHERE is_active = true;

COMMENT ON TABLE crm_integrations IS 'Stores CRM integration configurations (webhook, email, API)';
COMMENT ON COLUMN crm_integrations.config IS 'JSON configuration: {"endpoint": "...", "headers": {...}, "timeout": 30000} for webhook | {"to": "...", "subject_template": "..."} for email | {"api_key": "...", "endpoint": "..."} for API';

-- ============================================================================
-- 2. CREATE FORMATION CRM MAPPINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS formation_crm_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  crm_integration_id UUID NOT NULL REFERENCES crm_integrations(id) ON DELETE CASCADE,
  field_mappings JSONB NOT NULL DEFAULT '{}', -- Map formation/enrollment fields to CRM fields
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- For ordering multiple CRMs (higher = first)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(formation_id, crm_integration_id)
);

-- Add index on formation_id for quick lookups
CREATE INDEX IF NOT EXISTS idx_formation_crm_mappings_formation ON formation_crm_mappings(formation_id);

-- Add index on crm_integration_id
CREATE INDEX IF NOT EXISTS idx_formation_crm_mappings_crm ON formation_crm_mappings(crm_integration_id);

-- Add index on active mappings
CREATE INDEX IF NOT EXISTS idx_formation_crm_mappings_active ON formation_crm_mappings(is_active) WHERE is_active = true;

COMMENT ON TABLE formation_crm_mappings IS 'Maps formations to CRM integrations with field mapping configurations';
COMMENT ON COLUMN formation_crm_mappings.field_mappings IS 'JSON field mapping: {"source_to_target": {"full_name": "contact.name", ...}, "static_values": {"deal.pipeline": "training"}}';

-- ============================================================================
-- 3. CREATE CRM LOGS TABLE (AUDIT TRAIL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  crm_integration_id UUID REFERENCES crm_integrations(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  request_data JSONB, -- Data sent to CRM
  response_data JSONB, -- Response from CRM
  error_message TEXT, -- Error details if failed
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE, -- When to retry if failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on enrollment_id for quick lookups
CREATE INDEX IF NOT EXISTS idx_crm_logs_enrollment ON crm_logs(enrollment_id);

-- Add index on crm_integration_id
CREATE INDEX IF NOT EXISTS idx_crm_logs_integration ON crm_logs(crm_integration_id);

-- Add index on status for filtering
CREATE INDEX IF NOT EXISTS idx_crm_logs_status ON crm_logs(status);

-- Add index on next_retry_at for retry queue
CREATE INDEX IF NOT EXISTS idx_crm_logs_retry ON crm_logs(next_retry_at) WHERE status = 'pending' OR status = 'failed';

-- Add composite index for failed logs with retries
CREATE INDEX IF NOT EXISTS idx_crm_logs_failed_retry ON crm_logs(status, retry_count, next_retry_at) WHERE status = 'failed';

-- Add index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_crm_logs_created ON crm_logs(created_at DESC);

COMMENT ON TABLE crm_logs IS 'Audit trail of all CRM forwarding attempts with success/failure status';
COMMENT ON COLUMN crm_logs.retry_count IS 'Number of retry attempts (max 3)';
COMMENT ON COLUMN crm_logs.next_retry_at IS 'Timestamp for next retry attempt (exponential backoff)';

-- ============================================================================
-- 4. ADD COLUMNS TO FORMATIONS TABLE
-- ============================================================================

-- Add inscription form configuration fields
ALTER TABLE formations
ADD COLUMN IF NOT EXISTS inscription_form_fields JSONB DEFAULT '[]';

ALTER TABLE formations
ADD COLUMN IF NOT EXISTS inscription_form_template TEXT;

-- Add index on formations with custom forms
CREATE INDEX IF NOT EXISTS idx_formations_custom_form ON formations((inscription_form_fields::text != '[]'::text)) WHERE inscription_form_fields::text != '[]'::text;

COMMENT ON COLUMN formations.inscription_form_fields IS 'JSON array of custom form fields: [{"id": "field_1", "name": "full_name", "type": "text", "label_fr": "...", "label_ar": "...", "required": true, "order": 1}, ...]';
COMMENT ON COLUMN formations.inscription_form_template IS 'Optional HTML template for custom enrollment form rendering';

-- ============================================================================
-- 5. CREATE DATABASE FUNCTIONS
-- ============================================================================

-- Function: Get CRM Integrations for Formation
CREATE OR REPLACE FUNCTION get_crm_integrations_for_formation(p_formation_id UUID)
RETURNS TABLE (
  integration_id UUID,
  integration_name TEXT,
  integration_type TEXT,
  provider TEXT,
  config JSONB,
  field_mappings JSONB,
  is_active BOOLEAN,
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id AS integration_id,
    ci.name AS integration_name,
    ci.type AS integration_type,
    ci.provider,
    ci.config,
    fcm.field_mappings,
    fcm.is_active,
    fcm.priority
  FROM crm_integrations ci
  INNER JOIN formation_crm_mappings fcm 
    ON ci.id = fcm.crm_integration_id
  WHERE fcm.formation_id = p_formation_id
    AND ci.is_active = true
    AND fcm.is_active = true
  ORDER BY fcm.priority DESC, ci.name ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_crm_integrations_for_formation IS 'Returns all active CRM integrations configured for a specific formation';

-- Function: Log CRM Activity
CREATE OR REPLACE FUNCTION log_crm_activity(
  p_enrollment_id UUID,
  p_crm_integration_id UUID,
  p_status TEXT,
  p_request_data JSONB DEFAULT NULL,
  p_response_data JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_retry_count INTEGER DEFAULT 0
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_next_retry_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate next retry time using exponential backoff
  -- 1st retry: 5 minutes, 2nd: 15 minutes, 3rd: 60 minutes
  IF p_status = 'failed' AND p_retry_count < 3 THEN
    v_next_retry_at := NOW() + (INTERVAL '5 minutes' * POWER(3, p_retry_count));
  ELSE
    v_next_retry_at := NULL;
  END IF;

  INSERT INTO crm_logs (
    enrollment_id,
    crm_integration_id,
    status,
    request_data,
    response_data,
    error_message,
    retry_count,
    next_retry_at
  ) VALUES (
    p_enrollment_id,
    p_crm_integration_id,
    p_status,
    p_request_data,
    p_response_data,
    p_error_message,
    p_retry_count,
    v_next_retry_at
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_crm_activity IS 'Logs CRM forwarding activity with exponential backoff for retries';

-- Function: Get Failed CRM Logs for Retry
CREATE OR REPLACE FUNCTION get_failed_crm_logs_for_retry(p_max_retries INTEGER DEFAULT 3)
RETURNS TABLE (
  log_id UUID,
  enrollment_id UUID,
  crm_integration_id UUID,
  retry_count INTEGER,
  request_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cl.id AS log_id,
    cl.enrollment_id,
    cl.crm_integration_id,
    cl.retry_count,
    cl.request_data,
    cl.error_message,
    cl.created_at
  FROM crm_logs cl
  WHERE cl.status = 'failed'
    AND cl.retry_count < p_max_retries
    AND (cl.next_retry_at IS NULL OR cl.next_retry_at <= NOW())
  ORDER BY cl.created_at ASC
  LIMIT 50; -- Process in batches
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_failed_crm_logs_for_retry IS 'Returns failed CRM logs ready for retry (max 50 at a time)';

-- Function: Update CRM Log Status
CREATE OR REPLACE FUNCTION update_crm_log_status(
  p_log_id UUID,
  p_status TEXT,
  p_response_data JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_retry_count INTEGER;
  v_next_retry_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current retry count
  SELECT retry_count INTO v_retry_count
  FROM crm_logs
  WHERE id = p_log_id;

  -- Calculate next retry if still failing
  IF p_status = 'failed' AND v_retry_count < 3 THEN
    v_retry_count := v_retry_count + 1;
    v_next_retry_at := NOW() + (INTERVAL '5 minutes' * POWER(3, v_retry_count - 1));
  ELSE
    v_retry_count := v_retry_count;
    v_next_retry_at := NULL;
  END IF;

  UPDATE crm_logs
  SET 
    status = p_status,
    response_data = COALESCE(p_response_data, response_data),
    error_message = COALESCE(p_error_message, error_message),
    retry_count = v_retry_count,
    next_retry_at = v_next_retry_at,
    updated_at = NOW()
  WHERE id = p_log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_crm_log_status IS 'Updates CRM log status with retry logic';

-- Function: Get CRM Statistics
CREATE OR REPLACE FUNCTION get_crm_statistics(
  p_crm_integration_id UUID DEFAULT NULL,
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_submissions INTEGER,
  successful_submissions INTEGER,
  failed_submissions INTEGER,
  pending_submissions INTEGER,
  success_rate NUMERIC,
  avg_retry_count NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total_submissions,
    COUNT(*) FILTER (WHERE status = 'success')::INTEGER AS successful_submissions,
    COUNT(*) FILTER (WHERE status = 'failed')::INTEGER AS failed_submissions,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER AS pending_submissions,
    ROUND(
      (COUNT(*) FILTER (WHERE status = 'success')::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      2
    ) AS success_rate,
    ROUND(AVG(retry_count), 2) AS avg_retry_count
  FROM crm_logs
  WHERE (p_crm_integration_id IS NULL OR crm_integration_id = p_crm_integration_id)
    AND created_at >= NOW() - (p_days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_crm_statistics IS 'Returns CRM forwarding statistics for a given period';

-- ============================================================================
-- 6. CREATE TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to crm_integrations
DROP TRIGGER IF EXISTS trigger_crm_integrations_updated_at ON crm_integrations;
CREATE TRIGGER trigger_crm_integrations_updated_at
  BEFORE UPDATE ON crm_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to formation_crm_mappings
DROP TRIGGER IF EXISTS trigger_formation_crm_mappings_updated_at ON formation_crm_mappings;
CREATE TRIGGER trigger_formation_crm_mappings_updated_at
  BEFORE UPDATE ON formation_crm_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to crm_logs
DROP TRIGGER IF EXISTS trigger_crm_logs_updated_at ON crm_logs;
CREATE TRIGGER trigger_crm_logs_updated_at
  BEFORE UPDATE ON crm_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. INSERT SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================================================

-- Sample webhook CRM integration
INSERT INTO crm_integrations (name, type, provider, config, is_active)
VALUES (
  'HubSpot Webhook',
  'webhook',
  'hubspot',
  '{
    "endpoint": "https://api.hubspot.com/webhooks/v3/enrollments",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer YOUR_API_KEY",
      "Content-Type": "application/json"
    },
    "timeout": 30000
  }'::JSONB,
  false
) ON CONFLICT (name) DO NOTHING;

-- Sample email CRM integration
INSERT INTO crm_integrations (name, type, provider, config, is_active)
VALUES (
  'Email Notifications',
  'email',
  'smtp',
  '{
    "to": "sales@bcos-dz.com",
    "cc": "info@bcos-dz.com",
    "subject_template": "Nouvelle inscription: {{course_title_fr}}",
    "body_template": "<h1>Nouvelle inscription</h1><p>Formation: {{course_title_fr}}</p><p>Participant: {{full_name}}</p><p>Email: {{email}}</p><p>Téléphone: {{phone}}</p>"
  }'::JSONB,
  false
) ON CONFLICT (name) DO NOTHING;

-- Sample Salesforce API integration
INSERT INTO crm_integrations (name, type, provider, config, is_active)
VALUES (
  'Salesforce CRM',
  'api',
  'salesforce',
  '{
    "instance_url": "https://your-instance.salesforce.com",
    "api_version": "v59.0",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "username": "your-username",
    "password": "your-password"
  }'::JSONB,
  false
) ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 8. GRANT PERMISSIONS (IF USING ROW LEVEL SECURITY)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_crm_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can manage CRM integrations" ON crm_integrations
  FOR ALL
  USING (auth.role() = 'admin');

CREATE POLICY "Admin can manage formation CRM mappings" ON formation_crm_mappings
  FOR ALL
  USING (auth.role() = 'admin');

CREATE POLICY "Admin can view CRM logs" ON crm_logs
  FOR SELECT
  USING (auth.role() = 'admin');

-- ============================================================================
-- 9. VERIFICATION QUERIES
-- ============================================================================

-- Verify tables created
DO $$
BEGIN
  RAISE NOTICE 'Verifying CRM Integration tables...';
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_integrations') THEN
    RAISE NOTICE '✓ crm_integrations table created';
  ELSE
    RAISE EXCEPTION '✗ crm_integrations table NOT created';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'formation_crm_mappings') THEN
    RAISE NOTICE '✓ formation_crm_mappings table created';
  ELSE
    RAISE EXCEPTION '✗ formation_crm_mappings table NOT created';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_logs') THEN
    RAISE NOTICE '✓ crm_logs table created';
  ELSE
    RAISE EXCEPTION '✗ crm_logs table NOT created';
  END IF;
  
  RAISE NOTICE '✓ All CRM Integration tables verified successfully!';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- To rollback this migration, run:
-- DROP TABLE IF EXISTS crm_logs CASCADE;
-- DROP TABLE IF EXISTS formation_crm_mappings CASCADE;
-- DROP TABLE IF EXISTS crm_integrations CASCADE;
-- DROP FUNCTION IF EXISTS get_crm_integrations_for_formation(UUID);
-- DROP FUNCTION IF EXISTS log_crm_activity(...);
-- DROP FUNCTION IF EXISTS get_failed_crm_logs_for_retry(INTEGER);
-- DROP FUNCTION IF EXISTS update_crm_log_status(...);
-- DROP FUNCTION IF EXISTS get_crm_statistics(...);
-- ALTER TABLE formations DROP COLUMN IF EXISTS inscription_form_fields;
-- ALTER TABLE formations DROP COLUMN IF EXISTS inscription_form_template;





