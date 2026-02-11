ARG BUILD_FROM
FROM $BUILD_FROM

ARG BUILD_ARCH
ARG BUILD_VERSION

# Python + pip
RUN apk add --no-cache python3 py3-pip

# Backend dependencies
RUN pip3 install --no-cache-dir fastapi uvicorn httpx

WORKDIR /app
COPY main.py /app/
COPY static/ /app/static/
COPY run.sh /
RUN chmod a+x /run.sh

LABEL \
    io.hass.version="${BUILD_VERSION}" \
    io.hass.type="addon" \
    io.hass.arch="${BUILD_ARCH}"

CMD ["/run.sh"]
