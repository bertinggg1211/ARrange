-- =============================================
-- COMPLETE SUPABASE DATABASE SCHEMA
-- AR E-commerce React Native Application
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- DROP EXISTING TABLES (if they exist)
-- =============================================
DROP TABLE IF EXISTS ar_scans CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
    phone VARCHAR(50),
    address TEXT,
    shop_name VARCHAR(255), -- For sellers
    seller_profile JSONB DEFAULT '{}', -- Seller-specific data
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PRODUCTS TABLE
-- =============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    images JSONB DEFAULT '[]', -- Array of image URLs
    color_options JSONB DEFAULT '[]', -- Array of color options
    specifications JSONB DEFAULT '[]', -- Array of specifications
    
    -- Product dimensions and details
    dimensions VARCHAR(100), -- e.g., "20x15x10 cm"
    height_cm DECIMAL(8,2), -- Height in centimeters
    width_cm DECIMAL(8,2), -- Width in centimeters
    weight VARCHAR(50), -- e.g., "2.5 kg"
    material VARCHAR(100), -- e.g., "Metal, Glass"
    warranty VARCHAR(100), -- e.g., "2 years"
    brand VARCHAR(100),
    model VARCHAR(100),
    
    -- Lighting-specific fields
    bulb_type VARCHAR(50), -- e.g., "LED", "Halogen"
    number_of_bulbs INTEGER,
    voltage VARCHAR(20), -- e.g., "220V"
    led_type VARCHAR(50), -- e.g., "Warm White", "Cool White"
    lumens INTEGER, -- Light output
    is_dimmable BOOLEAN DEFAULT false,
    installation_type VARCHAR(50), -- e.g., "Ceiling Mount", "Wall Mount"
    room_type VARCHAR(50), -- e.g., "Living Room", "Bedroom"
    
    -- Inventory and status
    stock_quantity INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft', 'sold')),
    is_featured BOOLEAN DEFAULT false,
    
    -- AR/3D Model data
    has_ar BOOLEAN DEFAULT false,
    ar_scan_data JSONB DEFAULT '{}', -- AR scanning metadata
    ar_model_url TEXT, -- URL to 3D model file (GLB/GLTF)
    ar_thumbnail_url TEXT, -- Thumbnail for AR model
    
    -- SEO and metadata
    tags JSONB DEFAULT '[]', -- Array of tags
    meta_title VARCHAR(255),
    meta_description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CARTS TABLE
-- =============================================
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    items JSONB DEFAULT '[]', -- Array of cart items
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CART ITEMS TABLE (Alternative normalized approach)
-- =============================================
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL, -- Price at time of adding to cart
    selected_color VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cart_id, product_id, selected_color)
);

-- =============================================
-- MESSAGES TABLE (Chat functionality)
-- =============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'ar_complete')),
    data JSONB DEFAULT '{}', -- Additional notification data
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- AR SCANS TABLE (3D Model scanning data)
-- =============================================
CREATE TABLE ar_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scan_id VARCHAR(255), -- External scan service ID (KIRI Engine)
    status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
    
    -- Scan metadata
    scan_type VARCHAR(50) DEFAULT 'photo_scan', -- 'photo_scan', 'lidar_scan', etc.
    images JSONB DEFAULT '[]', -- Array of captured images
    image_count INTEGER DEFAULT 0,
    
    -- 3D Model data
    model_url TEXT, -- URL to GLB/GLTF file
    thumbnail_url TEXT, -- Preview thumbnail
    file_size BIGINT, -- File size in bytes
    quality_score DECIMAL(3,2), -- Quality score (0.00-1.00)
    
    -- Processing details
    processing_time INTEGER, -- Processing time in seconds
    vertices_count INTEGER, -- Number of vertices in 3D model
    faces_count INTEGER, -- Number of faces in 3D model
    
    -- External service data
    external_scan_id VARCHAR(255), -- KIRI Engine scan ID
    external_data JSONB DEFAULT '{}', -- Additional external service data
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Products table indexes
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_subcategory ON products(subcategory);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_has_ar ON products(has_ar);

-- Composite indexes for common queries
CREATE INDEX idx_products_status_seller ON products(status, seller_id);
CREATE INDEX idx_products_status_category ON products(status, category);
CREATE INDEX idx_products_status_price ON products(status, price);
CREATE INDEX idx_products_category_price ON products(category, price);

-- Full-text search indexes
CREATE INDEX idx_products_search_name ON products USING gin(to_tsvector('english', name));
CREATE INDEX idx_products_search_description ON products USING gin(to_tsvector('english', description));

-- Carts table indexes
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- Messages table indexes
CREATE INDEX idx_messages_buyer_seller ON messages(buyer_id, seller_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Notifications table indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- AR scans table indexes
CREATE INDEX idx_ar_scans_product_id ON ar_scans(product_id);
CREATE INDEX idx_ar_scans_seller_id ON ar_scans(seller_id);
CREATE INDEX idx_ar_scans_status ON ar_scans(status);
CREATE INDEX idx_ar_scans_created_at ON ar_scans(created_at DESC);

-- =============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ar_scans_updated_at BEFORE UPDATE ON ar_scans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_scans ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Products policies
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (status = 'active');
CREATE POLICY "Sellers can manage their own products" ON products FOR ALL USING (auth.uid() = seller_id);

-- Carts policies
CREATE POLICY "Users can manage their own cart" ON carts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own cart items" ON cart_items FOR ALL USING (
    EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())
);

-- Messages policies
CREATE POLICY "Users can view their own messages" ON messages FOR SELECT USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND (auth.uid() = buyer_id OR auth.uid() = seller_id)
);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- AR scans policies
CREATE POLICY "Sellers can manage their own AR scans" ON ar_scans FOR ALL USING (auth.uid() = seller_id);
CREATE POLICY "Anyone can view completed AR scans" ON ar_scans FOR SELECT USING (status = 'completed');

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- Insert sample seller
INSERT INTO users (email, password_hash, full_name, role, shop_name, seller_profile) VALUES 
(
    'seller@example.com', 
    '$2a$10$example.hash.here', 
    'Sample Seller', 
    'seller', 
    'Sample Lighting Store',
    '{"businessDescription": "Premium lighting solutions", "businessAddress": "123 Main St", "businessPhone": "+1234567890"}'
);

-- Insert sample buyer
INSERT INTO users (email, password_hash, full_name, role) VALUES 
(
    'buyer@example.com', 
    '$2a$10$example.hash.here', 
    'Sample Buyer', 
    'buyer'
);

-- =============================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- =============================================

-- Function to get seller statistics
CREATE OR REPLACE FUNCTION get_seller_stats(seller_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'products', COUNT(*),
        'active_products', COUNT(*) FILTER (WHERE status = 'active'),
        'total_ar_scans', COUNT(*) FILTER (WHERE has_ar = true),
        'avg_price', ROUND(AVG(price), 2)
    ) INTO result
    FROM products 
    WHERE seller_id = seller_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to search products
CREATE OR REPLACE FUNCTION search_products(
    search_query TEXT DEFAULT NULL,
    category_filter TEXT DEFAULT NULL,
    min_price DECIMAL DEFAULT NULL,
    max_price DECIMAL DEFAULT NULL,
    has_ar_filter BOOLEAN DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    price DECIMAL,
    category VARCHAR,
    images JSONB,
    has_ar BOOLEAN,
    seller_name VARCHAR,
    shop_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.category,
        p.images,
        p.has_ar,
        u.full_name as seller_name,
        u.shop_name
    FROM products p
    JOIN users u ON p.seller_id = u.id
    WHERE p.status = 'active'
        AND (search_query IS NULL OR 
             to_tsvector('english', p.name || ' ' || COALESCE(p.description, '')) @@ plainto_tsquery('english', search_query))
        AND (category_filter IS NULL OR p.category = category_filter)
        AND (min_price IS NULL OR p.price >= min_price)
        AND (max_price IS NULL OR p.price <= max_price)
        AND (has_ar_filter IS NULL OR p.has_ar = has_ar_filter)
    ORDER BY p.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for products with seller information
CREATE OR REPLACE VIEW products_with_sellers AS
SELECT 
    p.*,
    u.full_name as seller_name,
    u.shop_name,
    u.seller_profile
FROM products p
JOIN users u ON p.seller_id = u.id
WHERE p.status = 'active';

-- View for cart items with product details
CREATE OR REPLACE VIEW cart_items_detailed AS
SELECT 
    ci.*,
    p.name as product_name,
    p.price as current_price,
    p.images as product_images,
    p.category,
    u.shop_name as seller_shop
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
JOIN users u ON p.seller_id = u.id;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

-- Add a completion log
DO $$
BEGIN
    RAISE NOTICE 'AR E-commerce Database Schema Created Successfully!';
    RAISE NOTICE 'Tables created: users, products, carts, cart_items, messages, notifications, ar_scans';
    RAISE NOTICE 'Indexes, triggers, and RLS policies applied';
    RAISE NOTICE 'Ready for React Native AR E-commerce Application';
END $$;
