-- =============================================
-- REVIEWS & RATINGS SYSTEM
-- Complete database schema for product and shop ratings
-- =============================================

-- =============================================
-- PRODUCT REVIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    
    -- Rating and Review
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    review_title VARCHAR(255),
    
    -- Review Images (optional - buyers can upload photos of the product)
    images JSONB DEFAULT '[]',
    
    -- Helpful votes (other users can mark review as helpful)
    helpful_count INTEGER DEFAULT 0,
    
    -- Verification
    verified_purchase BOOLEAN DEFAULT true, -- Only buyers who purchased can review
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'reported', 'deleted')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(product_id, buyer_id, order_id) -- One review per product per order
);

-- =============================================
-- SHOP REVIEWS TABLE (Seller/Shop Ratings)
-- =============================================
CREATE TABLE IF NOT EXISTS shop_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    
    -- Ratings (Multiple criteria for shops)
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    shipping_speed_rating INTEGER CHECK (shipping_speed_rating >= 1 AND shipping_speed_rating <= 5),
    product_quality_rating INTEGER CHECK (product_quality_rating >= 1 AND product_quality_rating <= 5),
    
    -- Review
    comment TEXT,
    review_title VARCHAR(255),
    
    -- Helpful votes
    helpful_count INTEGER DEFAULT 0,
    
    -- Verification
    verified_purchase BOOLEAN DEFAULT true,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'reported', 'deleted')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(seller_id, buyer_id, order_id) -- One shop review per order
);

-- =============================================
-- REVIEW RESPONSES TABLE (Seller can respond to reviews)
-- =============================================
CREATE TABLE IF NOT EXISTS review_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships (can respond to either product or shop review)
    product_review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
    shop_review_id UUID REFERENCES shop_reviews(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Response
    response TEXT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (
        (product_review_id IS NOT NULL AND shop_review_id IS NULL) OR
        (product_review_id IS NULL AND shop_review_id IS NOT NULL)
    )
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Product Reviews Indexes
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_buyer_id ON product_reviews(buyer_id);
CREATE INDEX idx_product_reviews_seller_id ON product_reviews(seller_id);
CREATE INDEX idx_product_reviews_order_id ON product_reviews(order_id);
CREATE INDEX idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX idx_product_reviews_created_at ON product_reviews(created_at DESC);
CREATE INDEX idx_product_reviews_status ON product_reviews(status);

-- Shop Reviews Indexes
CREATE INDEX idx_shop_reviews_seller_id ON shop_reviews(seller_id);
CREATE INDEX idx_shop_reviews_buyer_id ON shop_reviews(buyer_id);
CREATE INDEX idx_shop_reviews_order_id ON shop_reviews(order_id);
CREATE INDEX idx_shop_reviews_overall_rating ON shop_reviews(overall_rating);
CREATE INDEX idx_shop_reviews_created_at ON shop_reviews(created_at DESC);
CREATE INDEX idx_shop_reviews_status ON shop_reviews(status);

-- Review Responses Indexes
CREATE INDEX idx_review_responses_product_review_id ON review_responses(product_review_id);
CREATE INDEX idx_review_responses_shop_review_id ON review_responses(shop_review_id);
CREATE INDEX idx_review_responses_seller_id ON review_responses(seller_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;

-- Product Reviews Policies
CREATE POLICY "Anyone can view active product reviews" 
    ON product_reviews FOR SELECT 
    USING (status = 'active');

CREATE POLICY "Buyers can create reviews for their purchases" 
    ON product_reviews FOR INSERT 
    WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update their own reviews" 
    ON product_reviews FOR UPDATE 
    USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can delete their own reviews" 
    ON product_reviews FOR DELETE 
    USING (auth.uid() = buyer_id);

-- Shop Reviews Policies
CREATE POLICY "Anyone can view active shop reviews" 
    ON shop_reviews FOR SELECT 
    USING (status = 'active');

CREATE POLICY "Buyers can create shop reviews for their purchases" 
    ON shop_reviews FOR INSERT 
    WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update their own shop reviews" 
    ON shop_reviews FOR UPDATE 
    USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can delete their own shop reviews" 
    ON shop_reviews FOR DELETE 
    USING (auth.uid() = buyer_id);

-- Review Responses Policies
CREATE POLICY "Anyone can view review responses" 
    ON review_responses FOR SELECT 
    USING (true);

CREATE POLICY "Sellers can create responses to reviews about their products/shop" 
    ON review_responses FOR INSERT 
    WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own responses" 
    ON review_responses FOR UPDATE 
    USING (auth.uid() = seller_id);

-- =============================================
-- FUNCTIONS FOR AVERAGE RATINGS
-- =============================================

-- Function to calculate product average rating
CREATE OR REPLACE FUNCTION get_product_average_rating(p_product_id UUID)
RETURNS TABLE (
    average_rating NUMERIC,
    total_reviews BIGINT,
    rating_distribution JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(rating)::numeric, 2) as average_rating,
        COUNT(*) as total_reviews,
        jsonb_build_object(
            '5', COUNT(*) FILTER (WHERE rating = 5),
            '4', COUNT(*) FILTER (WHERE rating = 4),
            '3', COUNT(*) FILTER (WHERE rating = 3),
            '2', COUNT(*) FILTER (WHERE rating = 2),
            '1', COUNT(*) FILTER (WHERE rating = 1)
        ) as rating_distribution
    FROM product_reviews
    WHERE product_id = p_product_id AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to calculate shop average rating
CREATE OR REPLACE FUNCTION get_shop_average_rating(p_seller_id UUID)
RETURNS TABLE (
    overall_rating NUMERIC,
    communication_rating NUMERIC,
    shipping_speed_rating NUMERIC,
    product_quality_rating NUMERIC,
    total_reviews BIGINT,
    rating_distribution JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(sr.overall_rating)::numeric, 2) as overall_rating,
        ROUND(AVG(sr.communication_rating)::numeric, 2) as communication_rating,
        ROUND(AVG(sr.shipping_speed_rating)::numeric, 2) as shipping_speed_rating,
        ROUND(AVG(sr.product_quality_rating)::numeric, 2) as product_quality_rating,
        COUNT(*) as total_reviews,
        jsonb_build_object(
            '5', COUNT(*) FILTER (WHERE sr.overall_rating = 5),
            '4', COUNT(*) FILTER (WHERE sr.overall_rating = 4),
            '3', COUNT(*) FILTER (WHERE sr.overall_rating = 3),
            '2', COUNT(*) FILTER (WHERE sr.overall_rating = 2),
            '1', COUNT(*) FILTER (WHERE sr.overall_rating = 1)
        ) as rating_distribution
    FROM shop_reviews sr
    WHERE sr.seller_id = p_seller_id AND sr.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Product Reviews trigger
CREATE OR REPLACE FUNCTION update_product_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_reviews_updated_at
    BEFORE UPDATE ON product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_reviews_updated_at();

-- Shop Reviews trigger
CREATE OR REPLACE FUNCTION update_shop_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shop_reviews_updated_at
    BEFORE UPDATE ON shop_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_shop_reviews_updated_at();

-- Review Responses trigger
CREATE OR REPLACE FUNCTION update_review_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_responses_updated_at
    BEFORE UPDATE ON review_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_review_responses_updated_at();

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE product_reviews IS 'Stores buyer reviews for individual products';
COMMENT ON TABLE shop_reviews IS 'Stores buyer reviews for seller shops';
COMMENT ON TABLE review_responses IS 'Stores seller responses to reviews';

COMMENT ON COLUMN product_reviews.verified_purchase IS 'True if buyer actually purchased this product';
COMMENT ON COLUMN product_reviews.helpful_count IS 'Number of users who found this review helpful';
COMMENT ON COLUMN shop_reviews.overall_rating IS 'Overall shop rating (1-5 stars)';
COMMENT ON COLUMN shop_reviews.communication_rating IS 'Seller communication rating (1-5 stars)';
COMMENT ON COLUMN shop_reviews.shipping_speed_rating IS 'Shipping speed rating (1-5 stars)';
COMMENT ON COLUMN shop_reviews.product_quality_rating IS 'Product quality rating (1-5 stars)';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('product_reviews', 'shop_reviews', 'review_responses');

-- Verify columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'product_reviews'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'shop_reviews'
ORDER BY ordinal_position;
