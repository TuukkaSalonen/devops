#!/bin/sh

# Simple test script for the Java server

set -e  # Exit if fail

# Variables
TEST_REPORT="test-report.txt"
PAYLOAD='{ "numbers": [2, 3, 7, 8] }' # Test payload
EXPECTED_RESULT=5
URL="http://localhost:8119"

echo "Running API test..." > "$TEST_REPORT"

# Send test request
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: text/plain" \
  -d "$PAYLOAD" \
  "$URL")

# Write results to report
echo "Payload: $PAYLOAD" >> "$TEST_REPORT"
echo "Expected result: $EXPECTED_RESULT" >> "$TEST_REPORT"
echo "Response: $RESPONSE" >> "$TEST_REPORT"

# Validate results and write status to report
if [ "$RESPONSE" -eq "$EXPECTED_RESULT" ]; then
  echo "Status: Test passed" >> "$TEST_REPORT"
else
  echo "Status: Test failed" >> "$TEST_REPORT"
  exit 1
fi
