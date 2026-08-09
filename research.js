const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

async function checkFawzanAlt() {
  console.log('--- Fawzan Alt ---');
  const httpsAgent = new https.Agent({ rejectUnauthorized: false });
  try {
    const res = await axios.get('https://www.alfawzan.af.org.sa/', { httpsAgent, timeout: 15000 });
    const $ = cheerio.load(res.data);
    console.log('Title:', $('title').text().trim());
    const links = $('a').map((i, el) => $(el).attr('href')).get();
    const fatwaLinks = links.filter(l => l && (l.includes('fatwa') || l.includes('fatawa')));
    console.log('Fatwa links:', [...new Set(fatwaLinks)]);
  } catch (e) {
    console.log('Fawzan error:', e.message);
  }
}

async function checkUthaymeenJSON() {
  console.log('\n--- Uthaymeen JSON ---');
  try {
    const res = await axios.get('https://binothaimeen.net/api/v1/fatwa', { timeout: 15000 }); // sometimes v1 is better
    console.log('Status:', res.status);
    // Is it JSON?
    if (typeof res.data === 'object') {
      console.log('Keys:', Object.keys(res.data));
      if (res.data.data) {
        console.log('Data length:', res.data.data.length);
        console.log('Sample item:', res.data.data[0]);
      }
    } else {
      console.log('Not JSON object, length:', res.data.length);
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

async function checkCommittee405() {
  console.log('\n--- Committee 405 bypass ---');
  const httpsAgent = new https.Agent({ rejectUnauthorized: false });
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
    'Cache-Control': 'max-age=0',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    // Try sending some standard cookies
    'Cookie': 'ASP.NET_SessionId=abcdef1234567890abcdef12;', 
  };
  
  try {
    const res = await axios.get('https://alifta.gov.sa/Ar/IftaPages/default.aspx?page=1', { headers, httpsAgent, timeout: 15000 });
    console.log('Status:', res.status);
    const $ = cheerio.load(res.data);
    console.log('Title:', $('title').text().trim());
  } catch (e) {
    console.log('Committee error:', e.response?.status || e.message);
    if (e.response && e.response.status === 405) {
      console.log('Still getting 405 Method Not Allowed.');
    }
  }
}

async function run() {
  await checkFawzanAlt();
  await checkUthaymeenJSON();
  await checkCommittee405();
}
run();
