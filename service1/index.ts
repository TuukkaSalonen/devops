import express from "express";
import type { Request, Response, NextFunction } from "express";
import proxy from "express-http-proxy";
import os from "os";
import checkDiskSpace from "check-disk-space";
import axios from "axios";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const env = process.env;

const service2Port = env.SERVICE2_PORT || 8081;
const storagePort = env.STORAGE_PORT || 8082;
const JWT_SECRET = env.JWT_SECRET || "jwtsecret";

const app = express();
app.use(cookieParser());
app.use(express.json());
  
const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  console.log("Verifying JWT:", token);
  
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    (req as any).user = payload;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
};

app.get("/status", verifyJWT, async (req, res) => {
  try {
    console.log("Service 1: status request received");

    const { free } = await checkDiskSpace("/");

    const freeDiskMB = Math.floor(free / 1024 / 1024);
    const uptimeMinutes = (os.uptime() / 60).toFixed(2);

    const statusRecord = `Service 1: ${new Date().toISOString()}: uptime ${uptimeMinutes} minutes, free disk in root: ${freeDiskMB} MBytes`;

    const storageResponse = await axios.post(
      `http://storage:${storagePort}/log`,
      statusRecord,
      {
        headers: { "Content-Type": "text/plain" },
      }
    );

    if (storageResponse.status === 500) {
      console.error(
        `Error sending status record to storage: ${storageResponse.data}`
      );
    }

    const service2Response = await axios.get(
      `http://service2_green:${service2Port}/status`
    );

    const combinedRecord = `${statusRecord}\n${service2Response.data}`;

    res.contentType("text/plain");
    res.send(combinedRecord).status(200);
  } catch (err) {
    console.error("Error sending status record:", err);
    res.status(500).send("Failed to post status record");
  }
});

app.get("/log", verifyJWT, proxy(`http://storage:${storagePort}`));

app.delete("/log", verifyJWT, proxy(`http://storage:${storagePort}`));

app.get("/", verifyJWT, (req, res) => {
  res.send("Service 1: use /status or /log");
});

export default app;
