-- =============================================
-- QUICK FIX: DISABLE RLS FOR ORDERS
-- This allows server-side operations to work
-- =============================================

-- Disable RLS on orders table temporarily
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history DISABLE ROW LEVEL SECURITY;

-- Alternative: Create a more permissive policy
-- DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
-- CREATE POLICY "Allow all inserts" ON orders FOR INSERT WITH CHECK (true);
