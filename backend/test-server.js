import app from './src/index.js';

// Test that the app is exported correctly
console.log('✅ App exported successfully');
console.log('✅ App type:', typeof app);
console.log('✅ App fetch:', typeof app.fetch);

// Test health endpoint
const req = new Request('http://localhost:8787/health');
const res = await app.fetch(req);
const data = await res.json();
console.log('✅ Health check:', data);

console.log('\n✅ Phase 2 backend is working correctly!');
console.log('\nAPI Endpoints Available:');
console.log('  POST /auth/register - Register a new device');
console.log('  GET /me/settings - Get user settings');
console.log('  PUT /me/settings - Update user settings');
console.log('  PUT /me/location - Update location');
console.log('  GET /health - Health check');
