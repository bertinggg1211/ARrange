import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import * as cartApi from "../api/cartApi";
import { authApi, BASE_URL } from "../api/api";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { user } = useAuth();

  // Load cart from backend when user logs in
  useEffect(() => {
    console.log('🔄 CartContext user effect triggered, user:', user ? `${user.email} (${user.role})` : 'No user');
    if (user) {
      console.log('✅ User found, loading cart from backend...');
      loadCart();
    } else {
      console.log('❌ No user found, clearing cart');
      setCart([]);
    }
  }, [user]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await cartApi.getCart();
      if (response.success) {
        setCart(response.cart.items || []);
        console.log('✅ Cart loaded from backend:', response.cart.items?.length || 0, 'items');
      }
    } catch (error) {
      console.error('❌ Error loading cart from backend:', error.message);
      
      // Try fallback cart endpoint if main cart fails
      try {
        console.log('🔄 Trying fallback cart endpoint...');
        const token = await authApi.getStoredToken();
        if (token) {
          const fallbackResponse = await fetch(`${BASE_URL}/api/cart/fallback`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            console.log('✅ Fallback cart endpoint working');
            setCart([]); // Empty cart for now
          } else {
            console.log('❌ Fallback cart endpoint also failed');
          }
        }
      } catch (fallbackError) {
        console.error('❌ Fallback cart also failed:', fallbackError.message);
      }
      
      console.log('🔄 Using local cart storage');
      // Keep local cart if API fails - don't clear existing cart
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product) => {
    console.log('=== ADDING TO CART ===');
    console.log('Product being added:', product.name, 'ID:', product.id);
    console.log('Quantity:', product.quantity);
    
    // Prevent multiple simultaneous add operations
    if (isAddingToCart) {
      console.log('⚠️ Add to cart already in progress, skipping');
      return;
    }
    
    try {
      setIsAddingToCart(true);
      
      if (user) {
        // Add to backend cart
        const response = await cartApi.addToCart(
          product.id, 
          product.quantity || 1, 
          product.sellerName
        );
        
        if (response.success) {
          // Reload cart from backend to get updated state
          await loadCart();
          console.log('✅ Added to backend cart successfully');
        }
      } else {
        // Fallback to local cart if not logged in
        setCart((prev) => {
          console.log('Current cart before adding:', prev);
          // Check if product already in cart
          const exists = prev.find((item) => item.id === product.id);
          if (exists) {
            console.log('Product already in cart, updating quantity');
            // Instead of adding duplicate, increase quantity by the amount specified
            const updatedCart = prev.map((item) =>
              item.id === product.id
                ? { ...item, quantity: (item.quantity || 1) + (product.quantity || 1) }
                : item
            );
            console.log('Updated cart:', updatedCart);
            return updatedCart;
          }
          // If new, add with specified quantity or default to 1
          const newCart = [...prev, { ...product, quantity: product.quantity || 1 }];
          console.log('New cart after adding:', newCart);
          return newCart;
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      
      // Check if it's a timeout error but operation might have succeeded
      if (error.message.includes('timeout') || error.message.includes('UnambiguousTimeoutError')) {
        console.log('⚠️ Timeout error detected - trying to reload cart to check if item was added');
        // Wait a bit then reload cart to see if the operation actually succeeded
        setTimeout(async () => {
          try {
            await loadCart();
            console.log('✅ Cart reloaded after timeout');
          } catch (reloadError) {
            console.log('❌ Cart reload failed, using local fallback');
          }
        }, 2000);
      }
      
      // Fallback to local cart on error
      setCart((prev) => {
        const exists = prev.find((item) => item.id === product.id);
        if (exists) {
          return prev.map((item) =>
            item.id === product.id
              ? { ...item, quantity: (item.quantity || 1) + (product.quantity || 1) }
              : item
          );
        }
        return [...prev, { ...product, quantity: product.quantity || 1 }];
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const removeFromCart = async (id) => {
    try {
      if (user) {
        // Remove from backend cart
        const response = await cartApi.removeFromCart(id);
        if (response.success) {
          // Force reload cart to get fresh data
          await loadCart();
        }
      } else {
        // Fallback to local cart
        setCart((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      // Fallback to local cart on error
      setCart((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const updateQuantity = async (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    try {
      if (user) {
        // Update in backend cart
        const response = await cartApi.updateCartItem(id, quantity);
        if (response.success) {
          await loadCart();
          console.log('✅ Updated backend cart successfully');
        }
      } else {
        // Fallback to local cart
        setCart((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, quantity } : item
          )
        );
      }
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      // Fallback to local cart on error
      setCart((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = async () => {
    try {
      if (user) {
        // Clear backend cart
        try {
          const response = await cartApi.clearCart();
          if (response.success) {
            setCart([]);
            console.log('✅ Cleared backend cart successfully');
          }
        } catch (apiError) {
          console.error('Error clearing cart from API:', apiError);
          // Still clear local cart even if API fails (e.g., during account deletion)
          setCart([]);
          console.log('✅ Cleared local cart despite API error');
        }
      } else {
        // Fallback to local cart
        setCart([]);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Fallback to local cart on error
      setCart([]);
    }
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity,
      clearCart,
      loading,
      loadCart,
      isAddingToCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
