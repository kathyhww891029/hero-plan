const crypto = require('crypto');
const fs = require('fs');

// The PUBLIC_RSA_KEY from the CLI
const PUBLIC_RSA_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC0ZLB0ZpWWFsHPnDDw++Nc2wI3
nl2uyOrIJ5FUfxt4GAmt1Faf5pgMxAnL9exEUrrUDUX8Ri1R0KyfnHQQwCvKt8T8
bgILIJe9UB8e9dvFqgqH2oA8Vqwi0YqDcvFLFJk2BJbm/0QYtZ563FumW8LEXAgu
UeHi/0OZN9vQ33jWMQIDAQAB
-----END PUBLIC KEY-----`;

function rsaEncrypt(data) {
    const buffer = Buffer.from(data);
    const encrypted = crypto.publicEncrypt({
        key: PUBLIC_RSA_KEY,
        padding: crypto.constants.RSA_PKCS1_PADDING
    }, buffer);
    return encrypted.toString('base64');
}

const encryptedSecret = rsaEncrypt('anonymous');
console.log('Encrypted PlatformSecret:', encryptedSecret);

// Now call the API using the CLI's api command with the encrypted secret
const { execSync } = require('child_process');

const envId = 'kathyhww1029-7gop3h5x37223dd9';
const body = JSON.stringify({
    EnvId: envId,
    Platform: 'ANONYMOUS',
    PlatformId: 'anonymous',
    PlatformSecret: encryptedSecret,
    Status: 'ENABLE'
});

console.log('Calling CreateLoginConfig API with encrypted secret...');
try {
    const result = execSync(`node node_modules/@cloudbase/cli/dist/standalone/cli.js api tcb CreateLoginConfig -e ${envId} --body '${body}' --json 2>&1`, {
        cwd: '/Users/huweiwei/clacky_workspace/hero-plan',
        encoding: 'utf8',
        timeout: 20000
    });
    console.log('Result:', result);
} catch (e) {
    console.error('Error:', e.message);
    console.error('Output:', e.stdout);
    console.error('Stderr:', e.stderr);
}

// Verify the login config was created
console.log('\nVerifying login config...');
try {
    const verifyResult = execSync(`node node_modules/@cloudbase/cli/dist/standalone/cli.js env login list -e ${envId} --json 2>&1`, {
        cwd: '/Users/huweiwei/clacky_workspace/hero-plan',
        encoding: 'utf8',
        timeout: 20000
    });
    console.log('Login configs:', verifyResult);
} catch (e) {
    console.error('Error verifying:', e.message);
}
