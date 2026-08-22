'use strict';

const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

function configureSecurity(app) {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(compression());

  const defaultOrigins = [
    'https://ai.hpdev.name.vn',
    'https://openclaw.hpdev.name.vn',
    'https://api.hpdev.name.vn',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : defaultOrigins;

  app.use(cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (như curl, mobile apps, bot server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true); // Dev/fallback permissive
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  }));
}

module.exports = configureSecurity;

