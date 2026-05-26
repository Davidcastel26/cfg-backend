#!/bin/sh
# Container entrypoint (ADR-B11 / §1.1):
#   1. Wait for PostgreSQL TCP readiness.
#   2. Run migrations (idempotent — Sequelize tracks SequelizeMeta).
#   3. Optionally seed when RUN_SEED=true.
#   4. exec the CMD as PID 1 so signals propagate (graceful shutdown).
set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"

echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT} ..."
i=0
until nc -z "${DB_HOST}" "${DB_PORT}"; do
  i=$((i + 1))
  if [ "${i}" -ge 30 ]; then
    echo "PostgreSQL not reachable after 30s — aborting." >&2
    exit 1
  fi
  sleep 1
done
echo "PostgreSQL is ready."

echo "Running database migrations ..."
npx sequelize-cli db:migrate

if [ "${RUN_SEED}" = "true" ]; then
  echo "RUN_SEED=true — running seeders ..."
  npx sequelize-cli db:seed:all
fi

exec "$@"
