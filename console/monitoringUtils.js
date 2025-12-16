// Calculate CPU usage percentage
const calculateCPUPercent = (stats) => {
  const cpuDelta =
    stats.cpu_stats.cpu_usage.total_usage -
    stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta =
    stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  const cpuCount = stats.cpu_stats.online_cpus || 1;
  return ((cpuDelta / systemDelta) * cpuCount * 100).toFixed(2);
};

// Calculate memory usage percentage
const calculateMemoryUsagePercentage = (stats) => {
  return ((stats.memory_stats.usage / stats.memory_stats.limit) * 100).toFixed(
    2
  );
};

// Get memory usage string in MB
const getMemoryUsage = (stats) => {
  return `${(stats.memory_stats.usage / 1024 / 1024).toFixed(2)} MB / ${(
    stats.memory_stats.limit /
    1024 /
    1024
  ).toFixed(2)} MB`;
};

// Calculate uptime in seconds
const calculateUpTime = (created) => {
  return (Date.now() - new Date(created * 1000).getTime()) / 1000;
};

const calculateResponseTimeMetrics = (apiResponseTimes) => {
  let metrics = {
    average: 0,
    min: 0,
    max: 0,
  };
  
  if (apiResponseTimes.length === 0) return metrics;

  const sum = apiResponseTimes.reduce((a, b) => a + b, 0);
  metrics.average = sum / apiResponseTimes.length;
  metrics.min = Math.min(...apiResponseTimes);
  metrics.max = Math.max(...apiResponseTimes);

  return metrics;
};

module.exports = {
  calculateCPUPercent,
  calculateMemoryUsagePercentage,
  getMemoryUsage,
  calculateUpTime,
  calculateResponseTimeMetrics,
};
