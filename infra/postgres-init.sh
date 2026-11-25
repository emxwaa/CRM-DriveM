#!/bin/sh
set -eu
psql -X -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
\getenv web WEB_DB_PASSWORD
\getenv worker WORKER_DB_PASSWORD
\getenv auth GOTRUE_DB_PASSWORD
CREATE ROLE crm_web LOGIN PASSWORD :'web';
CREATE ROLE crm_worker LOGIN PASSWORD :'worker';
CREATE ROLE crm_auth LOGIN PASSWORD :'auth';
CREATE SCHEMA auth AUTHORIZATION crm_auth;
SQL
