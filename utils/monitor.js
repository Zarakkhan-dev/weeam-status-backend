const axios = require("axios");
const WebSocket = require("ws");
const Service = require("../models/service.model");

const services = [
  { name: "Live API", url: "https://liveapi.weeam.info", method: "GET" },
  { name: "Python Notifications", url: "https://pylive.weeam.info", method: "GET" },
  { name: "WebSocket Server", url: "wss://pylive.weeam.info/ws/12", method: "WS" },
  { name: "SIP_WebRTC Server", url: "https://webrtc.weeam.info/ping", method: "GET" },
];

// Track ongoing downtimes
const ongoingDowntimes = {};

const checkWebSocket = (url) => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timeout = setTimeout(() => {
      ws.terminate();
      reject(new Error("WebSocket timeout"));
    }, 2000);

    ws.on("open", () => {
      clearTimeout(timeout);
      ws.close();
      resolve();
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
};

const saveStatus = async (name, status, responseTime, isClientTriggered = false) => {
  const timestamp = new Date();
  const record = await Service.create({
    serviceName: name,
    status,
    responseTime,
    timestamp,
    isClientTriggered,
  });

  // Track downtimes
  if (status === "Down") {
    if (!ongoingDowntimes[name]) {
      ongoingDowntimes[name] = { start: timestamp };
    }
  } else {
    if (ongoingDowntimes[name]) {
      const downtime = {
        ...ongoingDowntimes[name],
        end: timestamp,
        duration: timestamp - ongoingDowntimes[name].start
      };
      // Here you could save the downtime to a separate collection if needed
      delete ongoingDowntimes[name];
    }
  }

  return record;
};

const checkService = async (service) => {
  const start = Date.now();
  try {
    if (service.method === "WS") {
      await checkWebSocket(service.url);
    } else {
      await axios.get(service.url, { timeout: 2000 });
    }
    return { status: "Up", responseTime: Date.now() - start };
  } catch (error) {
    console.error(`Error checking ${service.name}:`, error.message);
    return { status: "Down", responseTime: null };
  }
};

const checkServices = async (isClientTriggered = false) => {
  for (const service of services) {
    const { status, responseTime } = await checkService(service);
    await saveStatus(service.name, status, responseTime, isClientTriggered);
  }
};

module.exports = {
  startScheduler: () => {
    // Check every 5 minutes
    setInterval(() => checkServices(false), 5 * 60 * 1000);
    checkServices(false);
  },
  runCheckNow: (isClientTriggered = false) => checkServices(isClientTriggered)
};