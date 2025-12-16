import os
import shutil
import requests
import math
import sys
from flask import Flask, make_response
from datetime import datetime, timezone

app = Flask(__name__)
app.config["PORT"] = os.getenv("PORT", 8081)
app.config["STORAGE_PORT"] = os.getenv("STORAGE_PORT", 8082)

@app.route("/status", methods=["GET"])
def status():
    print("Service 2: status request received")
    sys.stdout.flush()

    timestamp = (datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z"))
    uptime = "-1"
    free_diskspace = "-1"

    try:
        with open("/proc/uptime") as file:
            uptime_seconds = float(file.read().split()[0])
            uptime = "{:.2f}".format(uptime_seconds / 60)
    except Exception as e:
        print("Error reading uptime:", e)

    try:
        free_diskspace = math.floor(shutil.disk_usage("/").free / (1024 * 1024))
    except Exception as e:
        print("Error reading disk space:", e)

    statusRecord = f"Service 2: {timestamp}: uptime {uptime} minutes, free disk in root: {free_diskspace} MBytes"

    response = make_response(statusRecord)
    response.mimetype = "text/plain"

    try:
        storage_url = f"http://storage:{app.config['STORAGE_PORT']}/log"
        requests.post(
            storage_url, data=statusRecord, headers={"Content-Type": "text/plain"}
        )
    except Exception as e:
        print(f"Error sending status record to storage: {e}")

    return response

if __name__ == "__main__":
    port = int(app.config["PORT"])
    print("Service 2 listening")
    app.run(host="0.0.0.0", port=port, debug=True)
