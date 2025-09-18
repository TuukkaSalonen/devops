import express, { response } from "express";
import proxy from "express-http-proxy";
import os from "os";
import checkDiskSpace from "check-disk-space";
import axios from "axios";
import fs from "fs";

const env = process.env;

const port = env.PORT || 8080;
const service2Port = env.SERVICE2_PORT || 8081;
const storagePort = env.STORAGE_PORT || 1234;

const vstorage_file = "/vstorage.txt";

const app = express();

app.get("/status", async (req, res) => {
  try {
    console.log("Service 1: status request received");

    const { free } = await checkDiskSpace("/");

    const freeDiskMB = Math.floor(free / 1024 / 1024);
    const uptimeHours = (os.uptime() / 3600).toFixed(2);

    const statusRecord = `${new Date().toISOString()}: uptime ${uptimeHours} hours, free disk in root: ${freeDiskMB} MBytes`;

    const storageResponse = await axios.post(`http://storage:${storagePort}/log`, statusRecord, {
      headers: { "Content-Type": "text/plain" },
    });

    if (storageResponse.status === 500) {
      console.error(`Error sending status record to storage: ${storageResponse.data}`);
    }

    try {
      fs.appendFileSync(vstorage_file, statusRecord + "\n");
    } catch (err) {
      console.error("Error writing to vstorage file:", err);
    }

    const service2Response = await axios.get(
      `http://service2:${service2Port}/status`
    );

    const combinedRecord = `${statusRecord}\n${service2Response.data}`;

    res.contentType("text/plain");
    res.send(combinedRecord).status(200);
  } catch (err) {
    console.error("Error sending status record:", err);
    res.status(500).send("Failed to post status record");
  }
});

app.get("/log", proxy(`http://storage:${storagePort}`));

app.get("/", (req, res) => {
  res.send("Service 1: use /status or /log");
});

app.listen(port, () => {
  console.log(`Service 1 listening`);
});
