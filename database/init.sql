-- CC360 Local Development Database Setup
-- Mirrors production schema consulta_credito

-- Extensions needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Schema
CREATE SCHEMA IF NOT EXISTS consulta_credito;

-- Function
CREATE OR REPLACE FUNCTION consulta_credito.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

SET default_tablespace = '';
SET default_table_access_method = heap;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE consulta_credito.ab_tests (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'active'::character varying,
    metric_primary character varying(50) DEFAULT 'conversion_rate'::character varying,
    variants jsonb NOT NULL,
    started_at timestamp without time zone DEFAULT now(),
    ended_at timestamp without time zone,
    winner character varying(10),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE SEQUENCE consulta_credito.ab_tests_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE consulta_credito.ab_tests_id_seq OWNED BY consulta_credito.ab_tests.id;
ALTER TABLE ONLY consulta_credito.ab_tests ALTER COLUMN id SET DEFAULT nextval('consulta_credito.ab_tests_id_seq'::regclass);

CREATE TABLE consulta_credito.admin_users (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'operator'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    phone character varying(20)
);

CREATE TABLE consulta_credito.conversations (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    lead_id uuid NOT NULL,
    direction character varying(10) NOT NULL,
    message_type character varying(20) DEFAULT 'text'::character varying,
    content text NOT NULL,
    wa_message_id character varying(255),
    wa_status character varying(20),
    wa_timestamp timestamp with time zone,
    is_ai_generated boolean DEFAULT false,
    ai_model character varying(50),
    ai_tokens_used integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    meta_error_code character varying(100),
    meta_error_message text
);

CREATE TABLE consulta_credito.daily_metrics (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    date date NOT NULL,
    new_leads integer DEFAULT 0,
    templates_sent integer DEFAULT 0,
    conversations_started integer DEFAULT 0,
    payments_created integer DEFAULT 0,
    payments_approved integer DEFAULT 0,
    revenue numeric(10,2) DEFAULT 0,
    consultations_done integer DEFAULT 0,
    conversions_limpa_nome integer DEFAULT 0,
    conversions_rating integer DEFAULT 0,
    avg_response_time_seconds integer,
    ai_tokens_total integer DEFAULT 0,
    ai_cost_estimate numeric(10,4) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE consulta_credito.leads (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    cpf character varying(14),
    phone character varying(20) NOT NULL,
    status character varying(50) DEFAULT 'registered'::character varying,
    source character varying(50) DEFAULT 'website'::character varying,
    utm_source character varying(255),
    utm_medium character varying(255),
    utm_campaign character varying(255),
    wa_conversation_id character varying(255),
    wa_last_message_at timestamp with time zone,
    wa_template_sent boolean DEFAULT false,
    wa_template_sent_at timestamp with time zone,
    wa_opted_in boolean DEFAULT false,
    consultation_result jsonb,
    consultation_done_at timestamp with time zone,
    consultation_done_by uuid,
    product_interest character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    pipeline_stage character varying(50) DEFAULT 'novo'::character varying,
    assigned_to uuid,
    notes text,
    lost_reason character varying(255),
    follow_up_count integer DEFAULT 0,
    last_template_sent_at timestamp with time zone,
    last_template_name character varying(100),
    protocol_number character varying(50),
    window_expires_at timestamp with time zone,
    email character varying(255),
    consent_service boolean DEFAULT false,
    consent_marketing boolean DEFAULT false,
    consent_at timestamp with time zone,
    nudge_count integer DEFAULT 0,
    last_message_direction character varying(10),
    fbp character varying(255),
    fbc character varying(255),
    ga_client_id character varying(255),
    ga_session_id character varying(255),
    ip_address character varying(45),
    user_agent text,
    referrer text,
    utm_content character varying(255),
    utm_term character varying(255),
    fbclid character varying(255),
    gclid character varying(255),
    tracking_consent boolean DEFAULT false,
    ctwa_clid character varying(255)
);

CREATE TABLE consulta_credito.payments (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    lead_id uuid NOT NULL,
    gateway character varying(50) NOT NULL,
    gateway_payment_id character varying(255),
    gateway_checkout_url text,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'BRL'::character varying,
    status character varying(50) DEFAULT 'pending'::character varying,
    payment_method character varying(50),
    paid_at timestamp with time zone,
    expires_at timestamp with time zone,
    product character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE consulta_credito.rpa_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid,
    cpf character varying(11) NOT NULL,
    phone character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    attempts integer DEFAULT 0,
    max_attempts integer DEFAULT 3,
    error text,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    next_retry_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    report_summary text,
    has_pendencias boolean,
    analysis_json jsonb
);

CREATE TABLE consulta_credito.stage_transitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid,
    from_stage character varying(50),
    to_stage character varying(50),
    transitioned_at timestamp with time zone DEFAULT now(),
    time_in_stage_minutes numeric DEFAULT 0
);

CREATE TABLE consulta_credito.upsell_leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid,
    service_type character varying(50) NOT NULL,
    name character varying(255),
    phone character varying(20),
    email character varying(255),
    cpf character varying(11),
    notes text,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE consulta_credito.wa_templates (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    language character varying(10) DEFAULT 'pt_BR'::character varying,
    category character varying(50),
    status character varying(50) DEFAULT 'PENDING'::character varying,
    header_text text,
    body_text text NOT NULL,
    footer_text text,
    buttons jsonb,
    meta_template_id character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    submitted_at timestamp with time zone,
    variables jsonb DEFAULT '[]'::jsonb
);

CREATE TABLE consulta_credito.webhook_logs (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    source character varying(50) NOT NULL,
    event_type character varying(100),
    payload jsonb NOT NULL,
    status character varying(20) DEFAULT 'received'::character varying,
    error_message text,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- ============================================================
-- PRIMARY KEYS
-- ============================================================

ALTER TABLE ONLY consulta_credito.ab_tests ADD CONSTRAINT ab_tests_pkey PRIMARY KEY (id);
ALTER TABLE ONLY consulta_credito.admin_users ADD CONSTRAINT admin_users_email_key UNIQUE (email);
ALTER TABLE ONLY consulta_credito.admin_users ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY consulta_credito.conversations ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY consulta_credito.daily_metrics ADD CONSTRAINT daily_metrics_date_key UNIQUE (date);
ALTER TABLE ONLY consulta_credito.daily_metrics ADD CONSTRAINT daily_metrics_pkey PRIMARY KEY (id);
ALTER TABLE ONLY consulta_credito.leads ADD CONSTRAINT leads_pkey PRIMARY KEY (id);
ALTER TABLE ONLY consulta_credito.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY consulta_credito.rpa_jobs ADD CONSTRAINT rpa_jobs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY consulta_credito.stage_transitions ADD CONSTRAINT stage_transitions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY consulta_credito.upsell_leads ADD CONSTRAINT upsell_leads_pkey PRIMARY KEY (id);
ALTER TABLE ONLY consulta_credito.wa_templates ADD CONSTRAINT wa_templates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY consulta_credito.webhook_logs ADD CONSTRAINT webhook_logs_pkey PRIMARY KEY (id);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_conversations_created_at ON consulta_credito.conversations USING btree (created_at);
CREATE INDEX idx_conversations_direction ON consulta_credito.conversations USING btree (lead_id, direction);
CREATE INDEX idx_conversations_lead_id ON consulta_credito.conversations USING btree (lead_id);
CREATE INDEX idx_conversations_wa_message_id ON consulta_credito.conversations USING btree (wa_message_id);
CREATE UNIQUE INDEX idx_conversations_wa_message_id_unique ON consulta_credito.conversations USING btree (wa_message_id) WHERE (wa_message_id IS NOT NULL);
CREATE INDEX idx_daily_metrics_date ON consulta_credito.daily_metrics USING btree (date);
CREATE INDEX idx_leads_automation ON consulta_credito.leads USING btree (pipeline_stage, status, wa_opted_in, wa_last_message_at);
CREATE INDEX idx_leads_cpf ON consulta_credito.leads USING btree (cpf);
CREATE INDEX idx_leads_created_at ON consulta_credito.leads USING btree (created_at);
CREATE INDEX idx_leads_phone ON consulta_credito.leads USING btree (phone);
CREATE INDEX idx_leads_source ON consulta_credito.leads USING btree (source);
CREATE INDEX idx_leads_status ON consulta_credito.leads USING btree (status);
CREATE INDEX idx_payments_created_at ON consulta_credito.payments USING btree (created_at);
CREATE INDEX idx_payments_gateway_id ON consulta_credito.payments USING btree (gateway_payment_id);
CREATE INDEX idx_payments_lead_id ON consulta_credito.payments USING btree (lead_id);
CREATE INDEX idx_payments_status ON consulta_credito.payments USING btree (status);
CREATE INDEX idx_rpa_jobs_cpf ON consulta_credito.rpa_jobs USING btree (cpf);
CREATE INDEX idx_rpa_jobs_lead ON consulta_credito.rpa_jobs USING btree (lead_id);
CREATE INDEX idx_rpa_jobs_status ON consulta_credito.rpa_jobs USING btree (status, next_retry_at);
CREATE INDEX idx_stage_transitions_lead ON consulta_credito.stage_transitions USING btree (lead_id);
CREATE INDEX idx_stage_transitions_stage ON consulta_credito.stage_transitions USING btree (to_stage);
CREATE INDEX idx_upsell_leads_lead_id ON consulta_credito.upsell_leads USING btree (lead_id);
CREATE INDEX idx_upsell_leads_status ON consulta_credito.upsell_leads USING btree (status);
CREATE INDEX idx_webhook_logs_created_at ON consulta_credito.webhook_logs USING btree (created_at);
CREATE INDEX idx_webhook_logs_event ON consulta_credito.webhook_logs USING btree (event_type, created_at);
CREATE INDEX idx_webhook_logs_source ON consulta_credito.webhook_logs USING btree (source);
CREATE UNIQUE INDEX leads_cpf_unique ON consulta_credito.leads USING btree (cpf) WHERE ((cpf IS NOT NULL) AND ((cpf)::text <> ''::text));

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER set_updated_at BEFORE UPDATE ON consulta_credito.admin_users FOR EACH ROW EXECUTE FUNCTION consulta_credito.update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON consulta_credito.daily_metrics FOR EACH ROW EXECUTE FUNCTION consulta_credito.update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON consulta_credito.leads FOR EACH ROW EXECUTE FUNCTION consulta_credito.update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON consulta_credito.payments FOR EACH ROW EXECUTE FUNCTION consulta_credito.update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON consulta_credito.rpa_jobs FOR EACH ROW EXECUTE FUNCTION consulta_credito.update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON consulta_credito.upsell_leads FOR EACH ROW EXECUTE FUNCTION consulta_credito.update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON consulta_credito.wa_templates FOR EACH ROW EXECUTE FUNCTION consulta_credito.update_updated_at_column();

-- ============================================================
-- FOREIGN KEYS
-- ============================================================

ALTER TABLE ONLY consulta_credito.conversations ADD CONSTRAINT conversations_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES consulta_credito.leads(id) ON DELETE CASCADE;
ALTER TABLE ONLY consulta_credito.leads ADD CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES consulta_credito.admin_users(id);
ALTER TABLE ONLY consulta_credito.leads ADD CONSTRAINT leads_consultation_done_by_fkey FOREIGN KEY (consultation_done_by) REFERENCES consulta_credito.admin_users(id);
ALTER TABLE ONLY consulta_credito.payments ADD CONSTRAINT payments_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES consulta_credito.leads(id) ON DELETE CASCADE;
ALTER TABLE ONLY consulta_credito.rpa_jobs ADD CONSTRAINT rpa_jobs_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES consulta_credito.leads(id);
ALTER TABLE ONLY consulta_credito.stage_transitions ADD CONSTRAINT stage_transitions_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES consulta_credito.leads(id) ON DELETE CASCADE;
ALTER TABLE ONLY consulta_credito.upsell_leads ADD CONSTRAINT upsell_leads_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES consulta_credito.leads(id);

-- ============================================================
-- VIEWS
-- ============================================================

CREATE VIEW consulta_credito.vw_funnel AS
 SELECT status,
    count(*) AS total,
    round((((count(*))::numeric * 100.0) / NULLIF(sum(count(*)) OVER (), (0)::numeric)), 1) AS percentage
   FROM consulta_credito.leads
  GROUP BY status
  ORDER BY
        CASE status
            WHEN 'registered'::text THEN 1
            WHEN 'contacted'::text THEN 2
            WHEN 'in_conversation'::text THEN 3
            WHEN 'payment_pending'::text THEN 4
            WHEN 'paid'::text THEN 5
            WHEN 'consulting'::text THEN 6
            WHEN 'completed'::text THEN 7
            WHEN 'converted'::text THEN 8
            ELSE NULL::integer
        END;

CREATE VIEW consulta_credito.vw_revenue_summary AS
 SELECT date_trunc('day'::text, paid_at) AS day,
    count(*) AS total_payments,
    sum(amount) AS total_revenue,
    avg(amount) AS avg_ticket,
    count(CASE WHEN ((payment_method)::text = 'pix'::text) THEN 1 ELSE NULL::integer END) AS pix_count,
    count(CASE WHEN ((payment_method)::text = 'credit_card'::text) THEN 1 ELSE NULL::integer END) AS card_count
   FROM consulta_credito.payments
  WHERE ((status)::text = 'approved'::text)
  GROUP BY (date_trunc('day'::text, paid_at))
  ORDER BY (date_trunc('day'::text, paid_at)) DESC;

-- ============================================================
-- SEED: Admin user for local dev
-- ============================================================

INSERT INTO consulta_credito.admin_users (name, email, password_hash, role)
VALUES (
    'Admin Local',
    'admin@local.dev',
    '$2a$10$DAFoccI3yBM.0TjQ9BCTy.oR5DpVgzfLjlawlKIRYYe5dPW7csELy', -- senha: admin123
    'admin'
) ON CONFLICT (email) DO NOTHING;
