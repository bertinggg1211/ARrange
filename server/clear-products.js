const { supabase } = require('./db/supabase');

async function clearProducts() {
  try {
    console.log('🗑️ Starting to clear all products...');
    
    // Delete all products
    console.log('📦 Step 1: Deleting products...');
    const { error: productsError } = await supabase
      .from('products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (productsError) {
      console.error('❌ Error clearing products:', productsError);
      return;
    }
    
    console.log('✅ Products cleared successfully!');
    console.log('🎉 All products cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing products:', error);
  }
}

clearProducts();
