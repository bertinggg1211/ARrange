const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_me';

// Log JWT secret status on startup
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  Using default JWT_SECRET. Set JWT_SECRET in .env for production!');
} else {
  console.log('✅ JWT_SECRET loaded from environment');
}

module.exports = function auth(req, res, next) {
  console.log('🔐 Auth middleware called for:', req.method, req.path);
  
  const header = req.headers.authorization || '';
  console.log('🔍 Authorization header:', header ? `Bearer ${header.slice(7, 20)}...` : 'Missing');
  
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    console.error('❌ No token provided');
    return res.status(401).json({ message: 'Missing token' });
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token valid for user:', payload.email, 'Role:', payload.role);
    req.user = payload;
    next();
  } catch (e) {
    console.error('❌ Token verification failed:', e.message);
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};


