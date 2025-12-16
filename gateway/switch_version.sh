#!/bin/sh

VERSION="$1"

if [ "$VERSION" != "blue" ] && [ "$VERSION" != "green" ]; then
  echo "Invalid version: $VERSION"
  exit 1
fi


REQUIRED_CONTAINERS="
service1_$VERSION
service2_$VERSION
console_$VERSION
storage
"

# Check that all required containers are running
for CONTAINER in $REQUIRED_CONTAINERS; do
  STATE=$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null)

  if [ "$STATE" != "true" ]; then
    echo "ERROR: Container $CONTAINER is NOT running"
    exit 2
  fi
done

ln -sfn /etc/nginx/project_"$VERSION".conf /etc/nginx/conf.d/project.conf

nginx -s reload