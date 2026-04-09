// Enable anonymous login using the exported createLoginConfig function
// This function is exported from the CLI bundle at line 541968

const path = require('path');
const fs = require('fs');

// Load the CLI bundle
const cliPath = path.join(__dirname, 'node_modules/@cloudbase/cli/dist/standalone/cli.js');
const cliBundle = fs.readFileSync(cliPath, 'utf8');

// The createLoginConfig function is exported at line 541938
// Let's extract and use it directly

// Actually, we can't easily call the exported function because of webpack module system
// Instead, let's manually implement what the function does using the TCB API service

// The key insight is that the createLoginConfig function at line 541968 uses:
// 1. CloudApiService.getInstance('tcb') to get a TCB service instance
// 2. tcbService.request('CreateLoginConfig', params) to make the API call
// 3. rsaEncrypt(appSecret) to encrypt the platform secret

// Let's look for CloudApiService in the bundle
const crypto = require('crypto');

const publicRsaKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC0ZLB0ZpWWFsHPnDDw++Nc2wI3
nl2uyOrIJ5FUfxt4GAmt1Faf5pgMxAnL9exEUrrUDUX8Ri1R0KyfnHQQwCvKt8T8
bgILIJe9UB8e9dvFqgqH2oA8Vqwi0YqDcvFLFJk2BJbm/0QYtZ563FumW8LEXAgu
UeHi/0OZN9vQ33jWMQIDAQAB
-----END PUBLIC KEY-----`;

function rsaEncrypt(data) {
    const buffer = Buffer.from(data);
    const encrypted = crypto.publicEncrypt({
        key: publicRsaKey,
        padding: crypto.constants.RSA_PKCS1_PADDING
    }, buffer);
    return encrypted.toString('base64');
}

// Now we need to use the CloudApiService
// Looking at the code, it seems like CloudApiService is a singleton that uses
// the credential from the environment or cloudbase context

// Let me try a different approach - use the raw HTTPS request with Tencent Cloud API signature
// Based on how CloudService.request works in the CLI

const envConfig = JSON.parse(fs.readFileSync('/Users/huweiwei/clacky_workspace/hero-plan/cloudbase-env.json', 'utf8'));

const secretId = envConfig.secretId;
const secretKey = envConfig.secretKey;
const token = envConfig.token;
const envId = 'kathyhww1029-7gop3h5x37223dd9';

console.log('SecretId:', secretId ? 'present' : 'missing');
console.log('SecretKey:', secretKey ? 'present' : 'missing');
console.log('Token:', token ? 'present' : 'missing');

// Try to find CloudApiService in the bundle
const CloudApiServiceMatch = cliBundle.match(/class CloudApiService[\s\S]*?module\.exports\s*=\s*CloudApiService/);
if (CloudApiServiceMatch) {
    console.log('Found CloudApiService class');
} else {
    console.log('CloudApiService class not found as expected export');
}

// Let me try to use https://github.com/TencentCloud/tencentcloud-sdk-cloudbase-nodejs directly
// But first, let's check if we can load the manager_node from the bundle

// Since the bundle uses webpack, we can't easily extract and use individual functions
// Let me try a workaround - use the same signing logic

// Looking at CloudService.requestWithSign(), it uses TC3-HMAC-SHA256 signing
// Let me implement this manually

const https = require('https');

// TC3-HMAC-SHA256 signing
function tc3HmacSha256(secretKey, msg) {
    let hash = crypto.createHmac('sha256', secretKey);
    hash.update(msg, 'utf8');
    return hash.digest();
}

function sha256(msg) {
    return crypto.createHash('sha256').update(msg, 'utf8').digest();
}

async function makeTCBRequest(action, params, secretId, secretKey, token, envId) {
    const host = 'tcb.tencentcloudapi.com';
    const service = 'tcb';
    const version = '2018-06-08';
    const region = 'ap-shanghai';
    const timestamp = Math.floor(Date.now() / 1000);
    const date = new Date(timestamp * 1000).toISOString().split('T')[0];
    
    // Canonical request
    const httpRequestMethod = 'POST';
    const canonicalUri = '/';
    const canonicalQueryString = '';
    const canonicalHeaders = `content-type:application/json\nhost:${host}\n`;
    const signedHeaders = 'content-type;host';
    
    const payload = JSON.stringify(params);
    const hashedPayload = sha256(payload);
    
    const canonicalRequest = `${httpRequestMethod}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`;
    
    // String to sign
    const algorithm = 'TC3-HMAC-SHA256';
    const credentialScope = `${date}/${service}/tc3_request`;
    const hashedCanonicalRequest = sha256(canonicalRequest);
    const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;
    
    // Calculate signature
    const secretDate = tc3HmacSha256('TC3' + secretKey, date);
    const secretService = tc3HmacSha256(secretDate, service);
    const secretSigning = tc3HmacSha256(secretService, 'tc3_request');
    const signature = crypto.createHmac('sha256', secretSigning).update(stringToSign, 'utf8').digest('hex');
    
    // Authorization header
    const authorization = `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    
    // Build request
    const headers = {
        'Content-Type': 'application/json',
        'Host': host,
        'X-TC-Action': action,
        'X-TC-Version': version,
        'X-TC-Timestamp': timestamp.toString(),
        'X-TC-Region': region,
        'Authorization': authorization
    };
    
    if (token) {
        headers['X-TC-Token'] = token;
    }
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: host,
            port: 443,
            path: '/',
            method: 'POST',
            headers: headers
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });
        
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function main() {
    const encryptedSecret = rsaEncrypt('anonymous');
    console.log('Encrypted secret:', encryptedSecret.substring(0, 50) + '...');
    
    const params = {
        EnvId: envId,
        Platform: 'ANONYMOUS',
        PlatformId: 'anonymous',
        PlatformSecret: encryptedSecret,
        Status: 'ENABLE'
    };
    
    console.log('Calling CreateLoginConfig...');
    try {
        const result = await makeTCBRequest('CreateLoginConfig', params, secretId, secretKey, token, envId);
        console.log('Result:', JSON.stringify(result, null, 2));
        
        if (result.Response && result.Response.Error) {
            console.error('API Error:', result.Response.Error.Code, result.Response.Error.Message);
        } else if (result.Response && result.Response.RequestId) {
            console.log('Success! RequestId:', result.Response.RequestId);
        }
    } catch (e) {
        console.error('Request failed:', e.message);
    }
    
    // Verify
    console.log('\nVerifying with DescribeLoginConfigs...');
    try {
        const verifyResult = await makeTCBRequest('DescribeLoginConfigs', { EnvId: envId }, secretId, secretKey, token, envId);
        console.log('Configs:', JSON.stringify(verifyResult, null, 2));
    } catch (e) {
        console.error('Verify failed:', e.message);
    }
}

main().catch(console.error);
