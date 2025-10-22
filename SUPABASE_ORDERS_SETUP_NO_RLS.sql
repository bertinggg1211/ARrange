-- =============================================
-- ORDER SYSTEM SETUP FOR SUPABASE (NO RLS)
-- Run this after creating the basic order tables
-- =============================================

-- =============================================
-- 1. PERFORMANCE INDEXES
-- =============================================

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Order items table indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Order status history indexes
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at);

-- =============================================
-- 2. AUTO-UPDATE TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for orders table
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 3. HELPER FUNCTIONS
-- =============================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_order_number TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
        
        -- Check if order number already exists
        IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_order_number) THEN
            RETURN new_order_number;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create status history entry
CREATE OR REPLACE FUNCTION create_order_status_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert status history entry
    INSERT INTO order_status_history (order_id, status, notes)
    VALUES (NEW.id, NEW.status, 'Status updated to ' || NEW.status);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create status history when order status changes
CREATE TRIGGER create_order_status_history_trigger
    AFTER INSERT OR UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_order_status_history();

-- =============================================
-- 4. ENHANCED STATUS VALIDATION
-- =============================================

-- Update the status check to include all statuses from color scheme
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'));

-- Update payment status check
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- =============================================
-- 5. VERIFICATION QUERIES
-- =============================================

-- Check if all indexes were created
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename IN ('orders', 'order_items', 'order_status_history')
    AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Check if functions were created
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN ('update_updated_at_column', 'generate_order_number', 'create_order_status_history')
ORDER BY routine_name;

-- Test order number generation
SELECT generate_order_number() as sample_order_number;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Order system setup complete (NO RLS)!';
    RAISE NOTICE '📋 Tables: orders, order_items, order_status_history';
    RAISE NOTICE '⚡ Indexes: Created for performance';
    RAISE NOTICE '🔄 Triggers: Auto-update and status history';
    RAISE NOTICE '🛠️ Functions: Order number generation ready';
    RAISE NOTICE '🎯 Status validation: All color scheme statuses supported';
    RAISE NOTICE '🔓 RLS: Disabled (as requested)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your order system is ready for testing!';
END $$;
