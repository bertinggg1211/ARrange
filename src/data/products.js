// Products data with shop assignments
export const PRODUCTS_WITH_SHOPS = {
  // Sample product IDs with their associated shop IDs
  'product_1': {
    shopId: 'shop_1', // Chandelier Shop
    shopName: 'Chandelier Shop',
  },
  'product_2': {
    shopId: 'shop_2', // Furniture Palace
    shopName: 'Furniture Palace',
  },
  'product_3': {
    shopId: 'shop_3', // Home Decor Plus
    shopName: 'Home Decor Plus',
  },
  'product_4': {
    shopId: 'shop_4', // Luxury Lights
    shopName: 'Luxury Lights',
  },
  'product_5': {
    shopId: 'shop_5', // Crystal Palace
    shopName: 'Crystal Palace',
  },
};

// Function to get shop info for a product
export const getProductShop = (productId) => {
  // For now, we'll use a simple mapping based on product name/id
  // In a real app, this would come from your product database
  return PRODUCTS_WITH_SHOPS[productId] || PRODUCTS_WITH_SHOPS.product_1;
};

// Function to determine shop based on product characteristics
export const getShopForProduct = (product) => {
  // Simple logic to assign products to shops based on characteristics
  // In a real app, this would be stored in the product data
  
  if (!product) return PRODUCTS_WITH_SHOPS.product_1;
  
  // Use product name or id to determine shop
  const productName = product.name?.toLowerCase() || '';
  
  if (productName.includes('crystal') || productName.includes('premium')) {
    return PRODUCTS_WITH_SHOPS.product_1; // Chandelier Shop
  }
  if (productName.includes('modern') || productName.includes('furniture')) {
    return PRODUCTS_WITH_SHOPS.product_2; // Furniture Palace
  }
  if (productName.includes('luxury') || productName.includes('decor')) {
    return PRODUCTS_WITH_SHOPS.product_3; // Home Decor Plus
  }
  if (productName.includes('light') || productName.includes('led')) {
    return PRODUCTS_WITH_SHOPS.product_4; // Luxury Lights
  }
  
  // Default fallback - randomly assign to create variety
  const shopKeys = Object.keys(PRODUCTS_WITH_SHOPS);
  const randomIndex = Math.floor(Math.random() * shopKeys.length);
  return PRODUCTS_WITH_SHOPS[shopKeys[randomIndex]];
};