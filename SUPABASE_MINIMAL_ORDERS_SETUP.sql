-- =============================================
-- MINIMAL ORDER SYSTEM SETUP (NO TRIGGERS)
-- Use this if the trigger setup fails
-- =============================================

-- =============================================
-- 1. ESSENTIAL PERFORMANCE INDEXES
-- =============================================

-- Orders table indexes (most important)
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Order items table indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- =============================================
-- 2. ORDER NUMBER GENERATOR (SIMPLE VERSION)
-- =============================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT 
LANGUAGE plpgsql
AS $function$
DECLARE
    new_order_number TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
        
        IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_order_number) THEN
            RETURN new_order_number;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$function$;

-- =============================================
-- 3. ENHANCED STATUS VALIDATION
-- =============================================

-- Update status constraints to match your color scheme
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- =============================================
-- 4. TEST THE SETUP
-- =============================================

-- Test order number generation
SELECT generate_order_number() as sample_order_number;

-- Check indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('orders', 'order_items') 
    AND schemaname = 'public'
ORDER BY tablename, indexname;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Minimal order system setup complete!';
    RAISE NOTICE '⚡ Performance indexes: Created';
    RAISE NOTICE '🛠️ Order number generator: Ready';
    RAISE NOTICE '🎯 Status validation: Updated';
    RAISE NOTICE '📝 Note: Auto-update triggers skipped due to connection issues';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your order system is ready to use!';
    RAISE NOTICE '💡 Tip: You can manually update updated_at in your backend code';
END $$;
