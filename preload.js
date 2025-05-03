// Expose limited safe APIs if needed in future
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("ghost", {
  version: "0.1.0",
});
