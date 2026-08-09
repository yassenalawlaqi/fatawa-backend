const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://binbaz.org.sa/fatwas?page=1')
  .then(res => {
    const $ = cheerio.load(res.data);
    let found = false;
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.match(/\/fatwas\/\d+/)) {
        found = true;
        console.log(href);
      }
    });
    console.log('Found:', found);
  })
  .catch(console.error);
