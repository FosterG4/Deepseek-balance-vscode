const https = require('https');

// Replace with your actual API key for testing
const API_KEY = process.argv[2] || 'YOUR_API_KEY_HERE';

if (API_KEY === 'YOUR_API_KEY_HERE') {
  console.error('Please provide your DeepSeek API key as argument:');
  console.error('node test-api.js YOUR_API_KEY');
  process.exit(1);
}

const options = {
  hostname: 'api.deepseek.com',
  path: '/user/balance',
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  }
};

console.log('Testing DeepSeek API endpoint...');
console.log(`Host: ${options.hostname}`);
console.log(`Path: ${options.path}`);

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response Body:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('Parsed Response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();