const { supabase } = require('../db/supabase');
const path = require('path');

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

exports.createProduct = async (req, res) => {
  try {
    console.log('🚀 Starting product creation...');
    console.log('📡 Request received at:', new Date().toISOString());
    console.log('📡 Request method:', req.method);
    console.log('📡 Request URL:', req.url);
    console.log('📡 Request headers:', req.headers);
    
    const sellerId = req.user?.id;
    if (!sellerId) {
      console.error('❌ No seller ID found in request');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    console.log('✅ Seller ID:', sellerId);

    const body = req.body || {};
    console.log('📝 Request body keys:', Object.keys(body));
    console.log('📸 Files received:', req.files?.length || 0);
    console.log('🎯 AR Data received:', {
      hasAR: body.hasAR,
      arScanData: body.arScanData ? 'Present' : 'Missing',
      arScanDataType: typeof body.arScanData
    });
    
    console.log('🎯 Full request body keys:', Object.keys(body));
    console.log('🎯 AR fields in body:', {
      hasAR: body.hasAR,
      arScanData: body.arScanData,
      hasARType: typeof body.hasAR,
      arScanDataType: typeof body.arScanData
    });

    // Normalize arrays coming from multipart
    const colorOptions = [];
    const specs = [];
    Object.keys(body).forEach((key) => {
      if (key === 'colorOptions[]') {
        const val = body[key];
        if (Array.isArray(val)) val.forEach((v) => colorOptions.push(String(v)));
        else colorOptions.push(String(val));
      }
      const m = key.match(/^specifications\[(\d+)\]\[(name|value)\]$/);
      if (m) {
        const idx = Number(m[1]);
        const field = m[2];
        specs[idx] = specs[idx] || { name: '', value: '' };
        specs[idx][field] = String(body[key]);
      }
    });

    // Parse AR scan data if provided
    let arScanData = null;
    if (body.arScanData) {
      try {
        arScanData = typeof body.arScanData === 'string' ? JSON.parse(body.arScanData) : body.arScanData;
        console.log('✅ AR scan data parsed successfully:', {
          hasGlbUrl: !!arScanData?.glbUrl,
          hasCloudinaryUrl: !!arScanData?.cloudinaryUrl,
          hasModelUrl: !!arScanData?.modelUrl
        });
      } catch (e) {
        console.error('❌ Error parsing arScanData:', e);
        arScanData = null;
      }
    }

    const product = {
      id: `product::${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      sellerId,
      sellerEmail: req.user?.email || '',
      name: body.name,
      price: toNumber(body.price),
      description: body.description || '',
      category: body.category || '',
      stock: toNumber(body.stock, 0),
      status: body.status || 'active',
      dimensions: body.dimensions || '',
      height: toNumber(body.height, null),
      width: toNumber(body.width, null),
      weight: body.weight || '',
      material: body.material || '',
      warranty: body.warranty || '',
      bulbType: body.bulbType || '',
      numberOfBulbs: body.numberOfBulbs || '',
      voltage: body.voltage || '',
      ledType: body.ledType || '',
      lumens: body.lumens || '',
      isDimmable: String(body.isDimmable) === 'true',
      brand: body.brand || '',
      model: body.model || '',
      colorOptions,
      installationType: body.installationType || '',
      roomType: body.roomType || '',
      specifications: specs.filter(Boolean),
      images: [],
      hasAR: String(body.hasAR) === 'true',
      arScanData: arScanData,
      arModelUrl: arScanData?.glbUrl || arScanData?.cloudinaryUrl || arScanData?.modelUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Attach images saved by multer
    if (req.files && Array.isArray(req.files)) {
      product.images = req.files.map((f) => {
        const rel = path.join('/uploads', 'products', path.basename(f.path));
        return rel.replace(/\\/g, '/');
      });
    }

    // Test database connection first
    console.log('🔄 Connecting to Supabase...');
    console.log('✅ Supabase connected successfully');
    
    console.log('🔍 Creating product with data:', JSON.stringify(product, null, 2));
    
    // Convert field names to match Supabase schema
    const productData = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      subcategory: product.subcategory,
      images: product.images || [],
      has_ar: product.hasAR || false,
      ar_scan_data: product.arScanData || null,
      ar_model_url: product.arModelUrl || arScanData?.glbUrl || arScanData?.cloudinaryUrl || arScanData?.modelUrl || null,
      stock_quantity: product.stock || 0,
      dimensions: product.dimensions, // Keep for backward compatibility
      height_cm: product.height,
      width_cm: product.width,
      is_active: product.status === 'active',
      seller_id: product.sellerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('🎯 AR Data being saved to database:', {
      has_ar: productData.has_ar,
      ar_scan_data: productData.ar_scan_data ? 'Present' : 'Missing',
      ar_model_url: productData.ar_model_url,
      original_arScanData: product.arScanData,
      original_hasAR: product.hasAR
    });
    
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Database insert error:', error);
      throw error;
    }
    
    console.log('✅ Product created successfully in database');
    console.log('🎯 Created product AR data:', {
      has_ar: data?.has_ar,
      ar_scan_data: data?.ar_scan_data ? 'Present' : 'Missing',
      ar_model_url: data?.ar_model_url
    });

    return res.status(201).json({ success: true, product });
  } catch (e) {
    console.error('❌ createProduct error:', e);
    console.error('❌ Error stack:', e.stack);
    
    // Provide specific error messages
    if (e.message.includes('Couchbase env vars missing')) {
      return res.status(500).json({ 
        message: 'Database configuration error. Please check server setup.',
        error: 'DB_CONFIG_ERROR'
      });
    }
    
    if (e.message.includes('connect')) {
      return res.status(500).json({ 
        message: 'Database connection failed. Please try again.',
        error: 'DB_CONNECTION_ERROR'
      });
    }
    
    return res.status(500).json({ 
      message: 'Server error during product creation',
      error: e.message 
    });
  }
};


