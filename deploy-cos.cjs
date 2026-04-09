#!/usr/bin/env node
/**
 * 直接从文件系统上传到腾讯云 COS
 * 绕过服务器/浏览器缓存问题
 */
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  secretId: 'AKIDaBmGdt8IKDVp9MSK0VotmSt9BzZx97tR',
  secretKey: 'QdgaHrFdozzsa8VgeQ0NZZK0X0P3BKSe',
  bucket: '7f9f-static-kathyhww1029-7gop3h5x37223dd9-1420290341',
  region: 'ap-mumbai',
};

function encodeKey(key) {
  return '/' + key.split('/').filter(Boolean).map(p => encodeURIComponent(p)).join('/');
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };
  return types[ext] || 'application/octet-stream';
}

function uploadFile(content, cloudPath, contentType) {
  return new Promise((resolve, reject) => {
    const cosHost = CONFIG.bucket + '.cos.' + CONFIG.region + '.myqcloud.com';
    const cosKey = encodeKey(cloudPath);
    const url = new URL('https://' + cosHost + cosKey);

    const date = new Date().toUTCString();
    const str2sign = 'PUT\n' + cosKey + '\n\n' + date + '\n';
    const auth = crypto.createHmac('sha1', CONFIG.secretKey).update(str2sign).digest('base64');
    const now = Math.floor(Date.now() / 1000);
    const Authorization =
      'q-sign-algorithm=sha1&q-ak=' + CONFIG.secretId +
      '&q-sign-time=' + now + ';' + (now + 3600) +
      '&q-key-time=' + now + ';' + (now + 3600) +
      '&q-header-list=content-type;date;host&q-url-param-list=&q-signature=' + auth;

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'PUT',
      headers: {
        'Authorization': Authorization,
        'Content-Type': contentType,
        'Content-Length': content.length,
        'Date': date,
        'Host': cosHost,
        'x-cos-acl': 'public-read',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve({ ok: true, status: res.statusCode });
        } else {
          resolve({ ok: false, status: res.statusCode, data: data.slice(0, 200) });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.write(content);
    req.end();
  });
}

function collectFiles(baseDir) {
  const files = [];
  const skipDirs = ['.git', 'node_modules', '.gitignore'];
  const skipFiles = ['package.json', 'package-lock.json', 'upload-tcb.mjs', 'cloudbase-env.json',
    'FIREBASE_SECURITY_FIX.md', 'fix_*.mjs', '*.rules.json', 'deploy-fix.mjs', 'deploy.exp',
    'expect-*.exp', 'enable-anon*.js', 'fix_*.mjs', 'upload2.mjs', 'DEPLOY_INSTRUCTIONS.txt',
    'deploy-cos.cjs', 'deploy.html', 'uploader.html'];
  const skipExts = ['.md', '.mjs'];

  function walk(dir, prefix = '') {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      if (skipDirs.includes(entry)) continue;
      if (skipFiles.some(f => entry === f || entry.match(new RegExp('^' + f.replace(/\*/g, '.*') + '$')))) continue;
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (entry === 'sounds' || entry === 'assets') {
          walk(fullPath, prefix ? prefix + '/' + entry : entry);
        }
      } else {
        const ext = path.extname(entry);
        if (skipExts.includes(ext)) continue;
        const cloudPath = prefix ? prefix + '/' + entry : entry;
        files.push({ local: fullPath, cloud: cloudPath });
      }
    }
  }
  walk(baseDir);
  return files;
}

async function main() {
  const baseDir = process.cwd();
  const files = collectFiles(baseDir);

  console.log('\n📤 直接文件系统上传到 TCB (绕过缓存)...');
  console.log(`🪣 存储桶: ${CONFIG.bucket} (${CONFIG.region})\n`);
  console.log('📁 文件列表:');
  for (const f of files) {
    const stat = fs.statSync(f.local);
    console.log('  ' + f.cloud + ' (' + stat.size + ' bytes)');
  }
  console.log();

  let done = 0;
  let errors = 0;

  for (const f of files) {
    try {
      const content = fs.readFileSync(f.local);
      const contentType = getContentType(f.local);
      console.log('⬆️ 上传 ' + f.cloud + ' (' + content.length + ' bytes)...');
      const result = await uploadFile(content, f.cloud, contentType);
      if (result.ok) {
        console.log('  ✅ ' + f.cloud);
        done++;
      } else {
        console.log('  ❌ ' + f.cloud + ' → HTTP ' + result.status + ': ' + result.data);
        errors++;
      }
    } catch (e) {
      console.log('  ❌ ' + f.cloud + ' → ' + e.message);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ 完成！成功 ' + done + ' 个，失败 ' + errors + ' 个');
  if (done > 0) {
    console.log('🌐 访问: https://' + CONFIG.bucket + '.cos.' + CONFIG.region + '.myqcloud.com/');
    console.log('📱 App:  https://' + CONFIG.bucket.replace('7f9f-', '') + '.tcloudbaseapp.com/');
  }
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
