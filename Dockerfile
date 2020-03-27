FROM python:3.7-slim-buster

ARG SEARX_GID=1005
ARG SEARX_UID=1005

ENV INITRD=no
ENV DEBIAN_FRONTEND=noninteractive

# ENV FIREFOX_URL="https://download.mozilla.org/?product=firefox-latest-ssl&os=linux64&lang=en-US" 
ENV FIREFOX_URL="https://ftp.mozilla.org/pub/firefox/releases/74.0/linux-x86_64/en-US/firefox-74.0.tar.bz2"

WORKDIR /usr/local/searxstats/

RUN addgroup --gid ${SEARX_GID} searxstats \
 && adduser --system -u ${SEARX_UID} --home /usr/local/searxstats --shell /bin/sh --gid ${SEARX_GID} searxstats \
 && chown searxstats:searxstats /usr/local/searxstats

COPY requirements.txt ./

RUN apt-get update \
 && apt-get -y --no-install-recommends install \
    wget git build-essential python3-dev libxslt1-dev zlib1g-dev libffi-dev libssl-dev libyaml-dev \
    tor tini bzip2 nodejs \
    $(apt-cache depends --no-recommends --no-suggests --no-conflicts --no-breaks \
      --no-replaces --no-enhances --no-pre-depends firefox-esr | grep -v "firefox-esr" | cut -f2 -d\:) \
 && pip3 install --upgrade pip \
 && pip3 install --no-cache -r requirements.txt \
 && cd /usr/local/searxstats/output/static \
 && npm install \
 && cd /usr/local/searxstats \
 && apt-get -y purge build-essential python3-dev libxslt1-dev zlib1g-dev \
 && apt-get -y --no-install-recommends install libxslt1.1 libxml2 zlib1g libffi6 libssl1.1 \
 && apt-get -y autoremove \
 && apt-get -y clean \
 && mkdir -p /opt \
 && wget -nv --show-progress --progress=bar:force:noscroll -O /opt/firefox.tar.bz2 "${FIREFOX_URL}" \
 && tar xjf /opt/firefox.tar.bz2 -C /opt \
 && rm /opt/firefox.tar.bz2 \
 && mkdir /usr/local/searxstats/cache

COPY --chown=searxstats:searxstats . /usr/local/searxstats

RUN /usr/local/searxstats/utils/install-geckodriver /usr/local/bin

USER searxstats
ENTRYPOINT [ "/usr/bin/tini", "--", "/usr/local/searxstats/docker-entrypoint.sh" ]
