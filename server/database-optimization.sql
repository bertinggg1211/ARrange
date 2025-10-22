-- Database Performance Optimization Script for Supabase
-- Run this in your Supabase SQL Editor to improve query performance

-- 0. Ensure required columns exist (run these first if needed)
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_profile JSONB DEFAULT '{}';
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_profile JSONB DEFAULT '{}';

-- 1. Add indexes for frequently queried fields in products table
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- 2. Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_products_status_seller ON products(status, seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status_category ON products(status, category);
CREATE INDEX IF NOT EXISTS idx_products_status_price ON products(status, price);

-- 3. Add indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- 4. Add indexes for AR scans table
CREATE INDEX IF NOT EXISTS idx_ar_scans_product_id ON ar_scans(product_id);
CREATE INDEX IF NOT EXISTS idx_ar_scans_seller_id ON ar_scans(seller_id);
CREATE INDEX IF NOT EXISTS idx_ar_scans_status ON ar_scans(status);

-- 5. Add indexes for carts table
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);

-- 6. Add indexes for messages table (for chat functionality)
CREATE INDEX IF NOT EXISTS idx_messages_buyer_seller ON messages(buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);

-- 7. Add full-text search indexes for product search
CREATE INDEX IF NOT EXISTS idx_products_search_name ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_search_description ON products USING gin(to_tsvector('english', description));

-- 8. Analyze tables to update statistics for query planner
ANALYZE products;
ANALYZE users;
ANALYZE ar_scans;
ANALYZE carts;
ANALYZE messages;

-- Performance monitoring queries (run these to check performance)
-- Check index usage:
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes ORDER BY idx_tup_read DESC;

-- Check slow queries:
-- SELECT query, mean_time, calls FROM pg_stat_statements 
-- WHERE mean_time > 100 ORDER BY mean_time DESC LIMIT 10;
