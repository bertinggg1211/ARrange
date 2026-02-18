# Rating System Implementation Guide

## 🎯 Overview

This guide covers the complete implementation of a **dual rating system** for both **Products** and **Shops/Sellers**. Buyers can only rate after an order is marked as "Delivered".

---

## 📊 System Design

### Two Types of Ratings

1. **Product Reviews** - Rate individual products (1-5 stars)
2. **Shop Reviews** - Rate the seller/shop (1-5 stars with multiple criteria)

### Rating Criteria

#### Product Review
- ⭐ **Rating**: 1-5 stars
- 💬 **Comment**: Optional text review
- 📸 **Images**: Optional product photos
- 📋 **Review Title**: Optional short title

#### Shop Review
- ⭐ **Overall Rating**: 1-5 stars (REQUIRED)
- 💬 **Communication**: How well seller communicates
- 🚚 **Shipping Speed**: How fast items were shipped
- ✅ **Product Quality**: Overall product quality
- 💬 **Comment**: Optional text review

---

## 🗄️ Database Schema

### Tables Created

1. **`product_reviews`** - Product ratings by buyers
2. **`shop_reviews`** - Shop/seller ratings by buyers
3. **`review_responses`** - Seller responses to reviews (optional)

### Key Features

✅ **One review per product per order** - Prevents duplicate reviews
✅ **One shop review per order** - Rate shop once per order
✅ **Verified purchases only** - Only buyers who purchased can review
✅ **Multi-criteria shop ratings** - Communication, shipping, quality
✅ **Seller responses** - Sellers can respond to reviews
✅ **Helpful votes** - Other users can mark reviews as helpful
✅ **Review images** - Buyers can upload photos with reviews
✅ **Average rating functions** - Auto-calculate averages

---

## 🚀 Implementation Steps

### Step 1: Create Database Tables

Run this SQL in your Supabase SQL Editor:

**File:** `server/sql/create_reviews_tables.sql`

This creates:
- ✅ `product_reviews` table
- ✅ `shop_reviews` table
- ✅ `review_responses` table
- ✅ Indexes for performance
- ✅ RLS policies for security
- ✅ Helper functions for averages
- ✅ Triggers for updated_at

```sql
-- Run the entire create_reviews_tables.sql file in Supabase
```

### Step 2: Verify Tables Created

Check in Supabase:
```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('product_reviews', 'shop_reviews', 'review_responses');

-- Should return 3 rows
```

---

## 🔄 User Flow

### When Order is Delivered

```
1. Seller marks order as "Delivered"
   ↓
2. System sends TWO notifications to buyer:
   
   Notification 1: "🎉 Order delivered!"
   Notification 2: "⭐ Rate the product: [Product Name]"
   Notification 3: "⭐ Rate the shop: [Shop Name]"
   
   ↓
3. Buyer clicks notification in chat
   ↓
4. Opens rating modal/screen
   ↓
5. Buyer submits rating
   ↓
6. Rating saved to database
   ↓
7. Seller receives notification: "You got a new review!"
   ↓
8. Seller can view and respond to review
```

---

## 📱 Notification Messages

### Product Review Request
```
⭐ How was your experience with [Product Name]? 

Please take a moment to rate this product! Your feedback 
helps us improve and helps other buyers make informed 
decisions. Thank you! 💙

[Tap to Rate Product]
```

### Shop Review Request
```
⭐ How was your experience with [Shop Name]?

Please rate our shop! Your feedback on communication, 
shipping, and product quality helps us serve you better. 
Thank you! 💙

[Tap to Rate Shop]
```

---

## 🎨 Rating Modal UI (Recommended)

### Product Rating Modal
```
┌─────────────────────────────────┐
│  Rate Product                   │
├─────────────────────────────────┤
│                                 │
│  [Product Image]                │
│  Product Name                   │
│  ₱25,999                        │
│                                 │
│  How would you rate this?       │
│  ⭐⭐⭐⭐⭐                    │
│                                 │
│  Add Review (Optional)          │
│  ┌───────────────────────────┐ │
│  │ Share your experience...  │ │
│  └───────────────────────────┘ │
│                                 │
│  Add Photos (Optional)          │
│  [📷] [📷] [+]                 │
│                                 │
│  [Cancel]  [Submit Review]      │
└─────────────────────────────────┘
```

### Shop Rating Modal
```
┌─────────────────────────────────┐
│  Rate Shop                      │
├─────────────────────────────────┤
│                                 │
│  [Shop Logo]                    │
│  Shop Name                      │
│                                 │
│  Overall Rating                 │
│  ⭐⭐⭐⭐⭐                    │
│                                 │
│  Communication                  │
│  ⭐⭐⭐⭐☆                    │
│                                 │
│  Shipping Speed                 │
│  ⭐⭐⭐⭐⭐                    │
│                                 │
│  Product Quality                │
│  ⭐⭐⭐⭐⭐                    │
│                                 │
│  Add Comment (Optional)         │
│  ┌───────────────────────────┐ │
│  │ Share your experience...  │ │
│  └───────────────────────────┘ │
│                                 │
│  [Cancel]  [Submit Review]      │
└─────────────────────────────────┘
```

---

## 🔧 Backend API Endpoints (To Be Created)

### Product Reviews

```javascript
POST   /api/reviews/product
GET    /api/reviews/product/:productId
PUT    /api/reviews/product/:reviewId
DELETE /api/reviews/product/:reviewId
```

### Shop Reviews

```javascript
POST   /api/reviews/shop
GET    /api/reviews/shop/:sellerId
PUT    /api/reviews/shop/:reviewId
DELETE /api/reviews/shop/:reviewId
```

### Seller Reviews (Seller viewing their reviews)

```javascript
GET    /api/seller/reviews           // All reviews (products + shop)
GET    /api/seller/reviews/product   // Product reviews only
GET    /api/seller/reviews/shop      // Shop reviews only
POST   /api/seller/reviews/:reviewId/respond  // Respond to review
```

### Review Statistics

```javascript
GET    /api/reviews/stats/product/:productId  // Product rating stats
GET    /api/reviews/stats/shop/:sellerId      // Shop rating stats
```

---

## 📝 Database Structure Details

### product_reviews Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| product_id | UUID | Product being reviewed |
| buyer_id | UUID | Buyer who wrote review |
| seller_id | UUID | Seller of the product |
| order_id | UUID | Order this review is for |
| rating | INTEGER | 1-5 stars (REQUIRED) |
| comment | TEXT | Review text (optional) |
| review_title | VARCHAR | Short title (optional) |
| images | JSONB | Array of image URLs |
| helpful_count | INTEGER | How many found helpful |
| verified_purchase | BOOLEAN | Always true for orders |
| status | VARCHAR | active/hidden/reported/deleted |
| created_at | TIMESTAMP | When review was created |
| updated_at | TIMESTAMP | Last updated |

**Unique Constraint:** One review per (product_id, buyer_id, order_id)

### shop_reviews Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| seller_id | UUID | Shop/seller being reviewed |
| buyer_id | UUID | Buyer who wrote review |
| order_id | UUID | Order this review is for |
| overall_rating | INTEGER | 1-5 stars (REQUIRED) |
| communication_rating | INTEGER | 1-5 stars (optional) |
| shipping_speed_rating | INTEGER | 1-5 stars (optional) |
| product_quality_rating | INTEGER | 1-5 stars (optional) |
| comment | TEXT | Review text (optional) |
| review_title | VARCHAR | Short title (optional) |
| helpful_count | INTEGER | How many found helpful |
| verified_purchase | BOOLEAN | Always true for orders |
| status | VARCHAR | active/hidden/reported/deleted |
| created_at | TIMESTAMP | When review was created |
| updated_at | TIMESTAMP | Last updated |

**Unique Constraint:** One review per (seller_id, buyer_id, order_id)

---

## 🔐 Security & Rules

### Who Can Review?

✅ **Buyers only** - Only buyers can write reviews
✅ **After delivery** - Order must be marked "Delivered"
✅ **One review per product per order** - Can't spam reviews
✅ **One shop review per order** - Rate shop once
✅ **Verified purchases** - Must have actually purchased

### Who Can See Reviews?

✅ **Everyone** - All active reviews are public
✅ **Sellers see all** - Including hidden/reported ones
✅ **Buyers can edit** - Can update/delete their own reviews

### Review Status

- **active** - Visible to everyone (default)
- **hidden** - Hidden by admin/system
- **reported** - Flagged by users
- **deleted** - Soft deleted

---

## 💡 Helper Functions

### Get Product Average Rating

```sql
SELECT * FROM get_product_average_rating('product-uuid-here');

-- Returns:
-- average_rating: 4.50
-- total_reviews: 10
-- rating_distribution: {"1": 0, "2": 1, "3": 2, "4": 3, "5": 4}
```

### Get Shop Average Rating

```sql
SELECT * FROM get_shop_average_rating('seller-uuid-here');

-- Returns:
-- overall_rating: 4.50
-- communication_rating: 4.80
-- shipping_speed_rating: 4.20
-- product_quality_rating: 4.60
-- total_reviews: 25
-- rating_distribution: {"1": 1, "2": 2, "3": 3, "4": 8, "5": 11}
```

---

## 🎯 Integration with Existing Code

### Update Orders.jsx (Seller Side)

In the `markAsDelivered` function, add review request notifications:

```javascript
const markAsDelivered = async (orderId) => {
  // ... existing code to mark as delivered ...
  
  // Send delivery notification
  await sendOrderNotification(
    order.customer.id,
    order.orderNumber,
    'delivered',
    productData
  );
  
  // NEW: Send product review request (after 2 seconds)
  setTimeout(async () => {
    await sendReviewRequest(
      order.customer.id,
      order.orderNumber,
      'product',
      productData
    );
  }, 2000);
  
  // NEW: Send shop review request (after 4 seconds)
  setTimeout(async () => {
    await sendReviewRequest(
      order.customer.id,
      order.orderNumber,
      'shop',
      {
        shopId: order.seller.id,
        shopName: order.seller.name
      }
    );
  }, 4000);
};
```

---

## 📊 Stats & Analytics

### Product Stats
- Average rating (1-5)
- Total number of reviews
- Rating distribution (how many 5-star, 4-star, etc.)
- Recent reviews
- Most helpful reviews

### Shop Stats
- Overall average rating
- Communication average
- Shipping speed average
- Product quality average
- Total reviews
- Rating distribution
- Recent reviews

---

## 🧪 Testing Checklist

### Database Setup
- [ ] Run `create_reviews_tables.sql` in Supabase
- [ ] Verify 3 tables created
- [ ] Test helper functions work
- [ ] Check RLS policies active

### Backend API
- [ ] Create review API endpoints
- [ ] Test creating product review
- [ ] Test creating shop review
- [ ] Test updating review
- [ ] Test deleting review
- [ ] Test getting reviews
- [ ] Test rating statistics

### Frontend
- [ ] Review request notifications appear
- [ ] Rating modal opens correctly
- [ ] Can rate products 1-5 stars
- [ ] Can rate shop with multiple criteria
- [ ] Can add comments
- [ ] Can upload images (product reviews)
- [ ] Ratings save successfully
- [ ] Reviews display correctly

### Integration
- [ ] Order marked as delivered
- [ ] Buyer receives 2 review requests
- [ ] Buyer can submit both reviews
- [ ] Seller sees new reviews
- [ ] Stats update correctly
- [ ] Average ratings calculate correctly

---

## 🚀 Next Steps

1. ✅ **Run SQL script** - Create database tables
2. ⏳ **Create backend API** - Review endpoints
3. ⏳ **Update order delivery flow** - Add review notifications
4. ⏳ **Create rating UI** - Modal for submitting reviews
5. ⏳ **Display reviews** - Show on product/shop pages
6. ⏳ **Seller review management** - View and respond to reviews

---

## 📋 API Response Examples

### Create Product Review

**Request:**
```json
POST /api/reviews/product
{
  "productId": "uuid",
  "orderId": "uuid",
  "rating": 5,
  "comment": "Amazing product!",
  "reviewTitle": "Best purchase ever",
  "images": ["url1", "url2"]
}
```

**Response:**
```json
{
  "success": true,
  "review": {
    "id": "review-uuid",
    "productId": "product-uuid",
    "buyerId": "buyer-uuid",
    "rating": 5,
    "comment": "Amazing product!",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Create Shop Review

**Request:**
```json
POST /api/reviews/shop
{
  "sellerId": "uuid",
  "orderId": "uuid",
  "overallRating": 5,
  "communicationRating": 5,
  "shippingSpeedRating": 4,
  "productQualityRating": 5,
  "comment": "Great shop!"
}
```

**Response:**
```json
{
  "success": true,
  "review": {
    "id": "review-uuid",
    "sellerId": "seller-uuid",
    "buyerId": "buyer-uuid",
    "overallRating": 5,
    "communicationRating": 5,
    "shippingSpeedRating": 4,
    "productQualityRating": 5,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 💎 Best Practices

### For Buyers
- ✅ Be honest and constructive
- ✅ Include details in your review
- ✅ Upload photos if possible
- ✅ Review both product and shop

### For Sellers
- ✅ Respond professionally to all reviews
- ✅ Thank buyers for positive feedback
- ✅ Address concerns in negative reviews
- ✅ Use feedback to improve

### For System
- ✅ Only verified purchases can review
- ✅ One review per product per order
- ✅ Reviews are permanent record
- ✅ Prevent review manipulation

---

## 🎓 Summary

This rating system provides:
- ✅ Dual ratings (product + shop)
- ✅ Multi-criteria shop ratings
- ✅ Verified purchase reviews only
- ✅ Auto-calculated averages
- ✅ Review images support
- ✅ Seller response capability
- ✅ Helpful vote system
- ✅ Complete security with RLS

**Ready to implement! Just run the SQL and create the API endpoints.**
