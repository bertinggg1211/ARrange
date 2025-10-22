-- =============================================
-- FIX ROW LEVEL SECURITY POLICIES
-- AR E-commerce React Native Application
-- =============================================

-- Disable RLS temporarily to allow setup
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE carts DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE ar_scans DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all active products" ON products;
DROP POLICY IF EXISTS "Sellers can insert their own products" ON products;
DROP POLICY IF EXISTS "Sellers can update their own products" ON products;
DROP POLICY IF EXISTS "Sellers can delete their own products" ON products;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Re-enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_scans ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PRODUCTS TABLE POLICIES
-- =============================================

-- Allow everyone to view active products (for buyers)
CREATE POLICY "Users can view all active products" ON products
    FOR SELECT
    USING (status = 'active');

-- Allow sellers to insert their own products
CREATE POLICY "Sellers can insert their own products" ON products
    FOR INSERT
    WITH CHECK (
        auth.uid()::text = seller_id::text
    );

-- Allow sellers to update their own products
CREATE POLICY "Sellers can update their own products" ON products
    FOR UPDATE
    USING (auth.uid()::text = seller_id::text)
    WITH CHECK (auth.uid()::text = seller_id::text);

-- Allow sellers to delete their own products
CREATE POLICY "Sellers can delete their own products" ON products
    FOR DELETE
    USING (auth.uid()::text = seller_id::text);

-- Allow sellers to view all their products (including inactive)
CREATE POLICY "Sellers can view their own products" ON products
    FOR SELECT
    USING (auth.uid()::text = seller_id::text);

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT
    USING (auth.uid()::text = id::text);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- =============================================
-- CARTS TABLE POLICIES
-- =============================================

-- Allow users to manage their own cart
CREATE POLICY "Users can manage their own cart" ON carts
    FOR ALL
    USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);

-- =============================================
-- MESSAGES TABLE POLICIES
-- =============================================

-- Allow users to view messages they're involved in
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT
    USING (
        auth.uid()::text = buyer_id::text OR 
        auth.uid()::text = seller_id::text
    );

-- Allow users to insert messages they're involved in
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT
    WITH CHECK (
        auth.uid()::text = buyer_id::text OR 
        auth.uid()::text = seller_id::text
    );

-- =============================================
-- NOTIFICATIONS TABLE POLICIES
-- =============================================

-- Allow users to view their own notifications
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- Allow system to insert notifications for users
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT
    WITH CHECK (true);

-- Allow users to update their own notifications (mark as read)
CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE
    USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);

-- =============================================
-- AR_SCANS TABLE POLICIES
-- =============================================

-- Allow sellers to manage AR scans for their products
CREATE POLICY "Sellers can manage AR scans for their products" ON ar_scans
    FOR ALL
    USING (
        auth.uid()::text IN (
            SELECT seller_id::text FROM products WHERE id = ar_scans.product_id
        )
    )
    WITH CHECK (
        auth.uid()::text IN (
            SELECT seller_id::text FROM products WHERE id = ar_scans.product_id
        )
    );

-- Allow everyone to view AR scans for active products
CREATE POLICY "Users can view AR scans for active products" ON ar_scans
    FOR SELECT
    USING (
        product_id IN (
            SELECT id FROM products WHERE status = 'active'
        )
    );

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Row Level Security Policies Applied Successfully!';
    RAISE NOTICE 'Products: Sellers can manage their own products, everyone can view active products';
    RAISE NOTICE 'Users: Users can manage their own profiles';
    RAISE NOTICE 'Carts: Users can manage their own carts';
    RAISE NOTICE 'Messages: Users can view and send messages they are involved in';
    RAISE NOTICE 'Notifications: Users can view their own notifications';
    RAISE NOTICE 'AR Scans: Sellers can manage scans for their products';
END $$;
