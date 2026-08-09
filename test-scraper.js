const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

// Create an instance that ignores SSL errors for Fawzan
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function testUthaymeen() {
  try {
    const res = await axios.get('https://binothaimeen.net/content/Menu/fatwa?page=1');
    const $ = cheerio.load(res.data);
    let links = [];
    $('a').each((_, el) => {
      let href = $(el).attr('href');
      if (href && href.includes('/content/')) {
        links.push(href);
      }
    });
    console.log('Uthaymeen: Found links:', links.length);
    if (links.length === 0) {
      console.log('Uthaymeen HTML snippet:', res.data.substring(0, 500));
    }
  } catch (e) {
    console.error('Uthaymeen failed:', e.message);
  }
}

async function testFawzan() {
  try {
    const res = await axios.get('https://alfawzan.af.org.sa/ar/fatawa?page=1', { httpsAgent });
    const $ = cheerio.load(res.data);
    let links = [];
    $('a').each((_, el) => {
      let href = $(el).attr('href');
      if (href && href.includes('node/')) {
        links.push(href);
      }
    });
    console.log('Fawzan: Found links:', links.length);
    if (links.length > 0) console.log(links.slice(0, 5));
  } catch (e) {
    console.error('Fawzan failed:', e.message);
  }
}

async function testCommittee() {
  try {
    const res = await axios.get('http://www.alifta.net/Fatawa/FatawaChapters.aspx?languagename=ar&View=Tree&NodeID=1&PageNo=1&BookID=3');
    const $ = cheerio.load(res.data);
    let links = [];
    $('a').each((_, el) => {
      let href = $(el).attr('href');
      if (href && href.includes('FatawaChapters')) {
        links.push(href);
      }
    });
    console.log('Committee: Found links:', links.length);
    if (links.length === 0) {
      console.log('Committee HTML snippet:', res.data.substring(0, 500));
    }
  } catch (e) {
    console.error('Committee failed:', e.message);
  }
}

testUthaymeen();
testFawzan();
testCommittee();
