import { syncLiveInstagramPosts } from './sync_live_instagram.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
const envPaths = [
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', '..', '.env'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'server', '.env')
];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

let isAgentRunning = false;
let agentInterval = null;
let lastCheckTime = null;
let lastResult = null;

export async function runAgentCycle() {
  if (isAgentRunning) {
    console.log('[Instagram Agent] Previous cycle still running, skipping...');
    return { skipped: true, reason: 'Already running' };
  }

  isAgentRunning = true;
  lastCheckTime = new Date().toISOString();
  console.log(`\n[Instagram Agent] 🤖 Running automated Instagram check at ${new Date().toLocaleTimeString()}...`);

  try {
    const result = await syncLiveInstagramPosts(15);
    lastResult = result;
    if (result.freshlyFetched > 0) {
      console.log(`[Instagram Agent] 🎉 NEW INSTAGRAM POST(S) DETECTED & ADDED! Fresh profiles: ${result.freshlyFetched}. Total: ${result.totalProfiles}`);
    } else {
      console.log(`[Instagram Agent] ✓ Check complete. No new posts detected. Total proposals: ${result.totalProfiles}`);
    }
    return result;
  } catch (err) {
    console.warn('[Instagram Agent] Automated check encountered an issue:', err.message);
    lastResult = { success: false, error: err.message };
    return { success: false, error: err.message };
  } finally {
    isAgentRunning = false;
  }
}

export function startInstagramAgent(options = {}) {
  const intervalMinutes = Number(options.intervalMinutes) || 15;
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`[Instagram Agent] 🚀 Background agent started. Checking @nikah_bahrain every ${intervalMinutes} minutes.`);

  // Initial cycle after 10 seconds to allow server to bind ports cleanly
  setTimeout(() => {
    runAgentCycle().catch(() => {});
  }, 10000);

  if (agentInterval) clearInterval(agentInterval);
  agentInterval = setInterval(() => {
    runAgentCycle().catch(() => {});
  }, intervalMs);

  return {
    stop: () => {
      if (agentInterval) clearInterval(agentInterval);
      agentInterval = null;
      console.log('[Instagram Agent] Stopped.');
    },
    getStatus: () => ({
      running: isAgentRunning,
      lastCheckTime,
      lastResult,
      intervalMinutes
    })
  };
}

export function getAgentStatus() {
  return {
    isAgentRunning,
    lastCheckTime,
    lastResult
  };
}

// ─── CLI Entry ────────────────────────────────────────────────────────────────
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('Starting standalone Instagram Agent process...');
  startInstagramAgent({ intervalMinutes: 15 });
}
