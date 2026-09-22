/**
 * fetch_post_images.mjs
 * 
 * Uses Puppeteer to open each Instagram post page individually and extract
 * the real, high-resolution post image directly from Instagram.
 * 
 * Tracks completed post IDs in server/data/fetched_real_posts.json so it can
 * resume seamlessly without re-downloading or relying on old video frame files.
 */
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const UPLOADS_DIR     = path.join(__dirname, "..", "public",  "uploads");
const CLIENT_UPLOADS  = path.join(__dirname, "..", "..", "client", "public", "uploads");
const PROFILES_PATH   = path.join(__dirname, "..", "data",    "profiles.json");
const CLIENT_PROFILES = path.join(__dirname, "..", "..", "client", "src", "data", "profiles.json");
const PROGRESS_FILE   = path.join(__dirname, "..", "data",    "fetched_real_posts.json");

for (const d of [UPLOADS_DIR, CLIENT_UPLOADS]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function findChrome() {
  const c = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Google\\Chrome\\Application\\chrome.exe") : null,
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);
  for (const p of c) if (fs.existsSync(p)) return p;
  return null;
}

async function downloadImage(imageUrl, destPath) {
  const res = await fetch(imageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Referer": "https://www.instagram.com/",
      "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
    },
    signal: AbortSignal.timeout(30000)
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const fileStream = createWriteStream(destPath);
  await pipeline(res.body, fileStream);
  const size = fs.statSync(destPath).size;
  if (size < 5000) { fs.unlinkSync(destPath); throw new Error("Too small: " + size + "b"); }
  return size;
}

async function main() {
  const chromePath = findChrome();
  if (!chromePath) { console.error("Chrome not found!"); process.exit(1); }
  console.log("Chrome:", chromePath);

  const sessionId = process.env.INSTAGRAM_SESSION_ID;
  if (!sessionId) { console.error("No INSTAGRAM_SESSION_ID"); process.exit(1); }

  let profiles = JSON.parse(fs.readFileSync(PROFILES_PATH, "utf8"));
  const toFetch = profiles.filter(p => p.instagramPostId);
  console.log(`Profiles to fetch: ${toFetch.length}`);

  let completedPosts = [];
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      completedPosts = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
    } catch (_) { completedPosts = []; }
  }
  const completedSet = new Set(completedPosts);
  console.log(`Already completed real posts: ${completedSet.size}\n`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled"
    ],
    defaultViewport: { width: 1280, height: 900 }
  });

  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

  // Set session cookie
  await page.setCookie({
    name: "sessionid",
    value: decodeURIComponent(sessionId),
    domain: ".instagram.com",
    path: "/",
    httpOnly: true,
    secure: true
  });

  // Warm up on Instagram
  console.log("Warming up on Instagram...");
  try {
    await page.goto("https://www.instagram.com/nikah_bahrain/", { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(3000);
  } catch (e) {
    console.log("Warmup notice:", e.message);
  }

  let ok = completedSet.size;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < toFetch.length; i++) {
    const profile  = toFetch[i];
    const postId   = profile.instagramPostId;
    const filename = `ig_${postId}.jpg`;
    const destPath = path.join(UPLOADS_DIR, filename);
    const cDest    = path.join(CLIENT_UPLOADS, filename);
    const postUrl  = `https://www.instagram.com/p/${postId}/`;

    if (completedSet.has(postId) && fs.existsSync(destPath) && fs.statSync(destPath).size > 15000) {
      console.log(`  [${i+1}/${toFetch.length}] ${postId} ... ALREADY FETCHED`);
      profile.image = `/uploads/${filename}`;
      continue;
    }

    process.stdout.write(`  [${i+1}/${toFetch.length}] ${postId} ... `);

    try {
      let capturedImageUrl = null;
      let capturedSize = 0;
      let capturedBuffer = null;

      // Listen for network image responses WITHOUT request interception
      const onResponse = async (response) => {
        try {
          const url = response.url();
          if (!url.includes("fbcdn.net") && !url.includes("cdninstagram")) return;
          if (url.includes("rsrc.php") || url.includes("/static.") || url.includes("static.cdninstagram")) return;
          // Filter out tiny UI avatars / icons
          if (url.includes("/s150x150/") || url.includes("/s320x320/")) return;
          const ct = response.headers()["content-type"] || "";
          if (!ct.includes("image") && !url.includes(".jpg")) return;

          const buf = await response.buffer();
          if (buf && buf.length > capturedSize) {
            capturedSize = buf.length;
            capturedImageUrl = url;
            capturedBuffer = buf;
          }
        } catch (_) {}
      };

      page.on("response", onResponse);

      try {
        await page.goto(postUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
      } catch (navErr) {
        // Navigation might timeout if long polling, but content loaded
      }

      await sleep(2500);
      page.off("response", onResponse);

      // Strategy 1: Save buffer captured from Chrome network
      if (capturedBuffer && capturedSize > 15000) {
        fs.writeFileSync(destPath, capturedBuffer);
        try { fs.copyFileSync(destPath, cDest); } catch (_) {}
        profile.image = `/uploads/${filename}`;
        completedSet.add(postId);
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(Array.from(completedSet), null, 2), "utf8");
        console.log(`OK (${(capturedSize/1024).toFixed(0)}KB network capture)`);
        ok++;
        await sleep(1500 + Math.random() * 1000);
        continue;
      }

      // Strategy 2: If we captured URL but buffer failed
      if (capturedImageUrl) {
        try {
          const size = await downloadImage(capturedImageUrl, destPath);
          try { fs.copyFileSync(destPath, cDest); } catch (_) {}
          profile.image = `/uploads/${filename}`;
          completedSet.add(postId);
          fs.writeFileSync(PROGRESS_FILE, JSON.stringify(Array.from(completedSet), null, 2), "utf8");
          console.log(`OK (${(size/1024).toFixed(0)}KB direct download)`);
          ok++;
          await sleep(1500 + Math.random() * 1000);
          continue;
        } catch (_) {}
      }

      // Strategy 3: Extract from DOM (og:image or largest post img)
      const imgUrl = await page.evaluate(() => {
        const og = document.querySelector('meta[property="og:image"]');
        if (og?.content) return og.content;
        const imgs = Array.from(document.querySelectorAll("img[src]"))
          .filter(img => img.src && (img.src.includes("fbcdn.net") || img.src.includes("cdninstagram")))
          .filter(img => !img.src.includes("/s150x150/") && !img.src.includes("/s320x320/"))
          .sort((a, b) => (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight));
        return imgs[0]?.src || null;
      });

      if (imgUrl) {
        const size = await downloadImage(imgUrl, destPath);
        try { fs.copyFileSync(destPath, cDest); } catch (_) {}
        profile.image = `/uploads/${filename}`;
        completedSet.add(postId);
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(Array.from(completedSet), null, 2), "utf8");
        console.log(`OK (${(size/1024).toFixed(0)}KB from DOM)`);
        ok++;
      } else {
        console.log("FAILED - no image found on post page");
        errors.push(postId);
        failed++;
      }
    } catch (err) {
      console.log(`FAILED - ${err.message.substring(0, 70)}`);
      errors.push(postId);
      failed++;
    }

    // Save profile metadata progress every 5 posts
    if ((i + 1) % 5 === 0) {
      fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2), "utf8");
      try { fs.writeFileSync(CLIENT_PROFILES, JSON.stringify(profiles, null, 2), "utf8"); } catch (_) {}
      console.log(`  >>> Checkpoint: ${ok} succeeded, ${failed} failed`);
    }

    await sleep(2000 + Math.random() * 1500);
  }

  await browser.close();

  fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2), "utf8");
  try { fs.writeFileSync(CLIENT_PROFILES, JSON.stringify(profiles, null, 2), "utf8"); } catch (_) {}

  console.log(`\n========================================`);
  console.log(`Finished: OK=${ok} Failed=${failed}`);
  if (errors.length) console.log("Failed posts:", errors.join(", "));
  console.log(`========================================`);
}

main().catch(err => {
  console.error("FATAL ERROR:", err.message);
  process.exit(1);
});
