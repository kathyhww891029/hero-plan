const tencentcloud = require("tencentcloud-sdk-cloudbase");

const fs = require('fs');
const envConfig = JSON.parse(fs.readFileSync('/Users/huweiwei/.clacky/envs/cloudbase/cloudbase-env.json', 'utf8'));

const secretId = envConfig.secretId;
const secretKey = envConfig.secretKey;
const token = envConfig.token;
const envId = envConfig.envId;

console.log('Initializing CloudBase client...');

const { CloudBase } = tencentcloud.cloudbase;

async function main() {
    const cloudbase = new CloudBase({
        secretId,
        secretKey,
        token,
        envId,
        region: 'ap-shanghai'
    });

    // Try calling CreateLoginConfig through the service
    const app = await cloudbase.getTcbeService();
    
    console.log('App type:', typeof app);
    console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(app)).filter(p => p.includes('Login') || p.includes('login')).join(', '));
    
    // Check if createLoginConfig is available
    if (typeof app.createLoginConfig === 'function') {
        console.log('Found createLoginConfig method!');
        try {
            const result = await app.createLoginConfig('ANONYMOUS', 'anonymous', 'anonymous');
            console.log('Result:', JSON.stringify(result, null, 2));
        } catch (e) {
            console.error('Error:', e.message);
        }
    } else {
        console.log('createLoginConfig not found on this service');
        
        // List available methods
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(app)).filter(p => typeof app[p] === 'function');
        console.log('First 20 methods:', methods.slice(0, 20).join(', '));
    }
}

main().catch(console.error);
