require('dotenv').config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
// const mongoose = require("mongoose");
const { connect: connectSupabase } = require('./db/supabase');
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const path = require("path");
const fs = require("fs");
const chatRoutes = require("./routes/chatRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const productRoutesSupabase = require("./routes/productRoutesSupabase");
const cartRoutes = require("./routes/cartRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const kiriRoutes = require("./routes/kiriRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const orderRoutes = require("./routes/orderRoutes");
const likesRoutes = require("./routes/likesRoutes");
const arWebhookKiri = require('./routes/arWebhookKiri');
const arWebhookTripo = require('./routes/arWebhookTripo');
const tripoRoutes = require('./routes/tripoRoutes');
const adminRoutes = require("./routes/adminRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();
const server = http.createServer(app);

// Set server timeout to prevent hanging requests - OPTIMIZED
server.timeout = 60000; // 60 seconds (increased for large uploads)
server.keepAliveTimeout = 65000; // 65 seconds (should be > timeout)
server.headersTimeout = 66000; // 66 seconds (should be > keepAliveTimeout)
server.maxConnections = 1000; // Limit concurrent connections
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:8081',
      'http://192.168.100.9:8081',
      'http://10.0.2.2:8081',
      'exp://192.168.100.9:19000',
      'exp://localhost:19000'
    ],
    methods: ['GET', 'POST']
  }
});

// CORS configuration for Express
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://192.168.100.9:8081',
    'http://10.0.2.2:8081',
    'exp://192.168.100.9:19000',
    'exp://localhost:19000'
  ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' })); // Increased for AR model uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined')); // More detailed logging
// Request timing middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  console.log(`🚀 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Response timing middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - req.startTime;
    console.log(`✅ ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    originalSend.call(this, data);
  };
  next();
});
// Static uploads
// Ensure uploads directory exists to prevent runtime crashes
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Webhook endpoint must come BEFORE json parser for raw body support inside its router
app.use('/api/ar/webhook', arWebhookKiri);

// TRIPO 3D AI routes
app.use('/api/ar/tripo', tripoRoutes);
app.use('/api/ar/tripo', arWebhookTripo);

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/kiri", kiriRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/likes", likesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
// Product Routes - Choose one:
// Option 1: Local file storage (current)
// app.use("/api/seller/products", productRoutes);  // For seller product management
// app.use("/api/products", productRoutes); // For buyer product management 

// Option 2: Supabase + Cloudinary Storage (recommended for production)
app.use("/api/seller/products", productRoutesSupabase);  // For seller product management with Supabase + Cloudinary
app.use("/api/products", productRoutesSupabase); // For buyer product management with Supabase + Cloudinary 

// Test database schema
app.get('/test-schema', async (req, res) => {
  try {
    console.log('🧪 Testing database schema...');
    const { supabase } = require('./db/supabase');
    
    // Test if products table has required columns
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, images, color_options, specifications, dimensions, weight, material, warranty, bulb_type, number_of_bulbs, voltage, led_type, lumens, is_dimmable, brand, model, installation_type, room_type, status')
      .limit(1);
    
    if (error) {
      console.error('❌ Schema test failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Database schema test failed',
        error: error.message,
        hint: 'You may need to run the schema migration: server/update-products-schema.sql'
      });
    }
    
    console.log('✅ Database schema test successful');
    res.json({
      success: true,
      message: 'Database schema is correct',
      columns: data.length > 0 ? Object.keys(data[0]) : 'No products found to test columns'
    });
  } catch (error) {
    console.error('❌ Schema test error:', error);
    res.status(500).json({
      success: false,
      message: 'Schema test failed',
      error: error.message
    });
  }
});

// Health check with database status
app.get('/health', async (req, res) => {
  try {
    // Try to connect to database
    await connectSupabase();
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'degraded', 
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// (Removed dev-only drop endpoint)

// Supabase connection with better error handling
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing Supabase connection...');
    await connectSupabase();
    console.log('✅ Supabase Connected Successfully');
    console.log('🎉 CONNECTED KA NA BOY! 🎉');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.log('⚠️  Server will continue running, but database operations may fail');
    console.log('💡 Tip: Check your internet connection and Supabase project status');
  }
}

// Cloudinary connection test
async function initializeCloudinary() {
  try {
    console.log('☁️  Initializing Cloudinary connection...');
    const { cloudinary } = require('./services/cloudinaryStorage');
    
    // Test Cloudinary connection
    const result = await cloudinary.api.ping();
    console.log('🎉 CONNECTED KA NA DIN SA CLOUD BOY! 🎉');
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    console.log('⚠️  Server will continue running, but image uploads may fail');
    console.log('💡 Tip: Check your Cloudinary credentials in .env file');
  }
}

// Initialize connections
initializeDatabase();
initializeCloudinary();

// KIRI connectivity check (optional, logs friendly message)
const { pingKiri } = require('./services/kiriClient');
(async () => {
  try {
    const ok = await pingKiri();
    if (ok) {
      console.log('🎉 CONNECTED KA NA DIN SA AR BOY! 🎉');
    }
  } catch (e) {
    console.log('⚠️  KIRI connectivity check failed:', e.message);
  }
})();

// Socket.IO logic
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  socket.on("sendMessage", async (data) => {
    const { buyerId, sellerId, message, sender } = data;
    const ts = Date.now();
    const newMessage = { buyerId, sellerId, message, sender, ts };
    try {
      const { supabase } = require('./db/supabase');
      const { error } = await supabase
        .from('messages')
        .insert([{
          buyer_id: buyerId,
          seller_id: sellerId,
          message: message,
          sender: sender,
          timestamp: ts
        }]);
      
      if (error) {
        console.error('Persist message failed', error.message);
      }
    } catch (e) {
      console.error('Persist message failed', e.message);
    }
    io.emit(`chat:${buyerId}:${sellerId}`, newMessage);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Handle port conflicts gracefully
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Server accessible at:`);
  console.log(`   - http://localhost:${PORT}`);
  console.log(`   - http://192.168.100.9:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.log('💡 Try running: taskkill /F /IM node.exe');
    console.log('💡 Or use a different port by setting PORT environment variable');
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

// Better diagnostics for crashes
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
