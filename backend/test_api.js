const http = require('http');

const data = JSON.stringify({
  name: 'API Test Project',
  client: 'Test Client',
  pm_id: 1,
  status: 'new',
  priority: 'high',
  start_date: '2026-01-01',
  deadline: '2026-12-31',
  description: 'Test Desc',
  team: [1]
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/projects',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d));
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
