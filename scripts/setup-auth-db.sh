#!/bin/bash

# Setup authentication database tables
echo "Setting up authentication database tables..."

# Check if we're using local database
if [ "$USE_LOCAL_DB" = "true" ]; then
    echo "Using local database..."
    PGPASSWORD=$LOCAL_DB_PASSWORD psql -h $LOCAL_DB_HOST -p $LOCAL_DB_PORT -U $LOCAL_DB_USER -d $LOCAL_DB_NAME -f schema.sql
else
    echo "Using production database..."
    psql $POSTGRES_URL -f schema.sql
fi

echo "Database setup complete!" 