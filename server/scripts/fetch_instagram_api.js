/**
 * fetch_instagram_api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches ALL posts from @nikah_bahrain via Instagram's internal API.
 * NO Puppeteer. NO headless browser. Pure HTTP requests with session cookie.
 *
 * Returns real caption text (the full flyer text posted on Instagram),
 * which is then parsed by parseProfileFromAltText() to extract actual profile data.
 *
 * SETUP: Add your Instagram session cookie values to server/.env:
 *   INSTAGRAM_SESSION_ID=your_sessionid_value
 *   INSTAGRAM_CSRF=your_csrftoken_value
 *
 * How to get session cookies:
 *   1. Open Chrome and log in to instagram.com
 *   2. Open DevTools (F12) → Application → Cookies → instagram.com
 *   3. Copy the values of: sessionid, csrftoken
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parseProfileFromAltText } from './parse_profile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
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

// ─── Build cookie header from env ───────────────────────────────────────────
function buildCookieHeader() {
  const parts = [];
  if (process.env.INSTAGRAM_SESSION_ID) {
    parts.push(`sessionid=${process.env.INSTAGRAM_SESSION_ID}`);
  }
  if (process.env.INSTAGRAM_CSRF) {
    parts.push(`csrftoken=${process.env.INSTAGRAM_CSRF}`);
  }
  if (process.env.INSTAGRAM_DID) {
    parts.push(`ig_did=${process.env.INSTAGRAM_DID}`);
  }
  // Always include these basic cookies for Instagram to serve content
  parts.push('ig_nrcb=1');
  parts.push('wd=1280x900');
  return parts.join('; ');
}

// ─── Standard Instagram browser headers ────────────────────────────────────
function getHeaders(csrfToken = '') {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.instagram.com/',
    'Origin': 'https://www.instagram.com',
    'X-IG-App-ID': '936619743392459',
    'X-ASBD-ID': '198387',
    'X-Requested-With': 'XMLHttpRequest',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'Cookie': buildCookieHeader(),
    ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {})
  };
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Method 1: Instagram web_profile_info API ───────────────────────────────
// Returns the user's timeline with edge_owner_to_timeline_media including captions
async function fetchViaWebProfileInfo(username) {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
  console.log(`[Instagram API] Trying web_profile_info endpoint...`);
  
  const res = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
    signal: AbortSignal.timeout(20000)
  });

  if (!res.ok) {
    throw new Error(`web_profile_info returned HTTP ${res.status}`);
  }

  const data = await res.json();
  const user = data?.data?.user;
  if (!user) throw new Error('No user data in web_profile_info response');

  const edges = user?.edge_owner_to_timeline_media?.edges || [];
  console.log(`[Instagram API] web_profile_info: found ${edges.length} posts`);
  
  // Extract userId and check for more pages
  const userId = user.id;
  const hasNextPage = user?.edge_owner_to_timeline_media?.page_info?.has_next_page;
  const endCursor = user?.edge_owner_to_timeline_media?.page_info?.end_cursor;

  return { edges, userId, hasNextPage, endCursor };
}

// ─── Method 2: Instagram GraphQL paginated feed ─────────────────────────────
async function fetchViaGraphQL(userId, endCursor) {
  const variables = JSON.stringify({
    id: userId,
    first: 12,
    after: endCursor
  });

  const url = `https://www.instagram.com/graphql/query/?query_hash=e769aa130647d2354c40ea6a439bfc08&variables=${encodeURIComponent(variables)}`;
  console.log(`[Instagram API] Fetching next page via GraphQL (cursor: ${endCursor?.slice(0, 20)}...)`);

  const res = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
    signal: AbortSignal.timeout(20000)
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

// ─── Method 3: Instagram API v1 user feed (requires session) ───────────────
async function fetchViaUserFeed(userId, maxId = '') {
  const params = new URLSearchParams({ count: '12' });
  if (maxId) params.set('max_id', maxId);
  
  const url = `https://i.instagram.com/api/v1/feed/user/${userId}/?${params}`;
  console.log(`[Instagram API] Trying mobile API feed endpoint...`);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...getHeaders(),
      'User-Agent': 'Instagram 219.0.0.12.117 Android (28/9; 420dpi; 1080x1920; Xiaomi; Mi 9T; davinci; qcom; en_US; 301484016)'
    },
    signal: AbortSignal.timeout(20000)
  });

  if (!res.ok) throw new Error(`Mobile API returned HTTP ${res.status}`);

  const data = await res.json();
  return {
    items: data.items || [],
    moreAvailable: data.more_available || false,
    nextMaxId: data.next_max_id || null
  };
}

// ─── Extract post data from GraphQL edge node ───────────────────────────────
function edgeToPost(edge) {
  const node = edge.node;
  if (!node) return null;

  const shortcode = node.shortcode || '';
  const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text || '';
  const imageUrl = node.display_url || node.thumbnail_src || '';
  const timestamp = node.taken_at_timestamp || Date.now() / 1000;

  return {
    shortcode,
    url: `https://www.instagram.com/p/${shortcode}/`,
    imageUrl,
    alt: caption,        // Real caption text goes into alt (parsed by parseProfileFromAltText)
    caption,
    createdAt: new Date(timestamp * 1000).toISOString()
  };
}

// ─── Extract post data from mobile API item ──────────────────────────────────
function itemToPost(item) {
  const shortcode = item.code || item.pk || '';
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

// ─── Helper: Load existing profiles ──────────────────────────────────────────
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

// ─── Helper: Persist profiles ─────────────────────────────────────────────────
async function persistProfiles(profiles) {
  try {
    const { dbUpsertProfiles } = await import('../db.js');
    await dbUpsertProfiles(profiles);
    console.log(`[Instagram API] ✓ Saved ${profiles.length} profiles to Supabase database`);
  } catch (dbErr) {
    console.warn('[Instagram API] Supabase unavailable, saving to local JSON:', dbErr.message);
  }

  // Always write to local JSON as well
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
  console.log(`[Instagram API] ✓ Saved ${profiles.length} profiles to local JSON files`);
}

// ─── Helper: Get next profile ID ──────────────────────────────────────────────
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

// ─── MAIN: Fetch all posts and sync to database ───────────────────────────────
export async function fetchAndSyncInstagramPosts(options = {}) {
  const { replaceAll = false, maxPosts = 200 } = options;

  console.log('\n[Instagram API] ════════════════════════════════════════');
  console.log('[Instagram API] Starting Instagram API fetch for @nikah_bahrain');
  console.log('[Instagram API] Method: Direct HTTP API (no Puppeteer)');
  console.log('[Instagram API] ════════════════════════════════════════\n');

  const allPosts = new Map(); // shortcode → post data
  let userId = null;
  let fetchError = null;

  // ── PHASE 1: Try web_profile_info (works without login, gets ~12 posts) ──
  try {
    const { edges, userId: uid, hasNextPage, endCursor } = await fetchViaWebProfileInfo(IG_USERNAME);
    userId = uid;

    for (const edge of edges) {
      const post = edgeToPost(edge);
      if (post?.shortcode) allPosts.set(post.shortcode, post);
    }
    console.log(`[Instagram API] Phase 1 complete: ${allPosts.size} posts found`);

    // ── PHASE 2: Paginate via GraphQL if more posts available ──────────────
    if (hasNextPage && endCursor && allPosts.size < maxPosts) {
      console.log('[Instagram API] More posts available, paginating via GraphQL...');
      let cursor = endCursor;
      let hasMore = hasNextPage;
      let page = 2;

      while (hasMore && allPosts.size < maxPosts && page <= 20) {
        try {
          await sleep(800 + Math.random() * 400); // polite delay
          const { edges: moreEdges, hasNextPage: nextHas, endCursor: nextCursor } = await fetchViaGraphQL(userId, cursor);
          
          for (const edge of moreEdges) {
            const post = edgeToPost(edge);
            if (post?.shortcode) allPosts.set(post.shortcode, post);
          }

          hasMore = nextHas;
          cursor = nextCursor;
          page++;
          console.log(`[Instagram API] Paginated to page ${page}: ${allPosts.size} total posts`);
        } catch (pageErr) {
          console.warn(`[Instagram API] Pagination stopped at page ${page}:`, pageErr.message);
          break;
        }
      }
    }
  } catch (err) {
    console.warn('[Instagram API] Phase 1 (web_profile_info) failed:', err.message);
    fetchError = err.message;
  }

  // ── PHASE 3: If we got very few posts, try mobile API (needs session) ────
  if (allPosts.size < 5 && userId && process.env.INSTAGRAM_SESSION_ID) {
    console.log('[Instagram API] Phase 3: Trying mobile API with session cookie...');
    try {
      let maxId = '';
      let hasMore = true;
      let page = 0;

      while (hasMore && allPosts.size < maxPosts && page < 20) {
        await sleep(500 + Math.random() * 500);
        const { items, moreAvailable, nextMaxId } = await fetchViaUserFeed(userId, maxId);
        
        for (const item of items) {
          const post = itemToPost(item);
          if (post?.shortcode) allPosts.set(post.shortcode, post);
        }
        
        hasMore = moreAvailable;
        maxId = nextMaxId;
        page++;
        console.log(`[Instagram API] Mobile API page ${page}: ${allPosts.size} total posts`);
      }
    } catch (mobileErr) {
      console.warn('[Instagram API] Mobile API also failed:', mobileErr.message);
    }
  }

  if (allPosts.size === 0) {
    console.error('[Instagram API] Could not fetch any posts from Instagram.');
    console.error('[Instagram API] Please ensure INSTAGRAM_SESSION_ID is set in server/.env');
    return {
      success: false,
      freshlyFetched: 0,
      totalProfiles: 0,
      newProfiles: [],
      message: `Instagram API fetch failed: ${fetchError || 'No posts retrieved'}. Please add INSTAGRAM_SESSION_ID to server/.env`
    };
  }

  console.log(`\n[Instagram API] ✓ Total posts retrieved from Instagram: ${allPosts.size}`);

  // ── PHASE 4: Load existing profiles & identify new posts ─────────────────
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

  console.log(`[Instagram API] ${replaceAll ? 'Processing all' : `${newPosts.length} new`} post(s) for profile parsing...`);

  // ── PHASE 5: Parse profiles from real caption data ─────────────────────────
  const parsedProfiles = [];
  const allCurrent = [...parsedProfiles, ...existing];

  for (const post of newPosts) {
    try {
      // Skip if caption is empty - this post may not be a profile flyer
      if (!post.caption || post.caption.length < 30) {
        console.warn(`[Instagram API] Skipping post ${post.shortcode}: caption too short (${post.caption?.length || 0} chars)`);
        continue;
      }

      const parsed = parseProfileFromAltText(post);

      // Assign proper sequential ID if not found in caption
      if (!parsed.id || parsed.id.startsWith('NB-') || parsed.id.startsWith('IG-')) {
        parsed.id = getNextProfileId([...parsedProfiles, ...existing]);
      }

      // Skip if admin deleted this ID
      if (deletedIds.has(parsed.id)) continue;

      parsedProfiles.push(parsed);
      console.log(`[Instagram API] ✓ Parsed: ${parsed.id} | ${parsed.gender} | Age ${parsed.age} | ${parsed.nationality} | ${parsed.profession}`);
    } catch (err) {
      console.warn(`[Instagram API] Could not parse post ${post.shortcode}:`, err.message);
    }
  }

  console.log(`\n[Instagram API] Parsing complete: ${parsedProfiles.length} profiles extracted`);

  // ── PHASE 6: Merge & persist ──────────────────────────────────────────────
  let finalProfiles;
  if (replaceAll) {
    // Replace mode: use only fresh data (keep any manually added NPF profiles)
    const manualProfiles = existing.filter(p => p.id?.startsWith('NPF-') && !rawPosts.some(rp => rp.shortcode === p.instagramPostId));
    finalProfiles = [...parsedProfiles, ...manualProfiles];
    console.log(`[Instagram API] Replace mode: ${parsedProfiles.length} IG profiles + ${manualProfiles.length} manual profiles`);
  } else {
    // Merge mode: prepend new profiles to existing
    finalProfiles = parsedProfiles.length > 0
      ? [...parsedProfiles, ...existing.filter(p => !deletedIds.has(String(p.id)))]
      : existing.filter(p => !deletedIds.has(String(p.id)));
  }

  if (parsedProfiles.length > 0 || replaceAll) {
    await persistProfiles(finalProfiles);
  }

  const message = parsedProfiles.length > 0
    ? `✓ Fetched ${allPosts.size} posts from @nikah_bahrain. ${parsedProfiles.length} new profile(s) parsed and saved. Total: ${finalProfiles.length}`
    : `✓ @nikah_bahrain feed is up to date. All ${finalProfiles.length} profiles already in database.`;

  console.log(`\n[Instagram API] ${message}`);

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
  console.log(`Running Instagram API fetch${replaceAll ? ' (replace-all mode)' : ' (incremental mode)'}...`);
  
  fetchAndSyncInstagramPosts({ replaceAll, maxPosts: 300 })
    .then(res => {
      console.log('\n═══════════════════════════════════════════════');
      console.log('✅ Instagram Fetch Complete!');
      console.log(`   Posts found on Instagram: ${res.totalPosts}`);
      console.log(`   New profiles parsed:      ${res.freshlyFetched}`);
      console.log(`   Total in database:        ${res.totalProfiles}`);
      console.log(`   Message: ${res.message}`);
      console.log('═══════════════════════════════════════════════\n');
      process.exit(0);
    })
    .catch(err => {
      console.error('Fatal error:', err.message);
      process.exit(1);
    });
}
