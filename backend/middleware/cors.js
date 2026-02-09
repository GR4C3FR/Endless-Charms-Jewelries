const cors = require('cors');

// Example: CORS_ALLOWED_ORIGINS=https://example.com,https://admin.example.com
const raw = process.env.CORS_ALLOWED_ORIGINS || '';
const allowedOrigins = raw.split(',').map(s => s.trim()).filter(Boolean);

// Add localhost origins in development
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000');
  allowedOrigins.push('http://127.0.0.1:3000');
  allowedOrigins.push('https://localhost:3000');
  allowedOrigins.push('https://127.0.0.1:3000');
}

let corsOptions = {
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
};

if (allowedOrigins.length > 0) {
  corsOptions.origin = function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Origin not allowed'));
  };
} else {
  corsOptions.origin = true;
}

module.exports = cors(corsOptions);
