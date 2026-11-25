FROM postgres:17.9-alpine
COPY --chmod=444 postgres-init.sh /docker-entrypoint-initdb.d/01-roles.sh
