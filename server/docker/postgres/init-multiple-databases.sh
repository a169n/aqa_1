#!/bin/sh
set -eu

if [ -z "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
  exit 0
fi

OLD_IFS="$IFS"
IFS=','

for database in $POSTGRES_MULTIPLE_DATABASES; do
  db="$(echo "$database" | xargs)"

  if [ -z "$db" ]; then
    continue
  fi

  echo "Creating database: $db"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
    SELECT 'CREATE DATABASE "$db"'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec
EOSQL
done

IFS="$OLD_IFS"
