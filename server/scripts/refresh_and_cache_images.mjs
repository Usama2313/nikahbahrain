import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPaths = [path.join(__dirname,'..', '.env'), path.join(process.cwd(),'server','.env')];
for (const p of envPaths) { if (fs.existsSync(p)) { dotenv.config({ path: p }); break; } }

const UPLOADS_DIR    = path.join(__dirname, '..', 'public', 'uploads');
const CLIENT_UPLOADS = path.join(__dirname, '..', '..', 'client', 'public', 'uploads');
const PROFILES_PATH  = path.join(__dirname, '..', 'data', 'profiles.json');
const CLIENT_PROFILES= path.join(__dirname, '..', '..', 'client', 'src', 'data', 'profiles.json');

for (const d of [UPLOADS_DIR, CLIENT_UPLOADS]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(a,b){ return a + Math.random()*(b-a); }

function buildCookies() {
  const parts = [];
  const s = process.env.INSTAGRAM_SESSION_ID;
  if (s) parts.push('sessionid='+s);
  parts.push('ig_nrcb=1','csrftoken=missing','wd=1366x768','dpr=1');
  return parts.join('; ');
}

function getHeaders(ref='https://www.instagram.com/') {
  return {
    'Accept':'*/*','Accept-Language':'en-US,en;q=0.9',
    'Cache-Control':'no-cache','Pragma':'no-cache','Referer':ref,
    'Sec-Ch-Ua':'"Chromium";v="124","Google Chrome";v="124"',
    'Sec-Ch-Ua-Mobile':'?0','Sec-Ch-Ua-Platform':'"Windows"',
    'Sec-Fetch-Dest':'empty','Sec-Fetch-Mode':'cors','Sec-Fetch-Site':'same-origin',
    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.207 Safari/537.36',
    'X-Asbd-Id':'129477','X-Csrftoken':'missing',
    'X-Ig-App-Id':'936619743392459','X-Ig-Www-Claim':'0',
    'X-Requested-With':'XMLHttpRequest','Cookie':buildCookies()
  };
}

function edgeToPost(edge) {
  const node = edge?.node;
  if (!node) return null;
  const sc = node.shortcode || '';
  return {
    shortcode: sc,
    imageUrl: node.display_url || node.thumbnail_src || '',
    caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
  };
}

async function fetchAllPosts() {
  const allPosts = new Map();
  try {
    console.log('[Warmup] Visiting profile page...');
    await fetch('https://www.instagram.com/nikah_bahrain/', {
      headers:{'Accept':'text/html,*/*','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64)','Cookie':buildCookies()},
      signal: AbortSignal.timeout(15000)
    });
    console.log('[Warmup] Done. Waiting 3s...');
    await sleep(3000);
  } catch(_) { await sleep(2000); }

  try {
    const url='https://www.instagram.com/api/v1/users/web_profile_info/?username=nikah_bahrain';
    console.log('[Fetch] Calling web_profile_info...');
    const res = await fetch(url,{headers:getHeaders(),signal:AbortSignal.timeout(25000)});
    console.log('[Fetch] HTTP status:', res.status);
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    const user = data?.data?.user;
    if(!user) throw new Error('No user data in response');
    const userId = user.id;
    const edges = user?.edge_owner_to_timeline_media?.edges||[];
    let hasNext = user?.edge_owner_to_timeline_media?.page_info?.has_next_page;
    let cursor = user?.edge_owner_to_timeline_media?.page_info?.end_cursor;
    for(const e of edges){ const p=edgeToPost(e); if(p?.shortcode) allPosts.set(p.shortcode,p); }
    console.log('[Fetch] Phase1: '+allPosts.size+' posts | userId='+userId);

    if(hasNext && cursor) {
      let page=2;
      while(hasNext && allPosts.size<300 && page<=30) {
        const delay = rand(2500,5000);
        console.log('[Fetch] Waiting '+Math.round(delay/1000)+'s before page '+page+'...');
        await sleep(delay);
        try {
          const vars=JSON.stringify({id:userId,first:12,after:cursor});
          const gurl='https://www.instagram.com/graphql/query/?query_hash=e769aa130647d2354c40ea6a439bfc08&variables='+encodeURIComponent(vars);
          const gr=await fetch(gurl,{headers:getHeaders(),signal:AbortSignal.timeout(25000)});
          if(!gr.ok) throw new Error('HTTP '+gr.status);
          const gd=await gr.json();
          const media=gd?.data?.user?.edge_owner_to_timeline_media;
          if(!media) throw new Error('No media in response');
          for(const e of (media.edges||[])){const p=edgeToPost(e);if(p?.shortcode)allPosts.set(p.shortcode,p);}
          hasNext=media.page_info?.has_next_page||false;
          cursor=media.page_info?.end_cursor||null;
          page++;
          console.log('[Fetch] Page '+page+': '+allPosts.size+' total posts');
        } catch(err){ console.warn('[Fetch] GraphQL stopped at page '+page+':', err.message); break; }
      }
    }
  } catch(err){ console.error('[Fetch] Failed:', err.message); }

  return allPosts;
}

async function downloadImage(url, filename) {
  const dest=path.join(UPLOADS_DIR,filename);
  const clientDest=path.join(CLIENT_UPLOADS,filename);
  if(fs.existsSync(dest)&&fs.statSync(dest).size>1000){
    if(!fs.existsSync(clientDest)) try{fs.copyFileSync(dest,clientDest);}catch(_){}
    return '/uploads/'+filename;
  }
  const res=await fetch(url,{
    headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','Referer':'https://www.instagram.com/','Accept':'image/*,*/*;q=0.8'},
    signal:AbortSignal.timeout(30000)
  });
  if(!res.ok) throw new Error('HTTP '+res.status);
  const fileStream=createWriteStream(dest);
  await pipeline(res.body,fileStream);
  try{fs.copyFileSync(dest,clientDest);}catch(_){}
  const size=fs.statSync(dest).size;
  if(size<1000){fs.unlinkSync(dest);throw new Error('Image too small: '+size+' bytes');}
  return '/uploads/'+filename;
}

async function main() {
  console.log('\n[Refresh] Starting Instagram refresh + image cache\n');
  let profiles=[];
  if(fs.existsSync(PROFILES_PATH)){
    try{profiles=JSON.parse(fs.readFileSync(PROFILES_PATH,'utf8'));}catch(e){console.error('Error reading profiles:',e.message);}
  }
  console.log('[Refresh] Loaded '+profiles.length+' profiles');

  const allPosts = await fetchAllPosts();
  console.log('\n[Refresh] Fetched '+allPosts.size+' posts from Instagram');

  if(allPosts.size===0){
    console.error('[Refresh] ERROR: No posts fetched. Check INSTAGRAM_SESSION_ID in server/.env!');
    process.exit(1);
  }

  let updated=0, downloaded=0, failed=0, skipped=0;

  for(const profile of profiles) {
    const postId=profile.instagramPostId;
    if(!postId){ skipped++; continue; }
    const freshPost=allPosts.get(postId);
    if(!freshPost){ console.log('  skip '+profile.id+': post '+postId+' not in fetched data'); skipped++; continue; }
    if(!freshPost.imageUrl){ console.log('  skip '+profile.id+': no image URL in fetched post'); skipped++; continue; }

    const filename='ig_'+postId+'.jpg';
    process.stdout.write('  '+profile.id+' ('+postId+'): ');
    try {
      await sleep(rand(200,600));
      const localUrl=await downloadImage(freshPost.imageUrl, filename);
      profile.image=localUrl;
      updated++; downloaded++;
      console.log('OK -> '+localUrl);
    } catch(err) {
      if(freshPost.imageUrl){ profile.image=freshPost.imageUrl; updated++; }
      failed++;
      console.log('FAILED ('+err.message+') -> kept CDN URL');
    }
  }

  const jsonStr=JSON.stringify(profiles,null,2);
  fs.writeFileSync(PROFILES_PATH,jsonStr,'utf8');
  try{fs.writeFileSync(CLIENT_PROFILES,jsonStr,'utf8');}catch(e){console.warn('Could not write client profiles:',e.message);}

  console.log('\n[Refresh] === COMPLETE ===');
  console.log('  Total profiles:  '+profiles.length);
  console.log('  Updated:         '+updated);
  console.log('  Downloaded:      '+downloaded);
  console.log('  Failed/CDN:      '+failed);
  console.log('  Skipped:         '+skipped);
}

main().catch(err=>{ console.error('FATAL:', err.message); process.exit(1); });
