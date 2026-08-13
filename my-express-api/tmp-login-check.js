const http = require('http');

const req = http.request({
  host: 'localhost',
  port: 3001,
  path: '/api/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('status', res.statusCode);
    console.log(data);
  });
});

req.on('error', (err) => {
  console.error(err);
  process.exit(1);
});

req.write(JSON.stringify({ email: 'admin@admin.com', password: 'admin123' }));
req.end();
