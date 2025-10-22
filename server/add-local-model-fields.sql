-- Add local model support fields to products table
-- This script safely adds only the missing columns

-- Add ar_model_source column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'ar_model_source'
    ) THEN
        ALTER TABLE products ADD COLUMN ar_model_source VARCHAR(20) DEFAULT 'kiri';
    END IF;
END $$;

-- Add ar_model_type column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'ar_model_type'
    ) THEN
        ALTER TABLE products ADD COLUMN ar_model_type VARCHAR(50) DEFAULT NULL;
    END IF;
END $$;

-- Add comment to explain the new columns
COMMENT ON COLUMN products.ar_model_source IS 'Source of AR model: kiri (KIRI Engine) or local (pre-made model)';
COMMENT ON COLUMN products.ar_model_type IS 'Type of local model: TEST1, TEST2, TEST3, etc.';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_ar_model_source ON products(ar_model_source);
CREATE INDEX IF NOT EXISTS idx_products_ar_model_type ON products(ar_model_type);

-- Update existing products to have default values
UPDATE products 
SET ar_model_source = 'kiri' 
WHERE ar_model_source IS NULL;

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name LIKE 'ar_%'
ORDER BY column_name;
