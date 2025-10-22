-- =============================================
-- DISABLE ROW LEVEL SECURITY FOR DEVELOPMENT
-- AR E-commerce React Native Application
-- =============================================

-- Disable RLS on all tables for development
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE carts DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE ar_scans DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view all active products" ON products;
DROP POLICY IF EXISTS "Sellers can insert their own products" ON products;
DROP POLICY IF EXISTS "Sellers can update their own products" ON products;
DROP POLICY IF EXISTS "Sellers can delete their own products" ON products;
DROP POLICY IF EXISTS "Sellers can view their own products" ON products;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can manage their own cart" ON carts;
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
DROP POLICY IF EXISTS "Sellers can manage AR scans for their products" ON ar_scans;
DROP POLICY IF EXISTS "Users can view AR scans for active products" ON ar_scans;

-- Completion message
DO $$
BEGIN
    RAISE NOTICE 'Row Level Security DISABLED for all tables';
    RAISE NOTICE 'All RLS policies removed';
    RAISE NOTICE 'Tables are now accessible with JWT authentication only';
    RAISE NOTICE 'Ready for development and testing';
END $$;
