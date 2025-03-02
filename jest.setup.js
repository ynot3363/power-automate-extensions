const originalWarn = console.warn;
console.warn = (message, ...args) => {
  if (
    (typeof message === "string" &&
      message.includes("Failed to detect the Azure Functions runtime")) ||
    (typeof message === "string" &&
      message.includes("Skipping call to register function"))
  ) {
    return;
  }
  originalWarn(message, ...args);
};
