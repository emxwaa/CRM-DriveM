CREATE SCHEMA crm;
CREATE SCHEMA crm_jobs;
REVOKE ALL ON SCHEMA crm, crm_jobs FROM PUBLIC;
GRANT USAGE ON SCHEMA crm TO crm_web;
GRANT USAGE ON SCHEMA crm_jobs TO crm_worker;

CREATE TABLE crm.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120)
);
CREATE TABLE crm.profiles (
    auth_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 120)
);
CREATE TABLE crm.memberships (
    org_id uuid NOT NULL REFERENCES crm.organizations(id),
    auth_user_id uuid NOT NULL REFERENCES crm.profiles(auth_user_id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('owner','admin','manager','warehouse','finance','viewer')),
    active boolean NOT NULL DEFAULT true,
    PRIMARY KEY (org_id, auth_user_id)
);
CREATE INDEX memberships_user ON crm.memberships(auth_user_id);
CREATE TABLE crm.business_settings (
    org_id uuid PRIMARY KEY REFERENCES crm.organizations(id),
    currency text NOT NULL DEFAULT 'UAH' CHECK (currency = 'UAH'),
    timezone text NOT NULL DEFAULT 'Europe/Kyiv' CHECK (timezone = 'Europe/Kyiv')
);
CREATE TABLE crm.audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES crm.organizations(id),
    actor_id uuid NOT NULL,
    action text NOT NULL,
    occurred_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crm.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_profile ON crm.profiles FOR SELECT TO crm_web
    USING (auth_user_id = nullif(current_setting('crm.user_id', true), '')::uuid);
CREATE POLICY active_memberships ON crm.memberships FOR SELECT TO crm_web
    USING (active AND auth_user_id = nullif(current_setting('crm.user_id', true), '')::uuid);
CREATE POLICY scoped_org ON crm.organizations FOR SELECT TO crm_web
    USING (id = nullif(current_setting('crm.org_id', true), '')::uuid
           AND EXISTS (SELECT FROM crm.memberships m WHERE m.org_id = id));
CREATE POLICY scoped_settings ON crm.business_settings FOR SELECT TO crm_web
    USING (org_id = nullif(current_setting('crm.org_id', true), '')::uuid
           AND EXISTS (SELECT FROM crm.memberships m
                       WHERE m.org_id = business_settings.org_id AND m.role IN ('owner','admin')));

GRANT SELECT ON crm.organizations, crm.profiles, crm.memberships, crm.business_settings TO crm_web;

CREATE TABLE crm_jobs.smoke_effects (
    operation_id uuid PRIMARY KEY,
    completed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON crm_jobs.smoke_effects TO crm_worker;
