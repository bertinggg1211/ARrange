import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Ionicons from 'react-native-vector-icons/Ionicons';
import styles from './styles/ResetPassword.styles';
import supabasePasswordReset from '../../services/supabasePasswordReset';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config/environment';

export default function ResetPassword({ navigation, route }) {
  const [step, setStep] = useState(1); // 1: Enter new password, 2: Success
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState(null);

  // Initialize Supabase client and set session from URL params
  useEffect(() => {
    const setupSession = async () => {
      try {
        console.log('🔧 Setting up Supabase client for password reset...');
        console.log('📦 Route params:', route?.params);
        
        const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Get session from URL params if available
        const params = route?.params || {};
        
        console.log('🔍 Checking for auth params...');
        console.log('  - code:', params.code ? 'Present (PKCE)' : 'Missing');
        console.log('  - access_token:', params.access_token ? 'Present (Implicit)' : 'Missing');
        console.log('  - refresh_token:', params.refresh_token ? 'Present' : 'Missing');
        
        // Handle Implicit flow (access_token and refresh_token)
        if (params.access_token && params.refresh_token) {
          console.log('🔑 Setting session from URL tokens...');
          const { data, error } = await client.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          
          if (error) {
            console.error('❌ Error setting session:', error);
            Alert.alert('Session Error', 'Could not establish session. Please request a new reset link.');
          } else {
            console.log('✅ Session set successfully');
            console.log('👤 Session user:', data.session?.user?.email);
          }
        } else {
          console.warn('⚠️ No auth parameters found!');
          console.log('📋 Available params:', Object.keys(params));
          Alert.alert('Session Missing', 'No authentication token found. Please use the link from your email.');
        }
        
        setSupabaseClient(client);
      } catch (error) {
        console.error('❌ Error setting up session:', error);
        Alert.alert('Setup Error', error.message);
      }
    };
    
    setupSession();
  }, [route]);

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Check password strength
  useEffect(() => {
    setPasswordStrength({
      hasMinLength: newPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasLowerCase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    });
  }, [newPassword]);

  // Calculate overall strength
  const getPasswordStrengthLevel = () => {
    const criteria = Object.values(passwordStrength).filter(Boolean).length;
    if (criteria <= 2) return { level: 'Weak', color: '#FF4444' };
    if (criteria <= 3) return { level: 'Fair', color: '#FF9900' };
    if (criteria <= 4) return { level: 'Good', color: '#FFC107' };
    return { level: 'Strong', color: '#4CAF50' };
  };

  // Validate password
  const validatePassword = () => {
    if (!newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return false;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }

    if (!confirmPassword) {
      Alert.alert('Error', 'Please confirm your password');
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  // Handle password reset
  const handleResetPassword = async () => {
    if (!validatePassword()) {
      return;
    }

    if (!supabaseClient) {
      Alert.alert('Error', 'Session not ready. Please try again.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Resetting password...');
      
      // First, verify we have a valid session
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error('❌ No valid session:', sessionError);
        throw new Error('No active session. Please use the reset link from your email again.');
      }
      
      console.log('✅ Session verified for user:', sessionData.session.user.email);
      console.log('🔑 Updating password for user ID:', sessionData.session.user.id);

      // Step 1: Update Supabase Auth password
      const { data, error } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('❌ Supabase Auth updateUser error:', error);
        throw error;
      }

      console.log('✅ Supabase Auth password updated!');
      console.log('👤 Updated user:', data.user?.email);

      // Step 2: Update password_hash in users table via backend API
      console.log('🔐 Updating password_hash in users table via backend...');
      
      const { API_BASE_URL } = require('../../config/environment');
      const response = await fetch(`${API_BASE_URL}/api/auth/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: sessionData.session.user.email, // Use email instead of userId for proper lookup
          newPassword: newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Backend password update failed:', result.message);
        throw new Error(result.message || 'Failed to update password in database.');
      }

      console.log('✅ Password hash updated in database!');
      console.log('🎉 Password reset complete - both Supabase Auth and database updated');

      // Move to success step
      setStep(2);
    } catch (error) {
      console.error('❌ Error resetting password:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to reset password. Please try again or request a new reset link.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Render Step 1: Enter New Password
  const renderPasswordStep = () => (
    <>
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed-outline" size={40} color="#FF9900" />
        </View>
      </View>

      <Text style={styles.title}>Create New Password</Text>
      <Text style={styles.subtitle}>
        Your new password must be different from previously used passwords
      </Text>

      <View style={styles.formContainer}>
        {/* New Password Input */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>New Password</Text>
          <View style={[styles.inputContainer, passwordFocused && styles.inputContainerFocused]}>
            <Ionicons
              name="lock-closed-outline"
              size={22}
              color={passwordFocused ? '#FF9900' : '#999999'}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor="#BBBBBB"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={22}
                color="#999999"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Password Strength Indicator */}
        {newPassword.length > 0 && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthHeader}>
              <Text style={styles.strengthLabel}>Password Strength:</Text>
              <Text style={[styles.strengthLevel, { color: getPasswordStrengthLevel().color }]}>
                {getPasswordStrengthLevel().level}
              </Text>
            </View>

            <View style={styles.strengthBars}>
              {[1, 2, 3, 4, 5].map((bar) => (
                <View
                  key={bar}
                  style={[
                    styles.strengthBar,
                    Object.values(passwordStrength).filter(Boolean).length >= bar && {
                      backgroundColor: getPasswordStrengthLevel().color,
                    },
                  ]}
                />
              ))}
            </View>

            <View style={styles.criteriaContainer}>
              <CriteriaItem
                met={passwordStrength.hasMinLength}
                text="At least 8 characters"
              />
              <CriteriaItem
                met={passwordStrength.hasUpperCase}
                text="One uppercase letter"
              />
              <CriteriaItem
                met={passwordStrength.hasLowerCase}
                text="One lowercase letter"
              />
              <CriteriaItem met={passwordStrength.hasNumber} text="One number" />
              <CriteriaItem
                met={passwordStrength.hasSpecialChar}
                text="One special character"
              />
            </View>
          </View>
        )}

        {/* Confirm Password Input */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <View
            style={[
              styles.inputContainer,
              confirmPasswordFocused && styles.inputContainerFocused,
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={22}
              color={confirmPasswordFocused ? '#FF9900' : '#999999'}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#BBBBBB"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              onFocus={() => setConfirmPasswordFocused(true)}
              onBlur={() => setConfirmPasswordFocused(false)}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                size={22}
                color="#999999"
              />
            </TouchableOpacity>
          </View>
          {confirmPassword.length > 0 && (
            <View style={styles.matchIndicator}>
              {newPassword === confirmPassword ? (
                <View style={styles.matchRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                  <Text style={[styles.matchText, { color: '#4CAF50' }]}>
                    Passwords match
                  </Text>
                </View>
              ) : (
                <View style={styles.matchRow}>
                  <Ionicons name="close-circle" size={18} color="#FF4444" />
                  <Text style={[styles.matchText, { color: '#FF4444' }]}>
                    Passwords do not match
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.disabledButton]}
          disabled={isLoading}
          onPress={handleResetPassword}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Reset Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  // Render Step 2: Success Message
  const renderSuccessStep = () => (
    <>
      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
          <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
        </View>
      </View>

      <Text style={styles.title}>Password Reset Successful!</Text>
      <Text style={styles.subtitle}>
        Your password has been successfully reset. You can now log in with your new password.
      </Text>

      <View style={styles.formContainer}>
        <View style={styles.successContainer}>
          <View style={styles.successRow}>
            <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
            <Text style={styles.successText}>Your account is now secure</Text>
          </View>

          <View style={styles.successRow}>
            <Ionicons name="lock-closed" size={24} color="#4CAF50" />
            <Text style={styles.successText}>New password is active</Text>
          </View>

          <View style={styles.successRow}>
            <Ionicons name="log-in" size={24} color="#FF9900" />
            <Text style={styles.successText}>Ready to log in</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      {/* Back Button (only show on step 1) - Now inside safe area */}
      {step === 1 && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      )}

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
        {step === 1 && renderPasswordStep()}
        {step === 2 && renderSuccessStep()}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

// Helper component for password criteria
const CriteriaItem = ({ met, text }) => (
  <View style={styles.criteriaRow}>
    <Ionicons
      name={met ? 'checkmark-circle' : 'ellipse-outline'}
      size={18}
      color={met ? '#4CAF50' : '#CCCCCC'}
    />
    <Text style={[styles.criteriaText, met && styles.criteriaTextMet]}>{text}</Text>
  </View>
);
