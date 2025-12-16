#!/bin/sh

# Smoketest script for the Java server in Docker

set -e  # Exit if fail

# Variables
IMAGE_FILE="java-server.tar.gz"
CONTAINER_NAME="java-server-test"
PORT=8119
URL="http://localhost:$PORT"
PAYLOAD='{ "numbers": [2, 2] }' # Test payload
EXPECTED=2
REPORT="smoketest-report.txt"
MAX_RETRIES=20
WAIT_SECONDS=2

echo "Running smoke test..." > "$REPORT"

echo "Loading Docker image from $IMAGE_FILE..."
gunzip -c "$IMAGE_FILE" | docker load

echo "Starting container $CONTAINER_NAME..."
docker run -d -p "$PORT:$PORT" --name "$CONTAINER_NAME" java-server

# Wait for the server to start and send test request
echo "Waiting for server to respond..."
for i in $(seq 1 "$MAX_RETRIES"); do
  RESPONSE=$(docker exec "$CONTAINER_NAME" curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Accept: text/plain" \
    -d "$PAYLOAD" \
    "$URL" || true)

  if [ -n "$RESPONSE" ]; then
    echo "Server responded after $i attempts."
    break
  fi

  echo "[$i/$MAX_RETRIES] Server not ready, retrying in $WAIT_SECONDS seconds..."
  sleep "$WAIT_SECONDS"
done

# Write results to report
echo "Payload: $PAYLOAD" >> "$REPORT"
echo "Expected result: $EXPECTED" >> "$REPORT"
echo "Response: $RESPONSE" >> "$REPORT"

# Validate results and write status to report
if [ "$RESPONSE" = "$EXPECTED" ]; then
  echo "Status: PASS" >> "$REPORT"
  STATUS=0
else
  echo "Status: FAIL" >> "$REPORT"
  # Write container logs in addition to the report if test fail
  echo "Container logs:" >> "$REPORT"
  docker logs "$CONTAINER_NAME" >> "$REPORT"
  STATUS=1
fi

echo "Stopping and removing container..."
docker stop "$CONTAINER_NAME"
docker rm "$CONTAINER_NAME"

exit "$STATUS"