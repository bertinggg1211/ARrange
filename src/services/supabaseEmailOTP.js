/**
 * Supabase Email OTP Verification Service
 * Handles email verification using Supabase's built-in OTP functionality
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/environment';

class SupabaseEmailOTPService {
  constructor() {
    // Lazy initialization to ensure polyfills are loaded
    this.supabase = null;
    this.pendingEmail = null;
  }

  // Initialize Supabase client on first use
  getClient() {
    if (!this.supabase) {
      try {
        console.log('🔧 Initializing Supabase client for Email OTP...');
        console.log('🌐 Supabase URL:', SUPABASE_URL);
        
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          },
        });
        
        console.log('✅ Supabase client initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing Supabase client:', error);
        throw new Error('Failed to initialize email verification service');
      }
    }
    return this.supabase;
  }

  /**
   * Validate email format
   * @param {string} email
   * @returns {boolean}
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Send OTP verification code to email
   * @param {string} email - User's email address
   * @returns {Promise<object>} Result object
   */
  async sendVerificationCode(email) {
    try {
      // Validate email format
      if (!this.validateEmail(email)) {
        throw new Error('Invalid email format');
      }

      const normalizedEmail = email.trim().toLowerCase();
      this.pendingEmail = normalizedEmail;

      console.log('Sending OTP to email:', normalizedEmail);

      // Send OTP using Supabase Auth
      const client = this.getClient();
      const { data, error } = await client.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true, // Allow user signup/creation
        },
      });

      if (error) {
        console.error('Error sending OTP:', error);
        throw error;
      }

      console.log('OTP sent successfully to:', normalizedEmail);

      return {
        success: true,
        message: `Verification code sent to ${normalizedEmail}`,
        email: normalizedEmail,
      };
    } catch (error) {
      console.error('Error sending verification code:', error);

      // Handle specific Supabase errors
      if (error.message?.includes('rate limit')) {
        throw new Error('Too many attempts. Please wait 60 seconds before trying again.');
      } else if (error.message?.includes('Invalid email')) {
        throw new Error('Invalid email address. Please use a valid email (Gmail, Outlook, etc.).');
      } else if (error.message?.includes('Signups not allowed')) {
        throw new Error('Email signup is currently disabled. Please contact support.');
      } else {
        throw new Error(error.message || 'Failed to send verification code. Please try again.');
      }
    }
  }

  /**
   * Verify the OTP code entered by user
   * @param {string} email - User's email address
   * @param {string} code - 6-digit verification code
   * @returns {Promise<object>} Verification result
   */
  async verifyCode(email, code) {
    try {
      if (!email) {
        throw new Error('Email is required for verification');
      }

      if (!code || code.length !== 6) {
        throw new Error('Please enter a valid 6-digit code');
      }

      const normalizedEmail = email.trim().toLowerCase();
      console.log('Verifying OTP for email:', normalizedEmail);

      // Verify the OTP code
      const client = this.getClient();
      const { data, error } = await client.auth.verifyOtp({
        email: normalizedEmail,
        token: code,
        type: 'email',
      });

      if (error) {
        console.error('Error verifying OTP:', error);
        throw error;
      }

      console.log('Email verified successfully!');

      // Sign out immediately after verification (we just need to verify, not authenticate)
      await client.auth.signOut();

      return {
        success: true,
        message: 'Email verified successfully!',
        email: normalizedEmail,
      };
    } catch (error) {
      console.error('Error verifying code:', error);

      if (error.message?.includes('expired')) {
        throw new Error('Verification code expired. Please request a new code.');
      } else if (error.message?.includes('Invalid')) {
        throw new Error('Invalid verification code. Please try again.');
      } else {
        throw new Error(error.message || 'Failed to verify code');
      }
    }
  }

  /**
   * Reset state (for resending code)
   */
  reset() {
    this.pendingEmail = null;
  }
}

export default new SupabaseEmailOTPService();
