// Enable anonymous login using the CLI's internal modules
const { getEnvService } = require('./node_modules/@cloudbase/cli/dist/standalone/cli.js');

async function main() {
    const envId = 'kathyhww1029-7gop3h5x37223dd9';
    
    console.log('Getting env service...');
    const envService = await getEnvService(envId);
    
    console.log('Env service type:', typeof envService);
    console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(envService)).filter(p => p.toLowerCase().includes('login')).join(', '));
    
    // Check if createLoginConfig is available
    if (typeof envService.createLoginConfig === 'function') {
        console.log('Found createLoginConfig! Calling it...');
        try {
            const result = await envService.createLoginConfig('ANONYMOUS', 'anonymous', 'anonymous');
            console.log('Result:', JSON.stringify(result, null, 2));
        } catch (e) {
            console.error('Error calling createLoginConfig:', e.message);
            console.error('Full error:', e);
        }
    } else {
        console.log('createLoginConfig method not found');
        // List all available methods
        const proto = Object.getPrototypeOf(envService);
        const methods = Object.getOwnPropertyNames(proto).filter(p => typeof proto[p] === 'function');
        console.log('First 30 methods:', methods.slice(0, 30).join(', '));
    }
}

main().catch(e => {
    console.error('Script error:', e.message);
    console.error(e);
});
