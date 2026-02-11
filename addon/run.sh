#!/usr/bin/env bashio
set -e

PORT=$(bashio::config 'port')
HA_URL=$(bashio::config 'ha_url')
TOKEN=$(bashio::config 'token')
# Export allowed_networks as JSON for Python (bashio may not output JSON for lists)
ALLOWED_NETWORKS=$(python3 -c "import json; print(json.dumps(json.load(open('/data/options.json')).get('allowed_networks', [])))")

export PORT
export HA_URL
export TOKEN
export ALLOWED_NETWORKS

bashio::log.info "Thermostat Panel API starting on port ${PORT}"
cd /app && exec uvicorn main:app --host 0.0.0.0 --port "${PORT}"
