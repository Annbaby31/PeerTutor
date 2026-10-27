import app from '../server.js';

const TEST_PORT = 5055;

const server = app.listen(TEST_PORT, async () => {
  try {
    const res = await fetch(`http://localhost:${TEST_PORT}/api/health`);
    const data = await res.json();
    console.log('[PASS] Server health check response:', data);
    server.close(() => {
      console.log('[PASS] Test server cleanly closed');
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Server health check failed:', err);
    server.close(() => process.exit(1));
  }
});
