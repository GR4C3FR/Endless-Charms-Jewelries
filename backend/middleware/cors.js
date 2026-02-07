const cors = require('cors');

// Example: CORS_ALLOWED_ORIGINS=https://example.com,https://admin.example.com
const raw = process.env.CORS_ALLOWED_ORIGINS || '';
const allowedOrigins = raw.split(',').map(s => s.trim()).filter(Boolean);

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
