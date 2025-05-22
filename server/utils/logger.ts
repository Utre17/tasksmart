/**
 * Custom logger utility for clean console output
 */

/**
 * Log a message with a timestamp and optional source
 */
export function log(message: string, source = "server") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Log an error message
 */
export function error(message: string, error?: any, source = "server") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.error(`${formattedTime} [${source}] ERROR: ${message}`);
  if (error) {
    console.error(error);
  }
}

/**
 * Log a warning message
 */
export function warn(message: string, source = "server") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.warn(`${formattedTime} [${source}] WARNING: ${message}`);
}

/**
 * Log a debug message (only in development)
 */
export function debug(message: string, data?: any, source = "server") {
  if (process.env.NODE_ENV !== "production") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    console.debug(`${formattedTime} [${source}] DEBUG: ${message}`);
    if (data) {
      console.debug(data);
    }
  }
} 