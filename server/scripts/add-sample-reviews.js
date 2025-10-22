const { supabase } = require('../db/supabase');

// Sample reviews data
const sampleReviews = [
  { productId: 'bb54fce9-af9f-479c-b05e-0aef15b9b85d', rating: 5, comment: 'Excellent product, highly recommended!' },
  { productId: 'bb54fce9-af9f-479c-b05e-0aef15b9b85d', rating: 4, comment: 'Good quality, fast delivery' },
  { productId: 'bb54fce9-af9f-479c-b05e-0aef15b9b85d', rating: 5, comment: 'Perfect for my home office' },
  { productId: 'bb54fce9-af9f-479c-b05e-0aef15b9b85d', rating: 3, comment: 'Average product, could be better' },
  { productId: 'bb54fce9-af9f-479c-b05e-0aef15b9b85d', rating: 4, comment: 'Nice design and good value' },
  { productId: 'bb54fce9-af9f-479c-b05e-0aef15b9b85d', rating: 5, comment: 'Amazing lighting, exactly what I needed' },
  { productId: 'bb54fce9-af9f-479c-b05e-0aef15b9b85d', rating: 4, comment: 'Good product, would buy again' },
  { productId: 'bb54fce9-af9f-479c-b05e-0aef15b9b85d', rating: 2, comment: 'Not as expected, poor quality' },
  { productId: 'bb54fce9-af9f-479c-b05e-0aef15b9b85d', rating: 5, comment: 'Outstanding product and service' },
  { productId: 'bb54fce9-af9f-479c-b05e-0aef15b9b85d', rating: 4, comment: 'Good product overall' }
];

async function addSampleReviews() {
  try {
    console.log('🔄 Adding sample reviews...');
    
    // Get a sample buyer ID (you may need to adjust this)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'buyer')
      .limit(1);
    
    if (usersError || !users.length) {
      console.error('❌ No buyers found in database');
      return;
    }
    
    const buyerId = users[0].id;
    console.log('👤 Using buyer ID:', buyerId);
    
    // Get the product to find seller_id
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', sampleReviews[0].productId)
      .single();
    
    if (productError || !product) {
      console.error('❌ Product not found:', sampleReviews[0].productId);
      return;
    }
    
    console.log('🏪 Using seller ID:', product.seller_id);
    
    // Add reviews
    for (const review of sampleReviews) {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          product_id: review.productId,
          buyer_id: buyerId,
          seller_id: product.seller_id,
          rating: review.rating,
          comment: review.comment
        });
      
      if (error) {
        console.error('❌ Error adding review:', error);
      } else {
        console.log('✅ Added review:', review.rating, 'stars -', review.comment);
      }
    }
    
    console.log('✅ Sample reviews added successfully!');
    
    // Calculate and display the average rating
    const { data: allReviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', sampleReviews[0].productId);
    
    if (!reviewsError && allReviews) {
      const averageRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;
      console.log(`📊 Product now has ${allReviews.length} reviews with average rating: ${averageRating.toFixed(1)}`);
    }
    
  } catch (error) {
    console.error('❌ Error adding sample reviews:', error);
  }
}

// Run the script
addSampleReviews();
