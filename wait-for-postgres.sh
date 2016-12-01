#!/bin/bash

set -e

cmd="$1"

until psql "$DATABASE_URL" -c '\l'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command $cmd"
exec $cmd
