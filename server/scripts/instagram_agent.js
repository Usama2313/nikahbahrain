// Instagram background agent — DISABLED
// Scraping has been permanently removed. This file is kept as a stub
// to avoid import errors in any code that may still reference it.

export async function runAgentCycle() {
  return { skipped: true, reason: 'Instagram scraping is disabled' };
}

export function startInstagramAgent() {
  // No-op: scraping is disabled
  return {
    stop: () => {},
    getStatus: () => ({ running: false, lastCheckTime: null, lastResult: null })
  };
}

export function getAgentStatus() {
  return { isAgentRunning: false, lastCheckTime: null, lastResult: null };
}
