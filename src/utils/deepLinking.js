/**
 * Deep Linking Utility
 * Handles deep links for password reset and other features
 */

import { Linking } from 'react-native';

class DeepLinkingService {
  constructor() {
    this.listeners = [];
  }

  /**
   * Initialize deep linking
   * Call this in your App.tsx or main component
   */
  initialize(navigationRef) {
    console.log('🔗 Deep linking service initialized');
    
    // Handle deep links when app is already running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('📱 Deep link received (app running):', url);
      this.handleDeepLink(url, navigationRef);
    });

    // Handle deep links when app is opened from closed state
    // Add a delay to ensure navigation is ready
    setTimeout(() => {
      Linking.getInitialURL().then((url) => {
        if (url) {
          console.log('📱 Deep link received (app opened from closed):', url);
          this.handleDeepLink(url, navigationRef);
        } else {
          console.log('📱 No initial URL found');
        }
      }).catch(err => {
        console.error('❌ Error getting initial URL:', err);
      });
    }, 1000);

    return subscription;
  }

  /**
   * Handle incoming deep link
   */
  handleDeepLink(url, navigationRef) {
    if (!url) return;

    try {
      console.log('🔗 Processing deep link:', url);

      // Check if this is a Supabase auth URL
      if (url.includes('supabase.co/auth/v1/verify')) {
        console.log('🔐 Supabase auth URL detected, handling password reset...');
        this.handlePasswordReset({}, navigationRef);
        return;
      }

      // Parse the URL - handle both query params (?) and fragments (#)
      const route = url.replace(/.*?:\/\//g, ''); // Remove scheme (arrange://)
      const routeName = route.split(/[?#]/)[0]; // Get route name (split by ? or #)
      const params = this.extractParams(url);

      console.log('📍 Route:', routeName);
      console.log('📦 Params:', params);

      // Handle different routes
      switch (routeName) {
        case 'reset-password':
          this.handlePasswordReset(params, navigationRef);
          break;
        
        default:
          console.log('⚠️ Unknown deep link route:', routeName);
      }
    } catch (error) {
      console.error('❌ Error handling deep link:', error);
    }
  }

  /**
   * Extract query parameters and fragment parameters from URL
   * Supabase uses fragments (#) for implicit flow tokens
   */
  extractParams(url) {
    const params = {};
    
    // Extract query parameters (after ?)
    const queryString = url.split('?')[1]?.split('#')[0];
    if (queryString) {
      queryString.split('&').forEach((param) => {
        const [key, value] = param.split('=');
        if (key && value) {
          params[key] = decodeURIComponent(value);
        }
      });
    }
    
    // Extract fragment parameters (after #)
    // This is where Supabase puts the access_token and refresh_token
    const fragmentString = url.split('#')[1];
    if (fragmentString) {
      fragmentString.split('&').forEach((param) => {
        const [key, value] = param.split('=');
        if (key && value) {
          params[key] = decodeURIComponent(value);
        }
      });
    }
    
    return params;
  }

  /**
   * Handle password reset deep link
   */
  async handlePasswordReset(params, navigationRef) {
    console.log('🔐 Handling password reset deep link');
    console.log('📦 Reset params:', params);
    
    // Check for errors in the URL (e.g., expired link)
    if (params.error) {
      console.error('❌ Error in reset password link:', params.error);
      console.error('   Error code:', params.error_code);
      console.error('   Error description:', params.error_description);
      
      // Navigate to login with error message
      setTimeout(() => {
        if (navigationRef?.current) {
          const { Alert } = require('react-native');
          Alert.alert(
            'Link Expired',
            'The password reset link has expired or is invalid. Please request a new one.',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigationRef.current.navigate('ForgotPassword');
                }
              }
            ]
          );
        }
      }, 500);
      return;
    }
    
    // Exchange the token hash for a session if present
    if (params.access_token || params.refresh_token) {
      console.log('🔑 Session tokens found in URL, establishing session...');
      
      try {
        // Import Supabase client
        const { createClient } = require('@supabase/supabase-js');
        const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('../config/environment');
        
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Set the session from the URL tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        
        if (error) {
          console.error('❌ Error setting session:', error);
        } else {
          console.log('✅ Session established successfully');
        }
      } catch (error) {
        console.error('❌ Error exchanging token:', error);
      }
    }
    
    // Navigate to ResetPassword screen
    // Give a small delay to ensure navigation is ready
    setTimeout(() => {
      if (navigationRef?.current) {
        console.log('📱 Navigating to ResetPassword screen...');
        
        // Try to navigate - ResetPassword might be nested in Auth navigator
        try {
          // First try direct navigation (if already in auth flow)
          navigationRef.current.navigate('ResetPassword', params);
        } catch (error) {
          // If that fails, navigate to Auth stack first, then ResetPassword
          console.log('📱 Navigating through Auth stack...');
          navigationRef.current.navigate('Auth', {
            screen: 'ResetPassword',
            params: params,
          });
        }
      } else {
        console.error('❌ Navigation ref not available');
      }
    }, 500);
  }

  /**
   * Add a custom listener for deep links
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove a listener
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Notify all listeners of a deep link
   */
  notifyListeners(url) {
    this.listeners.forEach(listener => listener(url));
  }
}

export default new DeepLinkingService();
