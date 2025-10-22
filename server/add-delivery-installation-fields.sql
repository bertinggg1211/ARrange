-- Add delivery charge and installation cost fields to products table
-- Run this in your Supabase SQL editor

ALTER TABLE products 
ADD COLUMN delivery_charge DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN installation_cost DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN free_delivery_threshold DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN installation_included BOOLEAN DEFAULT false;

-- Add comments for clarity
COMMENT ON COLUMN products.delivery_charge IS 'Delivery charge in PHP';
COMMENT ON COLUMN products.installation_cost IS 'Installation cost in PHP';
COMMENT ON COLUMN products.free_delivery_threshold IS 'Minimum order amount for free delivery';
COMMENT ON COLUMN products.installation_included IS 'Whether installation is included in price';
