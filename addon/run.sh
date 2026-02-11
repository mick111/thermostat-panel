#!/usr/bin/env sh
set -e

# Lecture de la config depuis /data/options.json (pas d'appel à l'API Supervisor)
OPTIONS_FILE="/data/options.json"
if [ -f "$OPTIONS_FILE" ]; then
  PORT=$(python3 -c "import json; print(json.load(open('$OPTIONS_FILE')).get('port', 8765))")
  HA_URL=$(python3 -c "import json; print(json.load(open('$OPTIONS_FILE')).get('ha_url', 'http://supervisor/core'))")
  TOKEN=$(python3 -c "import json; print(json.load(open('$OPTIONS_FILE')).get('token', ''))")
  ALLOWED_NETWORKS=$(python3 -c "import json; print(json.dumps(json.load(open('$OPTIONS_FILE')).get('allowed_networks', [])))")
else
  PORT=8765
  HA_URL="http://supervisor/core"
  TOKEN=""
  ALLOWED_NETWORKS="[]"
fi

export PORT
export HA_URL
export TOKEN
export ALLOWED_NETWORKS

echo "Thermostat Panel API starting on port ${PORT}"
cd /app && exec uvicorn main:app --host 0.0.0.0 --port "${PORT}"
