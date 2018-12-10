#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE urban_locality_cadastre OWNER docker;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname urban_locality_cadastre <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS postgis;
EOSQL