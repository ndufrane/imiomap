#!/bin/bash

echo Sync Static Files.
python manage.py collectstatic --noinput  # Collect static files

echo Starting uWSGI.
exec /usr/local/bin/uwsgi --chdir=/usr/src/app \
    --module=imiomap.wsgi:application \
    --env DJANGO_SETTINGS_MODULE=imiomap.settings \
    --master --pidfile=/tmp/imiomap-master.pid \
    --socket :8000 \
    --processes=5 \
    --harakiri=20 \
    --max-requests=5000 \
    --vacuum