# Rating System - Quick Start Guide

## 🎯 What We're Building

A **dual rating system** where buyers can rate:
1. **Products** (⭐ 1-5 stars + comment + photos)
2. **Shops** (⭐ 1-5 stars in 4 categories + comment)

**When?** Only after seller marks order as "Delivered"

---

## 📋 Step-by-Step Setup

### ✅ STEP 1: Create Database Tables (5 minutes)

**What to do:**
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the entire file: `server/sql/create_reviews_tables.sql`
4. Click **Run**

**What this creates:**
- ✅ `product_reviews` table - Product ratings
- ✅ `shop_reviews` table - Shop/seller ratings  
- ✅ `review_responses` table - Seller responses
- ✅ Indexes for fast queries
- ✅ Security policies (RLS)
- ✅ Helper functions for averages

**Verify it worked:**
```sql
-- Run this to check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('product_reviews', 'shop_reviews', 'review_responses');

-- Should return 3 rows ✅
```

---

### ⏳ STEP 2: Backend API (Next - I'll create this)

Create these API endpoints:
- `POST /api/reviews/product` - Submit product review
- `POST /api/reviews/shop` - Submit shop review
- `GET /api/seller/reviews` - Seller views their reviews
- `GET /api/reviews/stats/product/:id` - Get product rating stats
- `GET /api/reviews/stats/shop/:id` - Get shop rating stats

---

### ⏳ STEP 3: Update Order Delivery Flow

When seller marks order as "Delivered", send **2 notification messages**:

**Message 1: Review Product**
```
⭐ How was your experience with [Product Name]? 

Please rate this product! Your feedback helps 
other buyers. Thank you! 💙

[Product Image]
Product Name
₱25,999

[Tap to Rate Product]
```

**Message 2: Review Shop**
```
⭐ How was your experience with [Shop Name]?

Please rate our shop! Your feedback on 
communication, shipping, and quality helps 
us serve you better. Thank you! 💙

[Shop Logo]
Shop Name

[Tap to Rate Shop]
```

---

### ⏳ STEP 4: Create Rating UI

Rating modals for buyers to submit reviews.

---

## 🎨 How It Works

### Complete Flow Diagram

```
┌─────────────────────────────────────────┐
│ 1. SELLER MARKS ORDER AS DELIVERED      │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 2. SYSTEM SENDS 3 NOTIFICATIONS         │
│    • "🎉 Order delivered!"              │
│    • "⭐ Rate the product"              │
│    • "⭐ Rate the shop"                 │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 3. BUYER OPENS CHAT                     │
│    Sees 2 new rating requests           │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 4. BUYER TAPS "RATE PRODUCT"            │
│    Opens rating modal                   │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 5. BUYER RATES PRODUCT                  │
│    • Selects 1-5 stars                  │
│    • Writes comment (optional)          │
│    • Uploads photos (optional)          │
│    • Submits                            │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 6. SAVED TO product_reviews TABLE       │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 7. BUYER TAPS "RATE SHOP"               │
│    Opens shop rating modal              │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 8. BUYER RATES SHOP                     │
│    • Overall: ⭐⭐⭐⭐⭐              │
│    • Communication: ⭐⭐⭐⭐⭐       │
│    • Shipping: ⭐⭐⭐⭐⭐           │
│    • Quality: ⭐⭐⭐⭐⭐            │
│    • Writes comment (optional)          │
│    • Submits                            │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 9. SAVED TO shop_reviews TABLE          │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 10. SELLER SEES NEW REVIEWS             │
│     In Reviews screen                   │
└─────────────────────────────────────────┘
```

---

## 📊 Database Tables

### product_reviews

Stores product ratings from buyers.

**Key Columns:**
- `product_id` - Which product
- `buyer_id` - Who rated it
- `order_id` - Which order (one review per product per order)
- `rating` - 1-5 stars (REQUIRED)
- `comment` - Review text (optional)
- `images` - Photo URLs (optional)

### shop_reviews

Stores shop/seller ratings from buyers.

**Key Columns:**
- `seller_id` - Which shop
- `buyer_id` - Who rated it
- `order_id` - Which order (one shop review per order)
- `overall_rating` - Overall 1-5 stars (REQUIRED)
- `communication_rating` - Communication 1-5 (optional)
- `shipping_speed_rating` - Shipping 1-5 (optional)
- `product_quality_rating` - Quality 1-5 (optional)
- `comment` - Review text (optional)

---

## 🔐 Security Rules

✅ **Only buyers who purchased can review**
- Verified by order_id

✅ **One product review per order**
- Unique constraint: (product_id, buyer_id, order_id)

✅ **One shop review per order**
- Unique constraint: (seller_id, buyer_id, order_id)

✅ **Only after delivery**
- Backend checks order status = 'delivered'

✅ **Buyers can edit/delete their reviews**
- RLS policies enforce this

✅ **All reviews are public**
- Anyone can view active reviews

---

## 💡 Smart Features

### Average Rating Calculation

**Product Average:**
```sql
SELECT * FROM get_product_average_rating('product-uuid');

-- Returns:
{
  average_rating: 4.5,
  total_reviews: 10,
  rating_distribution: {
    "5": 6,
    "4": 2,
    "3": 1,
    "2": 1,
    "1": 0
  }
}
```

**Shop Average:**
```sql
SELECT * FROM get_shop_average_rating('seller-uuid');

-- Returns:
{
  overall_rating: 4.7,
  communication_rating: 4.8,
  shipping_speed_rating: 4.5,
  product_quality_rating: 4.9,
  total_reviews: 25,
  rating_distribution: {
    "5": 18,
    "4": 5,
    "3": 2,
    "2": 0,
    "1": 0
  }
}
```

---

## 🎯 Example: Complete Rating Flow

### Scenario: Buyer Rates After Delivery

**1. Order Delivered (Seller Side)**
```javascript
// In Orders.jsx - markAsDelivered()
await orderApi.updateOrderStatus(orderId, { status: 'delivered' });

// Send delivery notification
await sendOrderNotification(order.customer.id, order.orderNumber, 'delivered', productData);

// Send product review request (2 sec delay)
setTimeout(() => {
  await sendReviewRequest(order.customer.id, order.orderNumber, 'product', productData);
}, 2000);

// Send shop review request (4 sec delay)
setTimeout(() => {
  await sendReviewRequest(order.customer.id, order.orderNumber, 'shop', shopData);
}, 4000);
```

**2. Buyer Receives Notifications (Buyer Chat)**
- Sees 3 new messages in chat with seller
- Message 1: "🎉 Order delivered!"
- Message 2: "⭐ Rate this product" (with product info)
- Message 3: "⭐ Rate our shop" (with shop info)

**3. Buyer Rates Product**
```javascript
// API Call
POST /api/reviews/product
{
  productId: "uuid",
  orderId: "uuid",
  rating: 5,
  comment: "Amazing quality! Exactly as described.",
  images: ["photo1.jpg", "photo2.jpg"]
}

// Saved to database
INSERT INTO product_reviews (
  product_id, buyer_id, seller_id, order_id,
  rating, comment, images
) VALUES (...)
```

**4. Buyer Rates Shop**
```javascript
// API Call
POST /api/reviews/shop
{
  sellerId: "uuid",
  orderId: "uuid",
  overallRating: 5,
  communicationRating: 5,
  shippingSpeedRating: 4,
  productQualityRating: 5,
  comment: "Great seller! Fast shipping."
}

// Saved to database
INSERT INTO shop_reviews (
  seller_id, buyer_id, order_id,
  overall_rating, communication_rating, 
  shipping_speed_rating, product_quality_rating, comment
) VALUES (...)
```

**5. Seller Views Reviews**
```javascript
// In Reviews.jsx
GET /api/seller/reviews

// Returns both product and shop reviews
{
  productReviews: [...],
  shopReviews: [...],
  stats: {
    averageRating: 4.7,
    totalReviews: 25,
    ratingDistribution: {...}
  }
}
```

---

## 📱 Chat Notification Format

### Product Review Request Message

**Message Structure:**
```json
{
  "buyer_id": "buyer-uuid",
  "seller_id": "seller-uuid",
  "sender_id": "seller-uuid",
  "message": "⭐ How was your experience with [Product Name]? Please rate this product!",
  "product_data": {
    "id": "product-uuid",
    "name": "Luxury Chandelier",
    "image": "product-image.jpg",
    "price": "₱25,999",
    "orderId": "order-uuid",
    "orderNumber": "ORD-12345",
    "isReviewRequest": true,
    "reviewType": "product"
  }
}
```

### Shop Review Request Message

**Message Structure:**
```json
{
  "buyer_id": "buyer-uuid",
  "seller_id": "seller-uuid",
  "sender_id": "seller-uuid",
  "message": "⭐ How was your experience with [Shop Name]? Please rate our shop!",
  "product_data": {
    "shopId": "seller-uuid",
    "shopName": "Amazing Furniture Store",
    "shopLogo": "shop-logo.jpg",
    "orderId": "order-uuid",
    "orderNumber": "ORD-12345",
    "isReviewRequest": true,
    "reviewType": "shop"
  }
}
```

---

## ✅ What You Need to Do NOW

### Immediate Action Items:

1. **✅ RUN THE SQL SCRIPT** (5 minutes)
   - Open Supabase SQL Editor
   - Copy `server/sql/create_reviews_tables.sql`
   - Paste and run
   - Verify 3 tables created

2. **⏳ Wait for Backend API** (I'll create next)
   - Review submission endpoints
   - Review retrieval endpoints
   - Statistics endpoints

3. **⏳ Update Delivery Flow** (After API ready)
   - Add review request notifications
   - Integrate with existing delivery notification

4. **⏳ Create Rating UI** (After backend ready)
   - Product rating modal
   - Shop rating modal
   - Display reviews

---

## 🎓 Summary

**What we have:**
- ✅ Complete database schema (3 tables + functions)
- ✅ Security policies (RLS)
- ✅ Dual rating system (product + shop)
- ✅ Multi-criteria shop ratings
- ✅ Verified purchase only
- ✅ One review per product per order
- ✅ Auto-calculated averages
- ✅ Review images support
- ✅ Helper functions

**What's next:**
- ⏳ Backend API endpoints
- ⏳ Chat notification integration
- ⏳ Rating UI components
- ⏳ Display reviews

**First step:** Run the SQL script in Supabase! ✅
