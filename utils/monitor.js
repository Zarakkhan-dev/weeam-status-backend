const axios = require("axios");
const WebSocket = require("ws");
const Service = require("../models/service.model");

const services = [
  { name: "Live API", url: "https://liveapi.weeam.info", method: "GET" },
  {
    name: "Python Notifications",
    url: "https://pylive.weeam.info",
    method: "GET",
  },
  {
    name: "WebSocket Server",
    url: "wss://pylive.weeam.info/ws/12",
    method: "WS",
  },
  {
    name: "SIP_WebRTC Server",
    url: "https://webrtc.weeam.info/ping",
    method: "GET",
  },
];

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

    ws.on("error", () => {
      clearTimeout(timeout);
      reject();
    });
  });
};

const saveStatus = async (name, url, status, responseTime) => {
  await Service.create({
    serviceName: name,
    url,
    status,
    responseTime,
    timestamp: new Date(),
  });
};

const checkServices = async () => {
  for (const service of services) {
    const start = Date.now();
    try {
      if (service.method === "WS") {
        await checkWebSocket(service.url);
      } else {
        await axios.get(service.url, { timeout: 2000 });
      }

      await saveStatus(service.name, service.url, "Up", Date.now() - start);
    } catch {
      await saveStatus(service.name, service.url, "Down", null);
    }
  }
};

module.exports = {
  startScheduler: () => {
    setInterval(checkServices, 60 * 60 * 1000);
    checkServices();
  },
  runCheckNow: checkServices,
};
