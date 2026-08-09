const axios = require('axios');
const cheerio = require('cheerio');

async function check() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  };
  try {
    const r = await axios.get('https://binothaimeen.net/content/Menu/fatwa', { headers });
    const html = r.data;
    console.log('HTML Length:', html.length);
    const $ = cheerio.load(html);
    const a = $('a').length;
    console.log('Links:', a);
    
    // Print window variables
    const scripts = $('script').map((_,e)=>$(e).html()).get().filter(s => s && s.includes('window'));
    if (scripts.length > 0) {
      console.log('Scripts:', scripts[0].substring(0, 200));
    }
  } catch(e) {
    console.log(e.message);
  }
}
check();
