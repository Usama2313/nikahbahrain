/**
 * fetch_instagram_api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches ALL posts from @nikah_bahrain via Instagram's internal web API.
 * NO Puppeteer. NO headless browser. Pure stealthy HTTP requests.
 *
 * Anti-detection measures:
 *   - Randomized delays between requests (2–5 seconds)
 *   - Realistic Chrome browser headers
 *   - Proper cookie chain (sessionid, csrftoken, ig_nrcb, etc.)
 *   - Referrer chaining (simulate browsing profile page)
 *   - Single-run only (no polling loops)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parseProfileFromAltText } from './parse_profile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Load .env ────────────────────────────────────────────────────────────────
const envPaths = [
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', '..', '.env'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'server', '.env')
];
for (const p of envPaths) {
  if (fs.existsSync(p)) { dotenv.config({ path: p }); break; }
}

const IG_USERNAME = 'nikah_bahrain';
const IG_PROFILE_URL = `https://www.instagram.com/${IG_USERNAME}/`;

// ─── Human-like delay ─────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function randomDelay(minMs = 2000, maxMs = 5000) {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return sleep(ms);
}

// ─── Build realistic cookie header ───────────────────────────────────────────
function buildCookies() {
  const parts = [];
  const sessionId = process.env.INSTAGRAM_SESSION_ID;
  if (sessionId) parts.push(`sessionid=${sessionId}`);

  // Common baseline cookies Instagram expects
  parts.push('ig_nrcb=1');
  parts.push('csrftoken=missing');       // will be replaced after first request
  parts.push('wd=1366x768');
  parts.push('dpr=1');
  parts.push('rur="EAG,15600412515,1790956985:01f793e33ed7e86c8cab50e77e93d2cc0f1e9d55c4e5a0b09d3efca5f7df17c1a0dda24b99b5ef79"');

  return parts.join('; ');
}

// ─── Realistic browser headers (Chrome 124 on Windows) ───────────────────────
function getHeaders(referer = 'https://www.instagram.com/') {
  return {
    'authority': 'www.instagram.com',
    'method': 'GET',
    'scheme': 'https',
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Referer': referer,
    'Sec-Ch-Prefers-Color-Scheme': 'light',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Full-Version-List': '"Chromium";v="124.0.6367.207", "Google Chrome";v="124.0.6367.207"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Model': '""',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Ch-Ua-Platform-Version': '"15.0.0"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.207 Safari/537.36',
    'X-Asbd-Id': '129477',
    'X-Csrftoken': 'missing',
    'X-Ig-App-Id': '936619743392459',
    'X-Ig-Www-Claim': '0',
    'X-Requested-With': 'XMLHttpRequest',
    'Cookie': buildCookies()
  };
}

// ─── STEP 0: "Visit" the profile page first (simulate browser navigation) ───
async function simulateProfileVisit() {
  try {
    console.log('[Stealth] Simulating profile page visit first...');
    await fetch(IG_PROFILE_URL, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.207 Safari/537.36',
        'Cookie': buildCookies()
      },
      signal: AbortSignal.timeout(15000)
    });
    console.log('[Stealth] ✓ Profile page visited. Waiting 2-4s before API call...');
    await randomDelay(2000, 4000);
  } catch (_) {
    // Ignore errors — this is just warmup
    await randomDelay(1500, 3000);
  }
}

// ─── Method 1: web_profile_info API ──────────────────────────────────────────
async function fetchViaWebProfileInfo(username) {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
  console.log(`[Fetch] Calling web_profile_info API...`);

  const res = await fetch(url, {
    method: 'GET',
    headers: getHeaders(IG_PROFILE_URL),
    signal: AbortSignal.timeout(25000)
  });

  if (!res.ok) throw new Error(`web_profile_info returned HTTP ${res.status}`);

  const data = await res.json();
  const user = data?.data?.user;
  if (!user) throw new Error('No user data in response');

  const edges = user?.edge_owner_to_timeline_media?.edges || [];
  const userId = user.id;
  const hasNextPage = user?.edge_owner_to_timeline_media?.page_info?.has_next_page;
  const endCursor = user?.edge_owner_to_timeline_media?.page_info?.end_cursor;

  console.log(`[Fetch] web_profile_info: ${edges.length} posts | userId=${userId} | hasMore=${hasNextPage}`);
  return { edges, userId, hasNextPage, endCursor };
}

// ─── Method 2: GraphQL pagination ─────────────────────────────────────────────
async function fetchViaGraphQL(userId, endCursor, pageNum) {
  const variables = JSON.stringify({ id: userId, first: 12, after: endCursor });
  const url = `https://www.instagram.com/graphql/query/?query_hash=e769aa130647d2354c40ea6a439bfc08&variables=${encodeURIComponent(variables)}`;

  console.log(`[Fetch] GraphQL page ${pageNum} (cursor: ${String(endCursor).slice(0, 15)}...)`);

  const res = await fetch(url, {
    method: 'GET',
    headers: getHeaders(IG_PROFILE_URL),
    signal: AbortSignal.timeout(25000)
  });

  if (!res.ok) throw new Error(`GraphQL returned HTTP ${res.status}`);

  const data = await res.json();
  const media = data?.data?.user?.edge_owner_to_timeline_media;
  if (!media) throw new Error('No media data in GraphQL response');

  return {
    edges: media.edges || [],
    hasNextPage: media.page_info?.has_next_page || false,
    endCursor: media.page_info?.end_cursor || null
  };
}

// ─── Method 3: v1 mobile feed (session required) ──────────────────────────────
async function fetchViaMobileApi(userId, maxId = '') {
  const params = new URLSearchParams({ count: '12' });
  if (maxId) params.set('max_id', maxId);

  const url = `https://i.instagram.com/api/v1/feed/user/${userId}/?${params}`;
  console.log(`[Fetch] Mobile API feed (maxId: ${maxId || 'start'})`);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Instagram 281.0.0.19.118 Android (30/11; 420dpi; 1080x2208; Xiaomi; Redmi Note 9 Pro; joyeuse; qcom; en_US; 462433999)',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'X-IG-App-ID': '567310203415052',
      'X-IG-Capabilities': '3brTvw==',
      'X-IG-Connection-Type': 'WIFI',
      'Cookie': buildCookies()
    },
    signal: AbortSignal.timeout(25000)
  });

  if (!res.ok) throw new Error(`Mobile API returned HTTP ${res.status}`);

  const data = await res.json();
  return {
    items: data.items || [],
    moreAvailable: data.more_available || false,
    nextMaxId: data.next_max_id || null
  };
}

// ─── Convert GraphQL edge to post ─────────────────────────────────────────────
function edgeToPost(edge) {
  const node = edge?.node;
  if (!node) return null;
  const shortcode = node.shortcode || '';
  const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text || '';
  const imageUrl = node.display_url || node.thumbnail_src || '';
  const timestamp = node.taken_at_timestamp || Date.now() / 1000;
  return {
    shortcode,
    url: `https://www.instagram.com/p/${shortcode}/`,
    imageUrl,
    alt: caption,
    caption,
    createdAt: new Date(timestamp * 1000).toISOString()
  };
}

// ─── Convert mobile API item to post ─────────────────────────────────────────
function itemToPost(item) {
  const shortcode = item.code || String(item.pk || '');
  const caption = item.caption?.text || '';
  const imageUrl = item.image_versions2?.candidates?.[0]?.url ||
                   item.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url || '';
  const timestamp = item.taken_at || Date.now() / 1000;
  return {
    shortcode,
    url: `https://www.instagram.com/p/${shortcode}/`,
    imageUrl,
    alt: caption,
    caption,
    createdAt: new Date(timestamp * 1000).toISOString()
  };
}

// ─── Load existing profiles from JSON ─────────────────────────────────────────
function loadExistingProfiles() {
  const candidates = [
    path.join(__dirname, '..', 'data', 'profiles.json'),
    path.join(process.cwd(), 'server', 'data', 'profiles.json'),
    path.join(__dirname, '..', '..', 'client', 'src', 'data', 'profiles.json'),
    path.join(process.cwd(), 'client', 'src', 'data', 'profiles.json')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(c, 'utf8'));
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {}
    }
  }
  return [];
}

// ─── Persist profiles to DB + JSON ───────────────────────────────────────────
async function persistProfiles(profiles) {
  try {
    const { dbUpsertProfiles } = await import('../db.js');
    await dbUpsertProfiles(profiles);
    console.log(`[DB] ✓ Saved ${profiles.length} profiles to Supabase`);
  } catch (dbErr) {
    console.warn('[DB] Supabase skipped:', dbErr.message);
  }

  const targets = [
    path.join(__dirname, '..', 'data', 'profiles.json'),
    path.join(process.cwd(), 'server', 'data', 'profiles.json'),
    path.join(__dirname, '..', '..', 'client', 'src', 'data', 'profiles.json'),
    path.join(process.cwd(), 'client', 'src', 'data', 'profiles.json')
  ];
  const jsonStr = JSON.stringify(profiles, null, 2);
  for (const t of targets) {
    try {
      const dir = path.dirname(t);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(t, jsonStr, 'utf8');
    } catch (_) {}
  }
  console.log(`[DB] ✓ Saved ${profiles.length} profiles to local JSON`);
}

// ─── Get next profile ID ──────────────────────────────────────────────────────
function getNextProfileId(profiles) {
  let maxNum = 0;
  for (const p of profiles) {
    if (p?.id) {
      const m = p.id.match(/^NPF-?(\d+)/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxNum && n < 9000) maxNum = n;
      }
    }
  }
  return `NPF-${String(maxNum + 1).padStart(3, '0')}`;
}

// ─── MAIN: Fetch all posts & sync ─────────────────────────────────────────────
export async function fetchAndSyncInstagramPosts(options = {}) {
  const { replaceAll = false, maxPosts = 300 } = options;

  console.log('\n[Instagram] ════════════════════════════════════════════════');
  console.log('[Instagram] Fetching @nikah_bahrain via internal API (stealth mode)');
  console.log(`[Instagram] Mode: ${replaceAll ? 'replace-all' : 'incremental'} | Max: ${maxPosts} posts`);
  console.log('[Instagram] ════════════════════════════════════════════════\n');

  const allPosts = new Map();
  let userId = null;
  let fetchError = null;

  // ── Step 0: Simulate browser visiting the profile page first ──────────────
  await simulateProfileVisit();

  // ── Step 1: web_profile_info (first ~12 posts) ────────────────────────────
  try {
    const { edges, userId: uid, hasNextPage, endCursor } = await fetchViaWebProfileInfo(IG_USERNAME);
    userId = uid;

    for (const edge of edges) {
      const post = edgeToPost(edge);
      if (post?.shortcode) allPosts.set(post.shortcode, post);
    }

    console.log(`[Instagram] Phase 1 done: ${allPosts.size} posts`);

    // ── Step 2: Paginate via GraphQL ──────────────────────────────────────
    if (hasNextPage && endCursor && allPosts.size < maxPosts) {
      let cursor = endCursor;
      let hasMore = true;
      let page = 2;

      while (hasMore && allPosts.size < maxPosts && page <= 30) {
        try {
          // Human-like delay: 2–5 seconds between pages
          const delay = 2000 + Math.random() * 3000;
          console.log(`[Stealth] Waiting ${Math.round(delay / 1000)}s before next page...`);
          await sleep(delay);

          const { edges: moreEdges, hasNextPage: nextHas, endCursor: nextCursor } = await fetchViaGraphQL(userId, cursor, page);

          for (const edge of moreEdges) {
            const post = edgeToPost(edge);
            if (post?.shortcode) allPosts.set(post.shortcode, post);
          }

          hasMore = nextHas;
          cursor = nextCursor;
          page++;
          console.log(`[Instagram] Page ${page}: ${allPosts.size} total posts so far`);
        } catch (pageErr) {
          console.warn(`[Instagram] GraphQL stopped at page ${page}:`, pageErr.message);
          break;
        }
      }
    }
  } catch (err) {
    console.warn('[Instagram] Phase 1 failed:', err.message);
    fetchError = err.message;
  }

  // ── Step 3: Fall back to mobile API if web API got too few results ────────
  if (allPosts.size < 5 && userId && process.env.INSTAGRAM_SESSION_ID) {
    console.log('\n[Instagram] Falling back to mobile API...');
    try {
      let maxId = '';
      let hasMore = true;
      let page = 0;

      while (hasMore && allPosts.size < maxPosts && page < 25) {
        const delay = 2500 + Math.random() * 2500;
        if (page > 0) {
          console.log(`[Stealth] Waiting ${Math.round(delay / 1000)}s...`);
          await sleep(delay);
        }

        const { items, moreAvailable, nextMaxId } = await fetchViaMobileApi(userId, maxId);
        for (const item of items) {
          const post = itemToPost(item);
          if (post?.shortcode) allPosts.set(post.shortcode, post);
        }

        hasMore = moreAvailable;
        maxId = nextMaxId;
        page++;
        console.log(`[Instagram] Mobile page ${page}: ${allPosts.size} total posts`);
      }
    } catch (mobileErr) {
      console.warn('[Instagram] Mobile API failed:', mobileErr.message);
    }
  }

  if (allPosts.size === 0) {
    return {
      success: false,
      freshlyFetched: 0,
      totalProfiles: 0,
      newProfiles: [],
      message: `Fetch failed: ${fetchError || 'No posts retrieved'}. Check INSTAGRAM_SESSION_ID in server/.env`
    };
  }

  console.log(`\n[Instagram] ✓ Retrieved ${allPosts.size} posts from @nikah_bahrain`);

  // ── Step 4: Load existing + determine new posts ────────────────────────────
  const existing = loadExistingProfiles();
  let deletedIds = new Set();
  try {
    const { getDeletedProfileIds } = await import('../db.js');
    deletedIds = getDeletedProfileIds();
  } catch (_) {}

  const knownShortcodes = new Set();
  if (!replaceAll) {
    for (const p of existing) {
      if (p.instagramPostId) knownShortcodes.add(p.instagramPostId);
      if (p.instagramPostUrl) {
        const m = p.instagramPostUrl.match(/\/p\/([^\/]+)/);
        if (m) knownShortcodes.add(m[1]);
      }
    }
  }

  const rawPosts = Array.from(allPosts.values());
  const newPosts = replaceAll
    ? rawPosts
    : rawPosts.filter(p => !knownShortcodes.has(p.shortcode) && !deletedIds.has(`NB-${p.shortcode}`));

  console.log(`[Instagram] ${replaceAll ? `Processing all ${newPosts.length}` : `${newPosts.length} new`} post(s) for profile parsing...`);

  // ── Step 5: Parse profiles from real captions ──────────────────────────────
  const parsedProfiles = [];

  for (const post of newPosts) {
    try {
      if (!post.caption || post.caption.trim().length < 20) {
        console.warn(`  ↳ Skip ${post.shortcode}: caption too short`);
        continue;
      }

      const parsed = parseProfileFromAltText(post);

      if (!parsed.id || parsed.id.startsWith('NB-') || parsed.id.startsWith('IG-')) {
        parsed.id = getNextProfileId([...parsedProfiles, ...existing]);
      }

      if (deletedIds.has(parsed.id)) continue;

      parsedProfiles.push(parsed);
      console.log(`  ✓ ${parsed.id} | ${parsed.gender} | Age ${parsed.age} | ${parsed.nationality} | ${parsed.profession}`);
    } catch (err) {
      console.warn(`  ↳ Parse error for ${post.shortcode}:`, err.message);
    }
  }

  console.log(`\n[Instagram] Parsed ${parsedProfiles.length} profile(s) from ${newPosts.length} posts`);

  // ── Step 6: Merge & persist ────────────────────────────────────────────────
  let finalProfiles;
  if (replaceAll) {
    const manualProfiles = existing.filter(
      p => p.id?.startsWith('NPF-') && !rawPosts.some(rp => rp.shortcode === p.instagramPostId)
    );
    finalProfiles = [...parsedProfiles, ...manualProfiles];
    console.log(`[Instagram] Replace: ${parsedProfiles.length} IG + ${manualProfiles.length} manual profiles`);
  } else {
    finalProfiles = parsedProfiles.length > 0
      ? [...parsedProfiles, ...existing.filter(p => !deletedIds.has(String(p.id)))]
      : existing.filter(p => !deletedIds.has(String(p.id)));
  }

  if (parsedProfiles.length > 0 || replaceAll) {
    await persistProfiles(finalProfiles);
  }

  const message = parsedProfiles.length > 0
    ? `✓ ${parsedProfiles.length} profile(s) fetched from @nikah_bahrain. Total in database: ${finalProfiles.length}`
    : `✓ Already up to date. ${finalProfiles.length} profiles in database.`;

  console.log(`\n[Instagram] ${message}`);

  return {
    success: true,
    freshlyFetched: parsedProfiles.length,
    totalPosts: allPosts.size,
    totalProfiles: finalProfiles.length,
    newProfiles: parsedProfiles,
    message
  };
}

// ─── CLI Entry ────────────────────────────────────────────────────────────────
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const replaceAll = process.argv.includes('--replace-all');
  console.log(`\n🚀 Running Instagram fetch (${replaceAll ? 'REPLACE ALL' : 'incremental'})...\n`);

  fetchAndSyncInstagramPosts({ replaceAll, maxPosts: 300 })
    .then(res => {
      console.log('\n═══════════════════════════════════════════════');
      console.log(res.success ? '✅ Done!' : '⚠️ Partial result');
      console.log(`   Posts found:    ${res.totalPosts}`);
      console.log(`   Profiles saved: ${res.freshlyFetched}`);
      console.log(`   Total in DB:    ${res.totalProfiles}`);
      console.log(`   ${res.message}`);
      console.log('═══════════════════════════════════════════════\n');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Fatal error:', err.message);
      process.exit(1);
    });
}
