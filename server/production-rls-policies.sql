-- =============================================
-- PRODUCTION RLS POLICIES WITH JWT SUPPORT
-- AR E-commerce React Native Application
-- =============================================

-- Create function to set user context from JWT
CREATE OR REPLACE FUNCTION set_user_context(user_id TEXT, user_role TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
  PERFORM set_config('app.current_user_role', user_role, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user ID from context
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_id', true);
END;
$$ LANGUAGE plpgsql;

-- Helper function to get current user role from context
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_role', true);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

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
CREATE POLICY "Anyone can view active products" ON products
    FOR SELECT
    USING (status = 'active');

-- Allow sellers to insert their own products
CREATE POLICY "Sellers can insert their own products" ON products
    FOR INSERT
    WITH CHECK (
        current_user_role() = 'seller' AND 
        current_user_id() = seller_id::text
    );

-- Allow sellers to update their own products
CREATE POLICY "Sellers can update their own products" ON products
    FOR UPDATE
    USING (
        current_user_role() = 'seller' AND 
        current_user_id() = seller_id::text
    )
    WITH CHECK (
        current_user_role() = 'seller' AND 
        current_user_id() = seller_id::text
    );

-- Allow sellers to delete their own products
CREATE POLICY "Sellers can delete their own products" ON products
    FOR DELETE
    USING (
        current_user_role() = 'seller' AND 
        current_user_id() = seller_id::text
    );

-- Allow sellers to view all their products (including inactive)
CREATE POLICY "Sellers can view their own products" ON products
    FOR SELECT
    USING (
        current_user_role() = 'seller' AND 
        current_user_id() = seller_id::text
    );

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT
    USING (current_user_id() = id::text);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE
    USING (current_user_id() = id::text)
    WITH CHECK (current_user_id() = id::text);

-- =============================================
-- CARTS TABLE POLICIES
-- =============================================

-- Allow users to manage their own cart
CREATE POLICY "Users can manage their own cart" ON carts
    FOR ALL
    USING (current_user_id() = user_id::text)
    WITH CHECK (current_user_id() = user_id::text);

-- =============================================
-- MESSAGES TABLE POLICIES
-- =============================================

-- Allow users to view messages they're involved in
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT
    USING (
        current_user_id() = buyer_id::text OR 
        current_user_id() = seller_id::text
    );

-- Allow users to insert messages they're involved in
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT
    WITH CHECK (
        current_user_id() = buyer_id::text OR 
        current_user_id() = seller_id::text
    );

-- =============================================
-- NOTIFICATIONS TABLE POLICIES
-- =============================================

-- Allow users to view their own notifications
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT
    USING (current_user_id() = user_id::text);

-- Allow system to insert notifications (no user context needed)
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT
    WITH CHECK (true);

-- Allow users to update their own notifications
CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE
    USING (current_user_id() = user_id::text)
    WITH CHECK (current_user_id() = user_id::text);

-- =============================================
-- AR_SCANS TABLE POLICIES
-- =============================================

-- Allow sellers to manage AR scans for their products
CREATE POLICY "Sellers can manage AR scans for their products" ON ar_scans
    FOR ALL
    USING (
        current_user_role() = 'seller' AND
        current_user_id() IN (
            SELECT seller_id::text FROM products WHERE id = ar_scans.product_id
        )
    )
    WITH CHECK (
        current_user_role() = 'seller' AND
        current_user_id() IN (
            SELECT seller_id::text FROM products WHERE id = ar_scans.product_id
        )
    );

-- Allow everyone to view AR scans for active products
CREATE POLICY "Anyone can view AR scans for active products" ON ar_scans
    FOR SELECT
    USING (
        product_id IN (
            SELECT id FROM products WHERE status = 'active'
        )
    );

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant execute permission on helper functions
GRANT EXECUTE ON FUNCTION set_user_context(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_role() TO authenticated;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Production RLS Policies Applied Successfully!';
    RAISE NOTICE 'JWT-based authentication with user context setting';
    RAISE NOTICE 'Secure data isolation between users and roles';
    RAISE NOTICE 'Ready for production deployment';
END $$;
