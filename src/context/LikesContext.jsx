import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { addLike, removeLike, getLikes, checkLikeStatus } from "../api/likesApi";

const LikesContext = createContext();

export const LikesProvider = ({ children }) => {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load likes when user logs in
  useEffect(() => {
    if (user) {
      loadLikes();
    } else {
      console.log('🧹 LikesContext: User logged out, clearing likes');
      setLikes([]);
    }
  }, [user]);

  // Load likes from database
  const loadLikes = async () => {
    try {
      setLoading(true);
      console.log('❤️ Loading likes from database...');
      const response = await getLikes();
      if (response.success) {
        // Transform the data to match the expected format
        const transformedLikes = response.likes.map(like => ({
          id: like.products.id,
          name: like.products.name,
          price: like.products.price,
          images: like.products.images,
          category: like.products.category
        }));
        setLikes(transformedLikes);
        console.log('✅ Loaded likes:', transformedLikes.length);
      }
    } catch (error) {
      console.error('❌ Error loading likes:', error);
      // If likes table doesn't exist, continue with empty array
      setLikes([]);
    } finally {
      setLoading(false);
    }
  };

  const addToLikes = async (product) => {
    try {
      console.log('❤️ Adding product to likes:', product.id);
      
      // Add to database
      await addLike(product.id);
      
      // Update local state
      setLikes((prev) => {
        const exists = prev.find((item) => item.id === product.id);
        if (exists) return prev; // ✅ prevent duplicates
        return [...prev, product];
      });
      
      console.log('✅ Product added to likes successfully');
    } catch (error) {
      console.error('❌ Error adding to likes:', error);
      throw error;
    }
  };

  const removeFromLikes = async (productId) => {
    try {
      console.log('💔 Removing product from likes:', productId);
      
      // Remove from database
      await removeLike(productId);
      
      // Update local state
      setLikes((prev) => prev.filter((item) => item.id !== productId));
      
      console.log('✅ Product removed from likes successfully');
    } catch (error) {
      console.error('❌ Error removing from likes:', error);
      throw error;
    }
  };

  // Check if product is liked
  const isLiked = (productId) => {
    return likes.some(like => like.id === productId);
  };

  return (
    <LikesContext.Provider value={{ 
      likes, 
      loading,
      addToLikes, 
      removeFromLikes, 
      isLiked,
      loadLikes 
    }}>
      {children}
    </LikesContext.Provider>
  );
};

export const useLikes = () => useContext(LikesContext);
