FROM ubuntu:16.04
# RUN locale-gen en_US.UTF-8
# ENV LANG en_US.UTF-8
# ENV LANGUAGE en_US:en
# ENV LC_ALL en_US.UTF-8
ENV DEBIAN_FRONTEND noninteractive
# RUN timedatectl list-timezones
# RUN timedatectl set-timezone Europe/Brussels

RUN apt-get -qy update && apt-get -o APT::Install-Recommends=false -qy install \
        bash-completion \
        curl \
        htop \
        locales \
        make \
        ncurses-term \
        software-properties-common \
        telnet \
        tzdata \
        vim

RUN ln -sf /usr/share/zoneinfo/Europe/Brussels /etc/localtime
RUN echo "Europe/Brussels" > /etc/timezone; dpkg-reconfigure tzdata

RUN groupadd -g 209 imio
RUN useradd --shell /bin/bash -u 913 -g 209 -o -c "IMIO base user" -m imio


ARG repo=server.urban
# Removed libtiff5-dev
RUN utily="python-pip" \
  && buildDeps="libpq-dev wget git python-virtualenv gcc libc6-dev libpcre3-dev libssl-dev libxml2-dev libxslt1-dev libbz2-dev libffi-dev libjpeg62-dev libopenjp2-7-dev zlib1g-dev python-dev subversion git" \
  && runDeps="poppler-utils wv rsync lynx netcat libxml2 libxslt1.1 libjpeg62 libtiff5 libopenjp2-7" \
  && apt-get update \
  && apt-get install -y --no-install-recommends $buildDeps \
  && apt-get install -y --no-install-recommends $utily \
  && pip install pip==10.0.1 \
  && mkdir /home/imio/.buildout
COPY default.cfg /home/imio/.buildout/default.cfg
COPY default.cfg /root/.buildout/default.cfg

RUN mkdir -p /srv/cache/extends
RUN mkdir -p /srv/cache/eggs
RUN mkdir -p /srv/cache/download

VOLUME /srv/cache/extends
VOLUME /srv/cache/eggs
VOLUME /srv/cache/download

RUN chown -R imio:imio /home/imio/
#RUN chown -R imio:imio /srv/cache/

#USER imio
RUN git clone https://github.com/IMIO/${repo}.git -b new_map_viewer /home/imio/urban
WORKDIR /home/imio/urban
COPY requirements.txt /home/imio/urban/requirements.txt
RUN pip install --user -I -r requirements.txt
RUN ls -l /srv/cache/extends
RUN ls -l /srv/cache/eggs
RUN PATH=/root/.local/bin:$PATH \
  && ls -l /srv/cache/eggs \
  && ls -l /srv/cache/extends \
  && ls -l /srv/cache/download \
  && buildout -t 60 -c prod.cfg
USER root
WORKDIR /home/imio/
#RUN apt-get purge -y --auto-remove $buildDeps \
#  && apt-get install -y --no-install-recommends $runDeps \
#  && rm -rf /var/lib/apt/lists/* \
#  && rm -rf urban \
#  && rm -rf /home/imio/.buildout/downloads/*
 