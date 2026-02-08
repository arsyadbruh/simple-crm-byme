import PocketBase from 'pocketbase';

// Initialize PocketBase client
// Replace with your PocketBase server URL
const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

export default pb;
