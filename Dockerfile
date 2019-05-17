FROM python:3.6.7-stretch

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client libgdal-dev binutils python-gdal \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY . .
RUN pip install uwsgi
RUN chmod +x ./uwsgi.sh
RUN mkdir static && python manage.py collectstatic --noinput
EXPOSE 8000
USER root
CMD ["./uwsgi.sh"]
