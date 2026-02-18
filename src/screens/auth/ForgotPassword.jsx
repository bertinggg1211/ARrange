import React, { useState } from 'react';
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
import styles from './styles/ForgotPassword.styles';
import supabasePasswordReset from '../../services/supabasePasswordReset';

export default function ForgotPassword({ navigation }) {
  const [step, setStep] = useState(1); // 1: Email input, 2: Success message
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  // Step 1: Send password reset email
  const handleSendResetEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('📧 Sending password reset email to:', email);
      
      // Use Supabase's resetPasswordForEmail - this uses the "Reset Password" email template
      const result = await supabasePasswordReset.sendPasswordResetEmail(email);
      
      console.log('✅ Password reset email sent successfully:', result);
      
      // Move to success step
      setStep(2);
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      Alert.alert('Error', error.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  // Render Step 1: Email Input
  const renderEmailStep = () => (
    <>
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-outline" size={40} color="#FF9900" />
        </View>
      </View>

      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.subtitle}>
        Enter your email address and we'll send you a verification code to reset your password
      </Text>

      <View style={styles.formContainer}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={[styles.inputContainer, emailFocused && styles.inputContainerFocused]}>
            <Ionicons
              name="mail-outline"
              size={22}
              color={emailFocused ? '#FF9900' : '#999999'}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#BBBBBB"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
            {email !== '' && (
              <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.disabledButton]}
          disabled={isLoading}
          onPress={handleSendResetEmail}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  // Render Step 2: Success Message
  const renderSuccessStep = () => (
    <>
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-outline" size={40} color="#4CAF50" />
        </View>
      </View>

      <Text style={styles.title}>Check Your Email</Text>
      <Text style={styles.subtitle}>
        We've sent a password reset link to{'\n'}
        <Text style={styles.emailHighlight}>{email}</Text>
      </Text>

      <View style={styles.formContainer}>
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionRow}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.instructionText}>
              Click the link in the email to reset your password
            </Text>
          </View>

          <View style={styles.instructionRow}>
            <Ionicons name="time-outline" size={24} color="#FF9900" />
            <Text style={styles.instructionText}>
              The link will expire in 1 hour
            </Text>
          </View>

          <View style={styles.instructionRow}>
            <Ionicons name="information-circle-outline" size={24} color="#666666" />
            <Text style={styles.instructionText}>
              Check your spam folder if you don't see it
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton]}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Back to Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendContainer}
          onPress={handleSendResetEmail}
          activeOpacity={0.7}
        >
          <Text style={styles.resendText}>
            Didn't receive the email?{' '}
            <Text style={styles.resendHighlight}>Resend</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      
      {/* Back Button - Now inside safe area */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
        {step === 1 && renderEmailStep()}
        {step === 2 && renderSuccessStep()}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
