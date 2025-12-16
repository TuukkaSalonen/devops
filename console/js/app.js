// Html elements
const loginDiv = document.getElementById("loginDiv");
const dashboardDiv = document.getElementById("dashboardDiv");

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

const logoutBtn = document.getElementById("logoutBtn");
const switchBtn = document.getElementById("switchBtn");
const discardBtn = document.getElementById("discardBtn");
const resetLogBtn = document.getElementById("resetLogBtn");
const addLogEntryBtn = document.getElementById("addLogEntryBtn");

const statusEl = document.getElementById("status");
const logsEl = document.getElementById("logs");
const accessTokenEl = document.getElementById("accessToken");
const versionEl = document.getElementById("version");

// Show/hide dashboard
function showDashboard() {
  loginDiv.style.display = "none";
  dashboardDiv.style.display = "block";
  fetchLogs();
  fetchContainerMetrics();

  setInterval(() => {
    fetchContainerMetrics();
    fetchLogs();
  }, 5000);
}

// Show login form
function showLogin() {
  loginDiv.style.display = "block";
  dashboardDiv.style.display = "none";
}

// Login form submit
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";

  const formData = new FormData(loginForm);
  const username = formData.get("username");
  const password = formData.get("password");

  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    if (!res.ok) throw new Error("Invalid credentials");
    accessTokenEl.textContent = await res
      .json()
      .then((data) => data.accessToken);
    showDashboard();
  } catch (err) {
    loginError.textContent = err.message;
  }
});

// Logout button
logoutBtn.addEventListener("click", async () => {
  try {
    // call backend to clear cookie
    await fetch("/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (e) {
    console.error("Logout error", e);
  }
  showLogin();
});

// Fetch logs
async function fetchLogs() {
  try {
    const res = await fetch("/logs", {
      credentials: "include",
    });
    logsEl.textContent = res.ok ? await res.text() : "Error fetching logs";
  } catch {
    logsEl.textContent = "Network error";
    showLogin();
  }
}

// Post to /status to add log entry
async function addLogEntry() {
  try {
    await fetch("/status", { method: "GET", credentials: "include" });
  } catch {
    showLogin();
  }
}

// Update container metrics table
async function updateContainerMetricsTable(data) {
  const tbody = document.querySelector("#containerMetricsTable tbody");
  tbody.innerHTML = "";

  data.containers.forEach((c) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.name}</td>
      <td>${c.image}</td>
      <td>${c.state}</td>
      <td>${c.status}</td>
      <td>${Math.floor(c.uptime)}</td>
      <td>${c.cpu}</td>
      <td>${c.memory}</td>
      <td>${c.memoryPercent}</td>
    `;
    tbody.appendChild(tr);
  });

  const tr2 = document.createElement("tr");
  tr2.innerHTML = `
      <td colspan="8">
        <strong>API Response Time Metrics (ms)</strong><br>
        Average: ${data.responseTimeMetrics.average.toFixed(2)} ms,
        Min: ${data.responseTimeMetrics.min.toFixed(2)} ms,
        Max: ${data.responseTimeMetrics.max.toFixed(2)} ms
      </td>
    `;
  tbody.appendChild(tr2);
}

// Fetch container metrics
async function fetchContainerMetrics() {
  try {
    const res = await fetch("/container-metrics", {
      credentials: "include",
    });
    const data = await res.json();
    updateContainerMetricsTable(data);
  } catch (err) {
    console.error("Error fetching status:", err);
    document.getElementById("containerMetrics").textContent =
      "Error fetching container metrics";
  }
}

// Switch version
switchBtn.addEventListener("click", async () => {
  try {
    switchBtn.disabled = true;
    switchBtn.textContent = "Switching...";
    const res = await fetch("/switch", {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    if (res.ok) {
      versionEl.textContent = `Version: ${data.version}`;
      fetchLogs();
      fetchContainerMetrics();
    } else {
      alert(data.error);
    }
  } catch {
    showLogin();
  }
  finally {
    switchBtn.disabled = false;
    switchBtn.textContent = "SWITCH VERSION";
  }
});

// Discard old
discardBtn.addEventListener("click", async () => {
  try {
    discardBtn.disabled = true;
    discardBtn.textContent = "Discarding...";
    const res = await fetch("/discard", {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    if (res.ok) {
      alert("Old version discarded successfully");
    } else {
      alert(data.error);
    }
  } catch {
    showLogin();
  } finally {
    discardBtn.disabled = false;
    discardBtn.textContent = "DISCARD OLD";
  }
});

// Reset log
resetLogBtn.addEventListener("click", async () => {
  try {
    await fetch("/resetlog", { method: "POST", credentials: "include" });
    fetchLogs();
  } catch {
    showLogin();
  }
});

// Reset log
addLogEntryBtn.addEventListener("click", async () => {
  try {
    await fetch("/status", { method: "GET", credentials: "include" });
    fetchLogs();
  } catch {
    showLogin();
  }
});

// Check if JWT cookie exists on page load
(async () => {
  try {
    const res = await fetch("/check", { credentials: "include" });

    if (!res.ok) {
      showLogin();
      return;
    }

    const data = await res.json();

    if (!data.accessToken) {
      showLogin();
      return;
    }

    accessTokenEl.textContent = data.accessToken;
    showDashboard();
  } catch (error) {
    console.log("Network error", error);
    showLogin();
  }
})();
