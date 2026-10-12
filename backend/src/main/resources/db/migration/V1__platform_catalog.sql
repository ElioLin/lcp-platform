CREATE SCHEMA lcp_business;

CREATE TABLE lcp.app_user (
    id UUID PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    display_name VARCHAR(120) NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','USER')),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lcp.object_definition (
    id UUID PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE CHECK (name ~ '^[a-z][a-z0-9_]{1,49}$'),
    label VARCHAR(100) NOT NULL,
    description VARCHAR(1000) NOT NULL DEFAULT '',
    state VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (state IN ('DRAFT','PUBLISHED')),
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ
);

CREATE TABLE lcp.field_definition (
    id UUID PRIMARY KEY,
    object_id UUID NOT NULL REFERENCES lcp.object_definition(id),
    name VARCHAR(50) NOT NULL CHECK (name ~ '^[a-z][a-z0-9_]{1,49}$'),
    label VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('TEXT','LONG_TEXT','DECIMAL','INTEGER','DATE','BOOLEAN','OPTION')),
    required BOOLEAN NOT NULL DEFAULT FALSE,
    precision_value INTEGER,
    scale_value INTEGER,
    options JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(options) = 'array'),
    position INTEGER NOT NULL,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(object_id, name),
    CHECK ((type = 'DECIMAL' AND precision_value BETWEEN 1 AND 38 AND scale_value BETWEEN 0 AND precision_value) OR
           (type <> 'DECIMAL' AND precision_value IS NULL AND scale_value IS NULL))
);

CREATE TABLE lcp.audit_event (
    id UUID PRIMARY KEY,
    object_id UUID REFERENCES lcp.object_definition(id),
    record_id UUID,
    actor_id UUID NOT NULL REFERENCES lcp.app_user(id),
    action VARCHAR(50) NOT NULL,
    detail JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX audit_record_idx ON lcp.audit_event(object_id, record_id, created_at DESC);

-- Spring Session's PostgreSQL schema, owned by the platform migration lifecycle.
CREATE TABLE lcp.spring_session (
    primary_id CHAR(36) NOT NULL PRIMARY KEY,
    session_id CHAR(36) NOT NULL,
    creation_time BIGINT NOT NULL,
    last_access_time BIGINT NOT NULL,
    max_inactive_interval INT NOT NULL,
    expiry_time BIGINT NOT NULL,
    principal_name VARCHAR(100)
);
CREATE UNIQUE INDEX spring_session_id_idx ON lcp.spring_session(session_id);
CREATE INDEX spring_session_expiry_idx ON lcp.spring_session(expiry_time);
CREATE INDEX spring_session_principal_idx ON lcp.spring_session(principal_name);
CREATE TABLE lcp.spring_session_attributes (
    session_primary_id CHAR(36) NOT NULL REFERENCES lcp.spring_session(primary_id) ON DELETE CASCADE,
    attribute_name VARCHAR(200) NOT NULL,
    attribute_bytes BYTEA NOT NULL,
    PRIMARY KEY(session_primary_id, attribute_name)
);
