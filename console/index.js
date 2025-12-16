const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const cookie = require("cookie");
const Docker = require("dockerode");
const docker = new Docker({ socketPath: "/var/run/docker.sock" });
const { exec } = require("child_process");

const {
  calculateCPUPercent,
  getMemoryUsage,
  calculateMemoryUsagePercentage,
  calculateUpTime,
  calculateResponseTimeMetrics,
} = require("./monitoringUtils");

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || "jwtsecret";
const port = process.env.PORT || 8083;
const TARGET_HOST = process.env.TARGET_HOST || "localhost";

const apiResponseTimes = [];

app.use(cookieParser());
app.use(bodyParser.json());

app.use("/", express.static(path.join(__dirname, "html")));
app.use("/js", express.static(path.join(__dirname, "js")));

// JWT verification
const verifyJWT = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
};

// Middleware to measure API response time
const responseTime = (req, res, next) => {
  const start = performance.now();
  res.on("finish", () => {
    const duration = performance.now() - start;
    apiResponseTimes.push(duration);
    if (apiResponseTimes.length > 1000) {
      apiResponseTimes.shift();
    }
  });
  next();
};

// Helper to parse token from cookies
const getParsedToken = (req) => {
  const cookies = req.headers.cookie;
  if (!cookies) return null;

  const parsed = cookie.parse(cookies);
  const token = parsed.token;
  return token;
};

// Container metrics endpoint
app.get("/container-metrics", async (req, res) => {
  try {
    const containers = [
      "console_green",
      "service1_green",
      "service2_green",
      "storage",
    ];

    const results = { containers: [], responseTimeMetrics: {} };
    const allContainers = await docker.listContainers({ all: true });

    for (const name of containers) {
      const cInfo = allContainers.find((c) => c.Names.includes(`/${name}`));
      if (!cInfo) continue;

      const container = docker.getContainer(cInfo.Id);
      const stats = await container.stats({ stream: false });

      results.containers.push({
        name,
        image: cInfo.Image,
        state: cInfo.State,
        status: cInfo.Status,
        uptime: calculateUpTime(cInfo.Created),
        cpu: calculateCPUPercent(stats),
        memory: getMemoryUsage(stats),
        memoryPercent: calculateMemoryUsagePercentage(stats),
      });
    }
    results.responseTimeMetrics =
      calculateResponseTimeMetrics(apiResponseTimes);

    res.json(results);
  } catch (err) {
    console.error("Error fetching container status:", err);
    res.status(500).send("Error fetching container status");
  }
});

// Apply response time used after defining /container-metrics route to avoid measuring its time
app.use(responseTime);

// Login endpoint to issue JWT token cookie and return token in response
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ user: ADMIN_USER }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      path: "/",
      maxAge: 3600000, // 1 hour
    });
    return res.json({ accessToken: token });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

// Token check endpoint, return current token if logged in
app.get("/check", verifyJWT, (req, res) => {
  res.status(200).json({ accessToken: getParsedToken(req) });
});

// Logout endpoint to clear JWT cookie
app.post("/logout", (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.json({ success: true });
});

// Log endpoint to fetch logs from service1
app.get("/logs", verifyJWT, async (req, res) => {
  try {
    const token = getParsedToken(req);
    if (!token) return res.status(401).send("Not authenticated");

    const logs = await fetch("http://service1_green:8080/log", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const logText = await logs.text();
    res.send(logText);
  } catch {
    res.status(500).send("Error reading logs");
  }
});

// Status endpoint to add log entry
app.get("/status", verifyJWT, async (req, res) => {
  try {
    const token = getParsedToken(req);
    if (!token) return res.status(401).send("Not authenticated");

    const statusResponse = await fetch("http://service1_green:8080/status", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const statusText = await statusResponse.text();
    res.send(statusText);
  } catch {
    res.status(500).send("Error fetching status");
  }
});

// Switch version endpoint
app.post("/switch", verifyJWT, (req, res) => {
  try {
    const cmd = `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i /root/.ssh/id_rsa ubuntu@${TARGET_HOST} "sudo /usr/local/bin/switch_version.sh blue"`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error("Switch failed:", err, stderr);
        return res
          .status(500)
          .json({
            error:
              "Failed to switch version. Make sure the other version is available and running.",
          });
      }
      res.status(200).json({ version: "1.0" });
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        error:
          "Failed to switch version. Make sure the other version is available and running.",
      });
  }
});

// Discard old version endpoint: stop old version containers
app.post("/discard", verifyJWT, async (req, res) => {
  try {
    const composeFile = "/opt/project_1-0/docker-compose.yml";
    const cmd = `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i /root/.ssh/id_rsa ubuntu@${TARGET_HOST} "sudo docker compose -f ${composeFile} down"`;

    exec(cmd, (error) => {
      if (error) {
        console.error(`Failed to bring down blue version: ${error.message}`);
        return res.status(500).json({ error: "Failed to discard old version" });
      }
      res.json({ success: true, message: "Blue version discarded" });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to discard old version" });
  }
});

// Reset logs endpoint to delete logs
app.post("/resetlog", verifyJWT, async (req, res) => {
  try {
    const token = getParsedToken(req);
    if (!token) return res.status(401).send("Not authenticated");

    const deleted = await fetch("http://service1_green:8080/log", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const deletedText = await deleted.text();
    res.send(deletedText);
  } catch {
    res.status(500).send("Error deleting logs");
  }
});

// Serve main HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "html/index.html"));
});

if (require.main === module) {
  app.listen(port, () =>
    console.log(`Management console running on port ${port}`)
  );
}

module.exports = app;
