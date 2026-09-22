import puppeteer from 'puppeteer-core';

async function main() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const pages = await browser.pages();
  console.log(`Connected! Pages count: ${pages.length}`);
  
  const igPage = pages.find(p => p.url().includes('instagram.com'));
  if (!igPage) {
    console.log('No Instagram page found');
    await browser.disconnect();
    return;
  }

  console.log(`IG Page URL: ${igPage.url()}`);
  const title = await igPage.title();
  console.log(`Title: ${title}`);

  const postLinks = await igPage.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"], a[href*="/nikah_bahrain/p/"]'));
    return anchors.map(a => {
      const img = a.querySelector('img');
      return {
        href: a.getAttribute('href'),
        imgSrc: img ? img.getAttribute('src') : null,
        alt: img ? img.getAttribute('alt') : null
      };
    });
  });

  console.log(`Visible posts in DOM right now: ${postLinks.length}`);
  if (postLinks.length > 0) {
    console.log('Sample post:', postLinks[0]);
  }

  await browser.disconnect();
}

main().catch(err => console.error('Error:', err));
