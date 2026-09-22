import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const UPLOADS_DIR    = path.join(__dirname, "..", "public", "uploads");
const CLIENT_UPLOADS = path.join(__dirname, "..", "..", "client", "public", "uploads");
const PROFILES_PATH  = path.join(__dirname, "..", "data", "profiles.json");
const CLIENT_PROFILES= path.join(__dirname, "..", "..", "client", "src", "data", "profiles.json");

for (const d of [UPLOADS_DIR, CLIENT_UPLOADS]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function findChrome() {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Google\\Chrome\\Application\\chrome.exe") : null,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

async function downloadImage(url, filename) {
  const dest = path.join(UPLOADS_DIR, filename);
  const clientDest = path.join(CLIENT_UPLOADS, filename);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    if (!fs.existsSync(clientDest)) try { fs.copyFileSync(dest, clientDest); } catch(_) {}
    return "/uploads/" + filename;
  }
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Referer": "https://www.instagram.com/",
      "Accept": "image/*,*/*;q=0.8"
    },
    signal: AbortSignal.timeout(30000)
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const fileStream = createWriteStream(dest);
  await pipeline(res.body, fileStream);
  try { fs.copyFileSync(dest, clientDest); } catch(_) {}
  const size = fs.statSync(dest).size;
  if (size < 1000) { fs.unlinkSync(dest); throw new Error("Image too small: " + size); }
  return "/uploads/" + filename;
}

async function main() {
  const chromePath = findChrome();
  if (!chromePath) { console.error("Chrome not found!"); process.exit(1); }
  console.log("Using Chrome:", chromePath);

  const sessionId = process.env.INSTAGRAM_SESSION_ID;
  if (!sessionId) { console.error("No INSTAGRAM_SESSION_ID!"); process.exit(1); }

  // Launch browser
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--no-first-run","--window-size=1280,900"],
    defaultViewport: { width: 1280, height: 900 }
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");

    // Set session cookie
    await page.setCookie({
      name: "sessionid",
      value: decodeURIComponent(sessionId),
      domain: ".instagram.com",
      path: "/",
      httpOnly: true,
      secure: true
    });

    // Intercept network to capture Instagram API responses
    const capturedPosts = new Map();
    await page.setRequestInterception(true);
    page.on("request", req => req.continue());
    page.on("response", async (res) => {
      const url = res.url();
      if (url.includes("web_profile_info") || url.includes("graphql/query") || url.includes("/api/v1/feed/")) {
        try {
          const data = await res.json();
          // web_profile_info
          const user = data?.data?.user;
          if (user) {
            const edges = user?.edge_owner_to_timeline_media?.edges || [];
            for (const e of edges) {
              const node = e?.node;
              if (node?.shortcode) {
                capturedPosts.set(node.shortcode, {
                  shortcode: node.shortcode,
                  imageUrl: node.display_url || node.thumbnail_src || "",
                  caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || ""
                });
              }
            }
            if (edges.length > 0) console.log("[Network] Captured "+edges.length+" posts from profile API");
          }
          // graphql
          const media = data?.data?.user?.edge_owner_to_timeline_media;
          if (media && !user) {
            const edges = media.edges || [];
            for (const e of edges) {
              const node = e?.node;
              if (node?.shortcode) {
                capturedPosts.set(node.shortcode, {
                  shortcode: node.shortcode,
                  imageUrl: node.display_url || node.thumbnail_src || "",
                  caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || ""
                });
              }
            }
            if (edges.length > 0) console.log("[Network] Captured "+edges.length+" posts from GraphQL");
          }
        } catch(_) {}
      }
    });

    // Navigate to profile
    console.log("[Browser] Navigating to @nikah_bahrain...");
    await page.goto("https://www.instagram.com/nikah_bahrain/", { waitUntil: "networkidle2", timeout: 30000 });
    await sleep(3000);

    // Scroll to load more posts
    console.log("[Browser] Scrolling to load posts...");
    for (let i = 0; i < 15; i++) {
      await page.evaluate(() => window.scrollBy(0, 800));
      await sleep(1500 + Math.random() * 1000);
      if (i % 5 === 0) console.log("[Browser] Scroll "+i+" | Posts captured: "+capturedPosts.size);
    }

    // Also scrape post links directly from DOM
    const domPosts = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a[href*=\"/p/\"]"));
      const posts = [];
      for (const link of links) {
        const href = link.href || "";
        const match = href.match(/\/p\/([a-zA-Z0-9_-]+)/);
        if (match) {
          const img = link.querySelector("img");
          posts.push({
            shortcode: match[1],
            imageUrl: img ? (img.src || "") : "",
            alt: img ? (img.alt || "") : ""
          });
        }
      }
      return posts;
    });

    console.log("[Browser] DOM scraped "+domPosts.length+" post links");
    for (const p of domPosts) {
      if (!capturedPosts.has(p.shortcode) && p.shortcode) {
        capturedPosts.set(p.shortcode, p);
      }
    }

    console.log("\n[Browser] Total posts found: "+capturedPosts.size);
    await browser.close();

    if (capturedPosts.size === 0) {
      console.error("[Browser] No posts captured. The account may still be restricted.");
      process.exit(1);
    }

    // Load profiles and update images
    let profiles = [];
    try { profiles = JSON.parse(fs.readFileSync(PROFILES_PATH, "utf8")); } catch(_) {}
    console.log("[Update] Loaded "+profiles.length+" profiles");

    let updated = 0, downloaded = 0, failed = 0, skipped = 0;

    for (const profile of profiles) {
      const postId = profile.instagramPostId;
      if (!postId) { skipped++; continue; }
      const freshPost = capturedPosts.get(postId);
      if (!freshPost || !freshPost.imageUrl) { skipped++; continue; }

      const filename = "ig_" + postId + ".jpg";
      process.stdout.write("  "+profile.id+" ("+postId+"): ");
      try {
        await sleep(200 + Math.random() * 400);
        const localUrl = await downloadImage(freshPost.imageUrl, filename);
        profile.image = localUrl;
        updated++; downloaded++;
        console.log("OK -> "+localUrl);
      } catch(err) {
        if (freshPost.imageUrl) { profile.image = freshPost.imageUrl; updated++; }
        failed++;
        console.log("FAILED ("+err.message+") -> CDN URL");
      }
    }

    const jsonStr = JSON.stringify(profiles, null, 2);
    fs.writeFileSync(PROFILES_PATH, jsonStr, "utf8");
    try { fs.writeFileSync(CLIENT_PROFILES, jsonStr, "utf8"); } catch(_) {}

    console.log("\n[Done] Updated="+updated+" Downloaded="+downloaded+" Failed="+failed+" Skipped="+skipped);

  } catch(err) {
    await browser.close();
    throw err;
  }
}

main().catch(err => { console.error("FATAL:", err.message); process.exit(1); });
