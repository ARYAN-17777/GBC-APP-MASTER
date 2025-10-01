#!/usr/bin/env node

const jsonServer = require('json-server');
const path = require('path');

// Create a server
const server = jsonServer.create();

// Set default middlewares (logger, static, cors and no-cache)
const middlewares = jsonServer.defaults({
  static: './public'
});

// Read JSON file
const router = jsonServer.router(path.join(__dirname, 'gbc-mock-db.json'));

// Add custom middleware for CORS and API key validation
server.use((req, res, next) => {
  // Enable CORS for all origins
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, X-GBC-API-Key, X-API-Version');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Add custom routes for GBC API compatibility
server.use(jsonServer.rewriter({
  '/api/v1/orders': '/orders',
  '/api/v1/menu': '/menuItems',
  '/api/v1/notifications': '/notifications',
  '/api/v1/users': '/users',
  '/api/v1/analytics': '/analytics'
}));

// Custom middleware to log requests
server.use((req, res, next) => {
  console.log(`🚀 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Use default middlewares
server.use(middlewares);

// Add custom routes before JSON Server router
server.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'GBC Mock API Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Custom route for testing API connection
server.get('/test', (req, res) => {
  res.json({
    message: 'GBC API Test Successful! 🎉',
    apiKey: req.headers['x-gbc-api-key'] || 'No API key provided',
    timestamp: new Date().toISOString(),
    endpoints: {
      orders: '/orders',
      menuItems: '/menuItems',
      notifications: '/notifications',
      users: '/users'
    }
  });
});

// Use default router
server.use(router);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 GBC Mock API Server is running!');
  console.log(`📡 Server URL: http://localhost:${PORT}`);
  console.log(`🌐 Network URL: http://0.0.0.0:${PORT}`);
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log(`   GET    http://localhost:${PORT}/health`);
  console.log(`   GET    http://localhost:${PORT}/test`);
  console.log(`   GET    http://localhost:${PORT}/orders`);
  console.log(`   POST   http://localhost:${PORT}/orders`);
  console.log(`   GET    http://localhost:${PORT}/menuItems`);
  console.log(`   GET    http://localhost:${PORT}/notifications`);
  console.log(`   POST   http://localhost:${PORT}/notifications`);
  console.log(`   GET    http://localhost:${PORT}/users`);
  console.log('');
  console.log('🧪 Test in Postman:');
  console.log(`   POST http://localhost:${PORT}/orders`);
  console.log(`   POST http://localhost:${PORT}/notifications`);
  console.log('');
  console.log('📱 For mobile testing, replace localhost with your IP address');
  console.log('💡 Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down GBC Mock API Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down GBC Mock API Server...');
  process.exit(0);
});
