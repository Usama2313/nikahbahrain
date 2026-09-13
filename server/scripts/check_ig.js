async function check() {
  try {
    const res = await fetch('https://www.instagram.com/nikah_bahrain/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const html = await res.text();
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const descMatch = html.match(/<meta property="og:description" content="([^"]*)"/i);
    const imgMatch = html.match(/<meta property="og:image" content="([^"]*)"/i);
    console.log('Title:', titleMatch ? titleMatch[1] : 'null');
    console.log('Description:', descMatch ? descMatch[1] : 'null');
    console.log('Image:', imgMatch ? imgMatch[1] : 'null');

    // Check if there is embedded JSON (__additionalDataLoaded or script type="application/json")
    const jsonScripts = [];
    const scriptRegex = /<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
      jsonScripts.push(match[1].length);
    }
    console.log('Found json scripts:', jsonScripts);

    // Look for keywords like shortcode or edge_owner_to_timeline_media
    console.log('Contains edge_owner_to_timeline_media:', html.includes('edge_owner_to_timeline_media'));
    console.log('Contains xdt_api__v1__feed__user_timeline_graphql_connection:', html.includes('xdt_api__v1__feed__user_timeline_graphql_connection'));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
check();
