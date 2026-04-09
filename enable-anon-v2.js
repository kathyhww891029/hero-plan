// Try to enable anonymous login using the CloudBase CLI's internal modules
const path = require('path');

// First let's check what's available in the CLI package
const cliPath = path.join(__dirname, 'node_modules/@cloudbase/cli/dist/standalone/cli.js');

// Try to get the CloudService and use it
// We need to load the CLI in a way that gives us access to the internal APIs

const fs = require('fs');
const envConfig = JSON.parse(fs.readFileSync('/Users/huweiwei/.clacky/envs/cloudbase/cloudbase-env.json', 'utf8'));

console.log('Env config loaded');
console.log('SecretId available:', !!envConfig.secretId);
console.log('SecretKey available:', !!envConfig.secretKey);
console.log('Token available:', !!envConfig.token);
console.log('EnvId:', envConfig.envId);

// Now let's try to call the CreateLoginConfig API using the tcbr platform approach
// The tcbr (cloudbase run) service might have the right context

// Actually, let's try a different approach - use the raw HTTP request directly
const crypto = require('crypto');

const secretId = envConfig.secretId;
const secretKey = envConfig.secretKey;
const envId = 'kathyhww1029-7gop3h5x37223dd9';
const region = envConfig.region || 'ap-shanghai';

// Build the request
const service = 'tcb';
const host = `${service}.api.qcloud.com`;
const endpoint = `https://${host}`;

// PlatformSecret for ANONYMOUS login must be encrypted
// Looking at the CLI code, it uses rsaEncrypt with a public key
// Let's try without encryption first and see

const params = {
    EnvId: envId,
    Platform: 'ANONYMOUS',
    PlatformId: 'anonymous',
    PlatformSecret: 'anonymous', // TODO: needs RSA encryption
    Status: 'ENABLE'
};

console.log('Params:', JSON.stringify(params, null, 2));
