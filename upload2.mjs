#!/usr/bin/env node
/**
 * TCB 静态网站部署脚本
 * 使用 COS API 直接上传文件
 */
import { createHmac, createHash } from 'crypto';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import https from 'https';

// ============ 配置 ============
const BUCKET = '7f9f-static-kathyhww1029-7gop3h5x37223dd9-1420290341';
const REGION = 'ap-mumbai';  // 孟买
const SECRET_ID = 'AKIDaBmGdt8IKDVp9MSK0VotmSt9BzZx97tR';
const SECRET_KEY = 'QdgaHrFdozzsa8VgeQ0NZZK0X0P3BKSe';
const APP_DOMAIN = 'kathyhww1029-7gop3h5x37223dd9-1420290341.tcloudbaseapp.com';

// ============ 生成 COS 签名 (v5算法) ============
function cosPutSignature(sKey, method, path, qSignTime) {
  const s = `${method}\n${path}\n\n\n${qSignTime}\n`;
  const h = createHmac('sha1', sKey).update(s).digest('hex');
  return h;
}

function uploadFile(filePath, cloudPath) {
  return new Promise((resolve, reject) => {
    const content = readFileSync(filePath);
    const contentType = getContentType(cloudPath) || 'application/octet-stream';
    const fileSize = content.length;

    const qSignTime = `${Math.floor(Date.now()/1000)-60};${Math.floor(Date.now()/1000)+3600}`;
    const path = `/${cloudPath}`;
    const sign = cosPutSignature(SECRET_KEY, 'PUT', path, qSignTime);

    const host = `${BUCKET}.cos.${REGION}.myqcloud.com`;
    const urlPath = path; // already starts with /

    const auth = `q-sign-algorithm=sha1&q-ak=${SECRET_ID}&q-sign-time=${qSignTime}&q-key-time=${qSignTime}&q-header-list=content-type;host&q-url-param-list=&q-signature=${sign}`;

    const options = {
      hostname: host,
      path: urlPath,
      method: 'PUT',
      headers: {
        'Authorization': auth,
        'Content-Type': contentType,
        'Content-Length': fileSize,
        'Host': host,
        'x-cos-acl': 'public-read',
      },
      timeout: 30000,
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`  ✅ ${cloudPath}`);
          resolve();
        } else {
          console.log(`  ❌ ${cloudPath} → HTTP ${res.statusCode}: ${body.substring(0,100)}`);
          resolve(); // 不阻塞其他文件
        }
      });
    });
    req.on('error', e => {
      console.log(`  ❌ ${cloudPath} → ${e.message}`);
      resolve();
    });
    req.on('timeout', () => {
      req.destroy();
      console.log(`  ❌ ${cloudPath} → 超时`);
      resolve();
    });
    req.write(content);
    req.end();
  });
}

function getContentType(file) {
  const ext = extname(file).toLowerCase();
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
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
  };
  return types[ext] || 'application/octet-stream';
}

// ============ 收集文件 ============
function collectFiles(dir) {
  const result = [];
  const skip = new Set(['.git', 'node_modules', '.gitignore', 'package.json',
    'package-lock.json', 'upload-tcb.mjs', 'upload2.mjs', 'cloudbase-env.json',
    'FIREBASE_SECURITY_FIX.md', 'firebase.rules.json']);
  const skipExt = ['.md', '.mjs', '.rules.json'];

  function walk(d, prefix = '') {
    for (const entry of readdirSync(d)) {
      if (skip.has(entry)) continue;
      if (skipExt.some(e => entry.endsWith(e))) continue;
      const full = join(d, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full, prefix ? `${prefix}/${entry}` : entry);
      } else {
        const cloud = prefix ? `${prefix}/${entry}` : entry;
        result.push({ local: full, cloud });
      }
    }
  }
  walk(dir);
  return result;
}

// ============ 主流程 ============
const BASE = process.cwd();
const files = collectFiles(BASE);

console.log(`\n📤 部署 ${files.length} 个文件...`);
console.log(`🪣 ${BUCKET} (${REGION})\n`);

(async () => {
  for (const f of files) {
    await uploadFile(f.local, f.cloud);
  }
  console.log(`\n✅ 全部完成！`);
  console.log(`🌐 访问: https://${APP_DOMAIN}/`);
})();
