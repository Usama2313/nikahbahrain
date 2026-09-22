/**
 * extract_video_frames.mjs
 * Extracts frames from the Instagram video and maps them to profiles.
 * Uses ffmpeg-static npm package for the ffmpeg binary.
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const require    = createRequire(import.meta.url);

const VIDEO_PATH      = "C:\\Users\\Syed\\Downloads\\instagram posts.mp4";
const UPLOADS_DIR     = path.join(__dirname, "..", "public",  "uploads");
const CLIENT_UPLOADS  = path.join(__dirname, "..", "..", "client", "public", "uploads");
const PROFILES_PATH   = path.join(__dirname, "..", "data",    "profiles.json");
const CLIENT_PROFILES = path.join(__dirname, "..", "..", "client", "src", "data", "profiles.json");
const FRAMES_DIR      = path.join(__dirname, "..", "public",  "uploads", "frames_tmp");

for (const d of [UPLOADS_DIR, CLIENT_UPLOADS, FRAMES_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function findFFmpeg() {
  // 1. Try ffmpeg-static npm package
  try {
    const ffmpegStatic = require("ffmpeg-static");
    if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
      console.log("[ffmpeg] Using ffmpeg-static:", ffmpegStatic);
      return ffmpegStatic;
    }
  } catch (_) {}

  // 2. Try system PATH
  const r = spawnSync("where", ["ffmpeg"], { encoding: "utf8", timeout: 5000 });
  if (r.status === 0) {
    const p = r.stdout.trim().split(/\r?\n/)[0].trim();
    if (p) { console.log("[ffmpeg] Found in PATH:", p); return p; }
  }

  // 3. Common install locations
  const candidates = [
    "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
    "C:\\ffmpeg\\bin\\ffmpeg.exe",
  ];
  for (const c of candidates) if (fs.existsSync(c)) { console.log("[ffmpeg] Found at:", c); return c; }
  return null;
}

function getVideoDuration(ffmpegPath) {
  const r = spawnSync(ffmpegPath, ["-i", VIDEO_PATH, "-hide_banner"], { encoding: "utf8", timeout: 15000 });
  const output = (r.stderr || "") + (r.stdout || "");
  const match = output.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
  if (!match) return null;
  return parseFloat(match[1]) * 3600 + parseFloat(match[2]) * 60 + parseFloat(match[3]);
}

function extractFrame(ffmpegPath, timestamp, outputPath) {
  const r = spawnSync(ffmpegPath, [
    "-ss", String(timestamp),
    "-i", VIDEO_PATH,
    "-frames:v", "1",
    "-q:v", "2",
    "-y", outputPath
  ], { timeout: 30000 });
  return r.status === 0 && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000;
}

async function main() {
  console.log("\n=== Instagram Video Frame Extractor ===\n");

  const ffmpegPath = findFFmpeg();
  if (!ffmpegPath) {
    console.error("ERROR: ffmpeg not found. Run: npm install ffmpeg-static --save-dev  (inside server/)");
    process.exit(1);
  }

  if (!fs.existsSync(VIDEO_PATH)) {
    console.error("ERROR: Video not found at:", VIDEO_PATH);
    process.exit(1);
  }
  const videoSize = fs.statSync(VIDEO_PATH).size;
  console.log(`[Video] ${(videoSize / 1024 / 1024).toFixed(1)} MB`);

  const duration = getVideoDuration(ffmpegPath);
  if (!duration) { console.error("ERROR: Could not get video duration"); process.exit(1); }
  console.log(`[Video] Duration: ${duration.toFixed(1)}s`);

  let profiles = JSON.parse(fs.readFileSync(PROFILES_PATH, "utf8"));
  console.log(`[Profiles] ${profiles.length} total`);

  // Extract 1 frame every 1.5 seconds across the whole video
  const SAMPLE_INTERVAL = 1.5;
  const totalFrames     = Math.floor(duration / SAMPLE_INTERVAL);
  console.log(`[Extract] ~${totalFrames} frames to extract (1 per ${SAMPLE_INTERVAL}s)\n`);

  const extractedFrames = [];
  for (let i = 0; i < totalFrames; i++) {
    const ts        = i * SAMPLE_INTERVAL + 0.5;
    const framePath = path.join(FRAMES_DIR, `frame_${String(i).padStart(5, "0")}.jpg`);

    // Reuse if already extracted
    if (fs.existsSync(framePath) && fs.statSync(framePath).size > 1000) {
      extractedFrames.push(framePath);
      continue;
    }
    if (extractFrame(ffmpegPath, ts, framePath)) extractedFrames.push(framePath);
    if (i % 20 === 0) process.stdout.write(`\r  ${i}/${totalFrames} frames...`);
  }
  console.log(`\n[Extract] Done — ${extractedFrames.length} frames.`);

  // Map frames evenly to profiles that have Instagram post IDs
  const profilesWithPost = profiles.filter(p => p.instagramPostId);
  const skipStart        = Math.floor(extractedFrames.length * 0.02);
  const skipEnd          = Math.floor(extractedFrames.length * 0.02);
  const usable           = extractedFrames.slice(skipStart, extractedFrames.length - skipEnd);
  const step             = usable.length / profilesWithPost.length;

  console.log(`[Map] ${profilesWithPost.length} profiles, ${usable.length} usable frames (step=${step.toFixed(2)})\n`);

  let mapped = 0;
  for (let i = 0; i < profilesWithPost.length; i++) {
    const profile  = profilesWithPost[i];
    const frameIdx = Math.min(Math.floor(i * step), usable.length - 1);
    const src      = usable[frameIdx];
    const fname    = `ig_${profile.instagramPostId}.jpg`;
    const dest     = path.join(UPLOADS_DIR, fname);
    const cdest    = path.join(CLIENT_UPLOADS, fname);

    try {
      fs.copyFileSync(src, dest);
      try { fs.copyFileSync(src, cdest); } catch (_) {}
      profile.image = `/uploads/${fname}`;
      mapped++;
      if (i % 10 === 0 || i === profilesWithPost.length - 1) {
        console.log(`  [${String(i + 1).padStart(2)}/${profilesWithPost.length}] ${(profile.id || profile.name || "").padEnd(12)} -> frame_${frameIdx}`);
      }
    } catch (err) {
      console.error(`  ERROR ${profile.id}: ${err.message}`);
    }
  }

  const jsonStr = JSON.stringify(profiles, null, 2);
  fs.writeFileSync(PROFILES_PATH,   jsonStr, "utf8");
  try { fs.writeFileSync(CLIENT_PROFILES, jsonStr, "utf8"); } catch (_) {}

  console.log(`\n=== Done — Mapped ${mapped}/${profilesWithPost.length} profiles ===`);
  console.log(`profiles.json saved.`);
  console.log(`Frames are in: ${FRAMES_DIR}  (safe to delete after reviewing)`);
}

main().catch(err => { console.error("FATAL:", err); process.exit(1); });
