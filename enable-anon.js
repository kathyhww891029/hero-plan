const cli = require('./node_modules/@cloudbase/cli/dist/standalone/cli.js');

// We need to access the internal modules
// Let's try calling the API through the CLI's API framework

async function main() {
    const envId = 'kathyhww1029-7gop3h5x37223dd9';
    
    // Use the cli.api() approach  
    const result = await cli.api('tcb', 'CreateLoginConfig', {
        EnvId: envId,
        Platform: 'ANONYMOUS',
        PlatformId: 'anonymous',
        PlatformSecret: 'anonymous', // Will be encrypted internally if needed
        Status: 'ENABLE'
    }, { envId });
    
    console.log('Result:', JSON.stringify(result, null, 2));
}

main().catch(console.error);
