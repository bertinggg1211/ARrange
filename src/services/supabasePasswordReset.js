/**
 * Supabase Password Reset Service
 * Handles password reset using Supabase's built-in functionality
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/environment';

class SupabasePasswordResetService {
  constructor() {
    // Lazy initialization to ensure polyfills are loaded
    this.supabase = null;
  }

  // Initialize Supabase client on first use
  getClient() {
    if (!this.supabase) {
      try {
        console.log('🔧 Initializing Supabase client for Password Reset...');
        console.log('🌐 Supabase URL:', SUPABASE_URL);
        
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true, // Important: Detect session from URL
            flowType: 'implicit', // Use implicit flow for React Native
          },
        });
        
        console.log('✅ Supabase client initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing Supabase client:', error);
        throw new Error('Failed to initialize password reset service');
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
   * Send password reset email with magic link
   * Supabase will send an email with a link to reset password
   * @param {string} email - User's email address
   * @returns {Promise<object>} Result object
   */
  async sendPasswordResetEmail(email) {
    try {
      // Validate email format
      if (!this.validateEmail(email)) {
        throw new Error('Invalid email format');
      }

      const normalizedEmail = email.trim().toLowerCase();

      console.log('📧 Sending password reset email to:', normalizedEmail);

      // Send password reset email using Supabase Auth
      // Use deep link to open app's ResetPassword screen
      const client = this.getClient();
      const { data, error } = await client.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: 'arrange://reset-password',
      });

      if (error) {
        console.error('❌ Error sending password reset email:', error);
        throw error;
      }

      console.log('✅ Password reset email sent successfully to:', normalizedEmail);

      return {
        success: true,
        message: `Password reset link has been sent to ${normalizedEmail}`,
        email: normalizedEmail,
      };
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);

      // Handle specific Supabase errors
      if (error.message?.includes('rate limit')) {
        throw new Error('Too many attempts. Please wait 60 seconds before trying again.');
      } else if (error.message?.includes('Invalid email')) {
        throw new Error('Invalid email address. Please use a valid email.');
      } else if (error.message?.includes('User not found')) {
        // For security, don't reveal if user exists or not
        // Return success anyway
        return {
          success: true,
          message: `If an account exists with ${normalizedEmail}, a password reset link has been sent.`,
          email: normalizedEmail,
        };
      } else {
        throw new Error(error.message || 'Failed to send password reset email. Please try again.');
      }
    }
  }

  /**
   * Update password after user clicks reset link
   * This is called after user clicks the magic link in their email
   * @param {string} newPassword - New password
   * @returns {Promise<object>} Result object
   */
  async updatePassword(newPassword) {
    try {
      if (!newPassword || newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      console.log('🔐 Updating password...');

      const client = this.getClient();
      const { data, error } = await client.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('❌ Error updating password:', error);
        throw error;
      }

      console.log('✅ Password updated successfully!');

      return {
        success: true,
        message: 'Password updated successfully!',
      };
    } catch (error) {
      console.error('❌ Error updating password:', error);
      throw new Error(error.message || 'Failed to update password');
    }
  }

  /**
   * Send OTP for password reset (alternative method)
   * This sends a 6-digit code instead of a magic link
   * @param {string} email - User's email address
   * @returns {Promise<object>} Result object
   */
  async sendPasswordResetOTP(email) {
    try {
      // Validate email format
      if (!this.validateEmail(email)) {
        throw new Error('Invalid email format');
      }

      const normalizedEmail = email.trim().toLowerCase();

      console.log('📧 Sending password reset OTP to:', normalizedEmail);

      // Send OTP using Supabase Auth
      const client = this.getClient();
      const { data, error } = await client.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: false, // Don't create user if doesn't exist
        },
      });

      if (error) {
        console.error('❌ Error sending OTP:', error);
        throw error;
      }

      console.log('✅ Password reset OTP sent successfully to:', normalizedEmail);

      return {
        success: true,
        message: `Verification code sent to ${normalizedEmail}`,
        email: normalizedEmail,
      };
    } catch (error) {
      console.error('❌ Error sending password reset OTP:', error);

      // Handle specific Supabase errors
      if (error.message?.includes('rate limit')) {
        throw new Error('Too many attempts. Please wait 60 seconds before trying again.');
      } else if (error.message?.includes('Invalid email')) {
        throw new Error('Invalid email address. Please use a valid email.');
      } else {
        throw new Error(error.message || 'Failed to send verification code. Please try again.');
      }
    }
  }

  /**
   * Verify OTP and update password
   * @param {string} email - User's email address
   * @param {string} code - 6-digit verification code
   * @param {string} newPassword - New password
   * @returns {Promise<object>} Result object
   */
  async verifyOTPAndResetPassword(email, code, newPassword) {
    try {
      if (!email || !code || !newPassword) {
        throw new Error('Email, code, and new password are required');
      }

      if (code.length !== 6) {
        throw new Error('Please enter a valid 6-digit code');
      }

      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const normalizedEmail = email.trim().toLowerCase();
      console.log('🔐 Verifying OTP and resetting password for:', normalizedEmail);

      // Verify the OTP code
      const client = this.getClient();
      const { data, error } = await client.auth.verifyOtp({
        email: normalizedEmail,
        token: code,
        type: 'email',
      });

      if (error) {
        console.error('❌ Error verifying OTP:', error);
        throw error;
      }

      console.log('✅ OTP verified successfully!');

      // Now update the password
      const { error: updateError } = await client.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('❌ Error updating password:', updateError);
        throw updateError;
      }

      console.log('✅ Password reset successfully!');

      // Sign out after password reset
      await client.auth.signOut();

      return {
        success: true,
        message: 'Password reset successfully!',
      };
    } catch (error) {
      console.error('❌ Error resetting password:', error);

      if (error.message?.includes('expired')) {
        throw new Error('Verification code expired. Please request a new code.');
      } else if (error.message?.includes('Invalid')) {
        throw new Error('Invalid verification code. Please try again.');
      } else {
        throw new Error(error.message || 'Failed to reset password');
      }
    }
  }
}

export default new SupabasePasswordResetService();
