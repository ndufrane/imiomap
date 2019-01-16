FROM python:2.7-stretch

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client binutils git build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN pip install virtualenv
RUN find / -name virtualenv
RUN ln -s /usr/local/bin/virtualenv /usr/local/bin/virtualenv-2.7
WORKDIR /usr/src/app
RUN git clone https://github.com/IMIO/server.urban.git -b new_map_viewer urban.newmapviewer
WORKDIR /usr/src/app/urban.newmapviewer
RUN make


EXPOSE 8000
CMD ["bin/instance1", "fg"]
 