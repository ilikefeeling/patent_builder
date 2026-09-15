const https = require('https');
const fs = require('fs');
const path = require('path');

const download = (url, dest, options) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, options, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
};

(async () => {
  try {
    await download('https://www.patent.go.kr/smart/images/common/logo.png', path.join(__dirname, 'public', 'patentro-logo.png'), options);
    console.log('PatentRo logo downloaded successfully.');
    
    // kipris is http, so we need http module
    const http = require('http');
    const downloadHttp = (url, dest, options) => {
      return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        http.get(url, options, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
            return;
          }
          response.pipe(file);
          file.on('finish', () => {
            file.close(resolve);
          });
        }).on('error', (err) => {
          fs.unlink(dest, () => reject(err));
        });
      });
    };
    await downloadHttp('http://www.kipris.or.kr/kor/images/main/logo.gif', path.join(__dirname, 'public', 'kipris-logo.gif'), options);
    console.log('KIPRIS logo downloaded successfully.');
  } catch (error) {
    console.error(error);
  }
})();
