#!/usr/bin/env node
/**
 * TCB 静态网站文件上传脚本
 * 使用 COS API 直接上传文件到 TCB 静态托管存储桶
 */
import { createHmac, createHash } from 'crypto';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import https from 'https';

// ============ 配置 ============
const CONFIG = {
  envId: 'kathyhww1029-7gop3h5x37223dd9',
  secretId: 'AKIDaBmGdt8IKDVp9MSK0VotmSt9BzZx97tR',
  secretKey: 'QdgaHrFdozzsa8VgeQ0NZZK0X0P3BKSe',
  bucket: '7f9f-static-kathyhww1029-7gop3h5x37223dd9-1420290341',
  region: 'ap-mumbai',  // 孟买
};

// ============ COS 签名工具 ============
function encodeKey(key) {
  return '/' + key.split('/').filter(Boolean).map(p => encodeURIComponent(p)).join('/');
}

function makeCosSignature(method, key, headers, secretKey) {
  const crypto = createHmac;
  const str2sign = [
    method,
    key,
    Object.entries(headers)
      .filter(([k]) => ['content-type', 'date', 'host'].includes(k.toLowerCase()))
      .map(([k, v]) => `${k.toLowerCase()}:${v}`).join('\n'),
  ].join('\n');

  const signature = crypto('sha1', secretKey).update(str2sign).digest('base64');
  return signature;
}

// ============ 上传单个文件 ============
function uploadFile(localPath, cloudPath) {
  const secretKey = CONFIG.secretKey;
  const secretId = CONFIG.secretId;
  const bucket = CONFIG.bucket;
  const region = CONFIG.region;

  const cosHost = `${bucket}.cos.${region}.myqcloud.com`;
  const cosKey = encodeKey(cloudPath);
  const url = `https://${cosHost}${cosKey}`;

  const content = readFileSync(localPath);
  const contentType = getContentType(cloudPath);

  const date = new Date().toUTCString();
  const sha1 = createHash('sha1').update(content).digest('hex');

  const auth = makeCosSignature('PUT', cosKey, {
    'content-type': contentType,
    'date': date,
    'host': cosHost,
  }, secretKey);

  const Authorization = `q-sign-algorithm=sha1&q-ak=${secretId}&q-sign-time=;${Math.floor(Date.now()/1000)+3600}&q-key-time=;${Math.floor(Date.now()/1000)+3600}&q-header-list=content-type;date;host&q-url-param-list=&q-signature=${auth}`;

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
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
          console.log(`  ✅ ${cloudPath}`);
          resolve();
        } else {
          console.log(`  ❌ ${cloudPath} → HTTP ${res.statusCode}: ${data.slice(0, 200)}`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    req.write(content);
    req.end();
  });
}

// ============ 获取 Content-Type ============
function getContentType(path) {
  const ext = extname(path).toLowerCase();
  const types = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
  };
  return types[ext] || 'application/octet-stream';
}

// ============ 收集所有要上传的文件 ============
function collectFiles(baseDir) {
  const files = [];
  const skipDirs = ['.git', 'node_modules', '.gitignore', 'package.json', 'package-lock.json', 'upload-tcb.mjs', 'cloudbase-env.json', 'FIREBASE_SECURITY_FIX.md', 'fix_*.mjs', '*.rules.json'];
  const skipExts = ['.md', '.mjs'];

  function walk(dir, prefix = '') {
    for (const entry of readdirSync(dir)) {
      if (skipDirs.some(s => entry === s || entry.match(new RegExp(s.replace('*', '.*'))))) continue;
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory()) {
        if (entry === 'sounds' || entry === 'assets') {
          walk(fullPath, prefix ? `${prefix}/${entry}` : entry);
        }
      } else {
        const ext = extname(entry);
        if (skipExts.includes(ext)) continue;
        const cloudPath = prefix ? `${prefix}/${entry}` : entry;
        files.push({ local: fullPath, cloud: cloudPath });
      }
    }
  }
  walk(baseDir);
  return files;
}

// ============ 主流程 ============
const baseDir = process.cwd();
const files = collectFiles(baseDir);

console.log(`\n📤 开始上传 ${files.length} 个文件到 TCB 静态托管...`);
console.log(`🪣 存储桶: ${CONFIG.bucket} (${CONFIG.region})\n`);

let done = 0;
let errors = 0;

for (const f of files) {
  try {
    await uploadFile(f.local, f.cloud);
    done++;
  } catch (e) {
    errors++;
    if (errors > 3) {
      console.log('\n⚠️ 错误过多，停止上传');
      break;
    }
  }
}

console.log(`\n✅ 完成！成功 ${done} 个，失败 ${errors} 个`);
console.log(`🌐 访问地址: https://${CONFIG.bucket}.cos.${CONFIG.region}.myqcloud.com/`);
console.log(`📱 App 地址: https://${CONFIG.bucket.replace('7f9f-', '')}.tcloudbaseapp.com/`);
