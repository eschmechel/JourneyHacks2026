import http from 'http';
import app from './src/index.js';
import { db } from './src/db/client.js';

// Mock Cloudflare environment for local development
// Use the actual better-sqlite3 database instead of mock
const mockEnv = {
  DB: db,
};

const port = 8787;

const server = http.createServer(async (req, res) => {
  try {
    const url = `http://localhost:${port}${req.url}`;
    const request = new Request(url, {
      method: req.method,
      headers: req.headers as HeadersInit,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await getBody(req) : undefined,
    });
    
    const response = await app.fetch(request, mockEnv);
    
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (error: any) {
    console.error('Server error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: error.message }));
  }
});

function getBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => body += chunk);
    req.on('end', () => resolve(body));
  });
}

server.listen(port, () => {
  console.log(`🚀 Starting Proximity Radar Backend on http://localhost:${port}`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  POST /auth/register - Register a new device');
  console.log('  GET /me/settings - Get user settings');
  console.log('  PUT /me/settings - Update user settings');
  console.log('  PUT /me/location - Update location');
  console.log('  GET /health - Health check');
  console.log('');
});
