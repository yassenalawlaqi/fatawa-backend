const axios = require('axios');
const cheerio = require('cheerio');

async function check() {
  const r = await axios.get('https://binothaimeen.net');
  const $ = cheerio.load(r.data);
  const js = $('script[src]').map((_,e)=>$(e).attr('src')).get();
  const res = await Promise.all(js.map(u => axios.get('https://binothaimeen.net'+u).then(r=>r.data)));
  const code = res.join('\n');
  const urls = [...new Set(code.match(/https?:\/\/[^\s"'`]+/g))].filter(u => u.includes('api'));
  console.log('API URLs:', urls);
  
  // also look for anything ending in /content
  const parts = code.match(/['"`]\/[a-zA-Z0-9_\-\/]+['"`]/g) || [];
  console.log('Path parts sample:', [...new Set(parts)].filter(p => p.includes('fatw') || p.includes('content')).slice(0, 20));
}
check();
