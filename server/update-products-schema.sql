-- Update products table to include all required columns
-- Run this in your Supabase SQL Editor

-- Add missing columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS dimensions VARCHAR(100),
ADD COLUMN IF NOT EXISTS weight VARCHAR(50),
ADD COLUMN IF NOT EXISTS material VARCHAR(100),
ADD COLUMN IF NOT EXISTS warranty VARCHAR(100),
ADD COLUMN IF NOT EXISTS bulb_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS number_of_bulbs INTEGER,
ADD COLUMN IF NOT EXISTS voltage VARCHAR(20),
ADD COLUMN IF NOT EXISTS led_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS lumens VARCHAR(20),
ADD COLUMN IF NOT EXISTS is_dimmable BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
ADD COLUMN IF NOT EXISTS model VARCHAR(100),
ADD COLUMN IF NOT EXISTS color_options TEXT[],
ADD COLUMN IF NOT EXISTS installation_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS room_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft'));

-- Update existing columns if needed
ALTER TABLE products 
ALTER COLUMN stock_quantity DROP NOT NULL,
ALTER COLUMN stock_quantity SET DEFAULT 0;

-- Add stock column as alias (if needed)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_installation_type ON products(installation_type);
CREATE INDEX IF NOT EXISTS idx_products_room_type ON products(room_type);
