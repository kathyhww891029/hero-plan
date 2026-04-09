import { createHmac } from 'crypto';
import { readFileSync } from 'fs';
import https from 'https';

const BUCKET = '7f9f-static-kathyhww1029-7gop3h5x37223dd9-1420290341';
const REGION = 'ap-mumbai';
const SECRET_ID = 'AKIDaBmGdt8IKDVp9MSK0VotmSt9BzZx97tR';
const SECRET_KEY = 'QdgaHrFdozzsa8VgeQ0NZZK0X0P3BKSe';

function cosPutSignature(sKey, method, path, qSignTime) {
  const s = method + '\n' + path + '\n\n\n' + qSignTime + '\n';
  return createHmac('sha1', sKey).update(s).digest('hex');
}

function uploadFile(filePath, cloudPath) {
  return new Promise((resolve, reject) => {
    const content = readFileSync(filePath);
    const qSignTime = Math.floor(Date.now()/1000) - 60 + ';' + (Math.floor(Date.now()/1000) + 3600);
    const sign = cosPutSignature(SECRET_KEY, 'PUT', '/' + cloudPath, qSignTime);
    const host = BUCKET + '.cos.' + REGION + '.myqcloud.com';
    const auth = 'q-sign-algorithm=sha1&q-ak=' + SECRET_ID + '&q-sign-time=' + qSignTime + '&q-key-time=' + qSignTime + '&q-header-list=content-type;host&q-url-param-list=&q-signature=' + sign;

    const req = https.request({
      hostname: host, path: '/' + cloudPath, method: 'PUT',
      headers: { 'Authorization': auth, 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': content.length, 'Host': host, 'x-cos-acl': 'public-read' },
      timeout: 15000
    }, res => { console.log(res.statusCode === 200 ? '✅ ' + cloudPath : '❌ ' + res.statusCode); resolve(); });
    req.on('error', e => { console.log('❌ ' + e.message); resolve(); });
    req.write(content); req.end();
  });
}

uploadFile('index.html', 'index.html').then(() => uploadFile('app.js', 'app.js'));
