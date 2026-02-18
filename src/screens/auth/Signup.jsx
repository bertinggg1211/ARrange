import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CheckBox from '@react-native-community/checkbox';
import * as Animatable from 'react-native-animatable';
import styles from './styles/Signup.styles';
import { useAuth } from '../../context/AuthContext';
import supabaseEmailOTP from '../../services/supabaseEmailOTP';

export default function Signup({ navigation }) {
  const scrollViewRef = React.useRef(null);
  const [role, setRole] = useState('buyer');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Buyer credentials
  const [fullName, setFullName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPassword, setBuyerPassword] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');

  // Seller credentials
  const [sellerFullName, setSellerFullName] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [sellerPassword, setSellerPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');

  // Email Verification States (replaces SMS)
  const [buyerCodeSent, setBuyerCodeSent] = useState(false);
  const [buyerVerificationCode, setBuyerVerificationCode] = useState('');
  const [buyerEmailVerified, setBuyerEmailVerified] = useState(false);
  const [buyerSendingCode, setBuyerSendingCode] = useState(false);
  const [buyerVerifyingCode, setBuyerVerifyingCode] = useState(false);

  const [sellerCodeSent, setSellerCodeSent] = useState(false);
  const [sellerVerificationCode, setSellerVerificationCode] = useState('');
  const [sellerEmailVerified, setSellerEmailVerified] = useState(false);
  const [sellerSendingCode, setSellerSendingCode] = useState(false);
  const [sellerVerifyingCode, setSellerVerifyingCode] = useState(false);

  const { signup } = useAuth();

  // Countdown timer for resending code
  const [buyerCountdown, setBuyerCountdown] = useState(0);
  const [sellerCountdown, setSellerCountdown] = useState(0);

  // Countdown effect for buyer
  useEffect(() => {
    if (buyerCountdown > 0) {
      const timer = setTimeout(() => setBuyerCountdown(buyerCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [buyerCountdown]);

  // Countdown effect for seller
  useEffect(() => {
    if (sellerCountdown > 0) {
      const timer = setTimeout(() => setSellerCountdown(sellerCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [sellerCountdown]);

  // Handle Send Email OTP for Buyer
  const handleSendBuyerEmailOTP = async () => {
    if (!buyerEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setBuyerSendingCode(true);
    try {
      const result = await supabaseEmailOTP.sendVerificationCode(buyerEmail);
      Alert.alert('Success', result.message);
      setBuyerCodeSent(true);
      setBuyerCountdown(60); // 60-second cooldown
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setBuyerSendingCode(false);
    }
  };

  // Handle Verify Buyer Email OTP
  const handleVerifyBuyerEmailOTP = async () => {
    if (!buyerVerificationCode || buyerVerificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }

    setBuyerVerifyingCode(true);
    try {
      const result = await supabaseEmailOTP.verifyCode(buyerEmail, buyerVerificationCode);
      Alert.alert('Success', result.message);
      setBuyerEmailVerified(true);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setBuyerVerifyingCode(false);
    }
  };

  // Handle Send Email OTP for Seller
  const handleSendSellerEmailOTP = async () => {
    if (!sellerEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setSellerSendingCode(true);
    try {
      const result = await supabaseEmailOTP.sendVerificationCode(sellerEmail);
      Alert.alert('Success', result.message);
      setSellerCodeSent(true);
      setSellerCountdown(60); // 60-second cooldown
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSellerSendingCode(false);
    }
  };

  // Handle Verify Seller Email OTP
  const handleVerifySellerEmailOTP = async () => {
    if (!sellerVerificationCode || sellerVerificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }

    setSellerVerifyingCode(true);
    try {
      const result = await supabaseEmailOTP.verifyCode(sellerEmail, sellerVerificationCode);
      Alert.alert('Success', result.message);
      setSellerEmailVerified(true);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSellerVerifyingCode(false);
    }
  };

  // Handle Signup
  const handleSignup = async () => {
    setIsLoading(true);

    try {
      if (role === 'buyer') {
        // Validate buyer fields
        if (!fullName || !buyerEmail || !buyerPassword || !buyerAddress || !buyerPhone) {
          Alert.alert('Error', 'Please fill in all fields');
          setIsLoading(false);
          return;
        }

        // Check email verification
        if (!buyerEmailVerified) {
          Alert.alert('Error', 'Please verify your email address first');
          setIsLoading(false);
          return;
        }

        // Register buyer
        const userData = {
          role: 'buyer',
          fullName,
          email: buyerEmail,
          password: buyerPassword,
          address: buyerAddress,
          phone: buyerPhone,
        };

        await signup(userData);
        Alert.alert('Success', 'Account created successfully!');
      } else {
        // Validate seller fields
        if (!sellerFullName || !sellerEmail || !sellerPassword || !shopName || !sellerAddress || !sellerPhone) {
          Alert.alert('Error', 'Please fill in all fields');
          setIsLoading(false);
          return;
        }

        // Check email verification
        if (!sellerEmailVerified) {
          Alert.alert('Error', 'Please verify your email address first');
          setIsLoading(false);
          return;
        }

        // Register seller
        const userData = {
          role: 'seller',
          fullName: sellerFullName,
          email: sellerEmail,
          password: sellerPassword,
          shopName,
          address: sellerAddress,
          phone: sellerPhone,
        };

        await signup(userData);
        Alert.alert('Success', 'Seller account created successfully!');
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.outerContainer} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" translucent={false} />
      {/* Fixed Header Container - Never scrolls, stays at top */}
      <View style={styles.headerSafeArea}>
        <View style={styles.fixedHeaderContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join ARrange and start shopping in AR</Text>
        </View>
      </View>
      
      {/* Scrollable Content Area with Keyboard Aware */}
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={20}
        extraHeight={150}
      >

          {/* Enhanced Role Selector */}
          <Animatable.View animation="fadeInUp" duration={800} delay={200}>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'buyer' && styles.roleButtonActive]}
                onPress={() => setRole('buyer')}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="cart-outline" 
                  size={20} 
                  color={role === 'buyer' ? '#FF9900' : '#6B7280'} 
                  style={styles.roleIcon}
                />
                <Text style={[styles.roleText, role === 'buyer' && styles.roleTextActive]}>Buyer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'seller' && styles.roleButtonActive]}
                onPress={() => setRole('seller')}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="storefront-outline" 
                  size={20} 
                  color={role === 'seller' ? '#FF9900' : '#6B7280'} 
                  style={styles.roleIcon}
                />
                <Text style={[styles.roleText, role === 'seller' && styles.roleTextActive]}>Seller</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>

          {/* Buyer Form */}
          {role === 'buyer' && (
            <Animatable.View animation="fadeIn" duration={300}>
              {/* Full Name */}
              <InputField
                icon="person-outline"
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
                isVerified={fullName !== ''}
                scrollViewRef={scrollViewRef}
              />

              {/* Email with Verify Button */}
              <EmailInputWithVerify
                value={buyerEmail}
                onChangeText={setBuyerEmail}
                onPressSend={handleSendBuyerEmailOTP}
                isSending={buyerSendingCode}
                isVerified={buyerEmailVerified}
                countdown={buyerCountdown}
                scrollViewRef={scrollViewRef}
              />

              {/* Verification Code Input (appears after Send Code is pressed) */}
              {buyerCodeSent && !buyerEmailVerified && (
                <VerificationCodeInput
                  value={buyerVerificationCode}
                  onChangeText={setBuyerVerificationCode}
                  onPressVerify={handleVerifyBuyerEmailOTP}
                  isVerifying={buyerVerifyingCode}
                  scrollViewRef={scrollViewRef}
                />
              )}

              {/* Password */}
              <PasswordInput
                value={buyerPassword}
                onChangeText={setBuyerPassword}
                passwordVisible={passwordVisible}
                setPasswordVisible={setPasswordVisible}
                scrollViewRef={scrollViewRef}
              />

              {/* Address */}
              <InputField
                icon="location-outline"
                placeholder="Address"
                value={buyerAddress}
                onChangeText={setBuyerAddress}
                isVerified={buyerAddress !== ''}
                scrollViewRef={scrollViewRef}
              />

              {/* Phone Number */}
              <InputField
                icon="call-outline"
                placeholder="Phone Number"
                value={buyerPhone}
                onChangeText={setBuyerPhone}
                keyboardType="phone-pad"
                isVerified={buyerPhone !== ''}
                scrollViewRef={scrollViewRef}
              />
            </Animatable.View>
          )}

          {/* Seller Form */}
          {role === 'seller' && (
            <Animatable.View animation="fadeIn" duration={300}>
              {/* Full Name */}
              <InputField
                icon="person-outline"
                placeholder="Full Name"
                value={sellerFullName}
                onChangeText={setSellerFullName}
                isVerified={sellerFullName !== ''}
                scrollViewRef={scrollViewRef}
              />

              {/* Email with Verify Button */}
              <EmailInputWithVerify
                value={sellerEmail}
                onChangeText={setSellerEmail}
                onPressSend={handleSendSellerEmailOTP}
                isSending={sellerSendingCode}
                isVerified={sellerEmailVerified}
                countdown={sellerCountdown}
                scrollViewRef={scrollViewRef}
              />

              {/* Verification Code Input (appears after Send Code is pressed) */}
              {sellerCodeSent && !sellerEmailVerified && (
                <VerificationCodeInput
                  value={sellerVerificationCode}
                  onChangeText={setSellerVerificationCode}
                  onPressVerify={handleVerifySellerEmailOTP}
                  isVerifying={sellerVerifyingCode}
                  scrollViewRef={scrollViewRef}
                />
              )}

              {/* Password */}
              <PasswordInput
                value={sellerPassword}
                onChangeText={setSellerPassword}
                passwordVisible={passwordVisible}
                setPasswordVisible={setPasswordVisible}
                scrollViewRef={scrollViewRef}
              />

              {/* Shop Name */}
              <InputField
                icon="storefront-outline"
                placeholder="Shop Name"
                value={shopName}
                onChangeText={setShopName}
                isVerified={shopName !== ''}
                scrollViewRef={scrollViewRef}
              />

              {/* Address */}
              <InputField
                icon="location-outline"
                placeholder="Business Address"
                value={sellerAddress}
                onChangeText={setSellerAddress}
                isVerified={sellerAddress !== ''}
                scrollViewRef={scrollViewRef}
              />

              {/* Phone Number */}
              <InputField
                icon="call-outline"
                placeholder="Phone Number"
                value={sellerPhone}
                onChangeText={setSellerPhone}
                keyboardType="phone-pad"
                isVerified={sellerPhone !== ''}
                scrollViewRef={scrollViewRef}
              />
            </Animatable.View>
          )}

          {/* Enhanced Terms and Conditions */}
          <Animatable.View animation="fadeInUp" duration={600} delay={400}>
            <View style={styles.checkboxContainer}>
              <CheckBox
                value={agree}
                onValueChange={setAgree}
                tintColors={{ true: '#FF9900', false: '#D1D5DB' }}
                style={styles.checkbox}
              />
              <Text style={styles.checkboxLabel}>
                I agree to the <Text style={styles.linkText}>Terms and Conditions</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </View>
          </Animatable.View>

          {/* Enhanced Signup Button */}
          <Animatable.View animation="fadeInUp" duration={600} delay={500}>
            <TouchableOpacity
              style={[styles.signupButton, (!agree || isLoading) && styles.disabledButton]}
              disabled={!agree || isLoading}
              onPress={handleSignup}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={[styles.signupButtonText, { marginLeft: 10 }]}>Creating Account...</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.signupButtonText}>Create Account</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>
          </Animatable.View>

          {/* Enhanced Login Navigation */}
          <Animatable.View animation="fadeIn" duration={800} delay={600}>
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.replace('Login')} activeOpacity={0.7}>
                <Text style={styles.loginHighlight}>Log in</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

// Enhanced Input Field Component with Animation
const InputField = ({ icon, placeholder, value, onChangeText, keyboardType = 'default', isVerified = false, scrollViewRef }) => {
  const [isFocused, setIsFocused] = React.useState(false);
  
  return (
    <Animatable.View 
      animation={isFocused ? "pulse" : undefined} 
      duration={300}
    >
      <View 
        style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}
      >
        <Ionicons name={icon} size={22} color={isFocused ? "#FF9900" : "#9CA3AF"} style={styles.inputIcon} />
        <TextInput
          style={styles.inputText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {isVerified && (
          <Animatable.View animation="bounceIn" duration={500}>
            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
          </Animatable.View>
        )}
      </View>
    </Animatable.View>
  );
};

// Enhanced Email Input Field with Verify Button
const EmailInputWithVerify = ({ value, onChangeText, onPressSend, isSending, isVerified, countdown, scrollViewRef }) => {
  const [isFocused, setIsFocused] = React.useState(false);
  
  return (
    <View style={styles.emailVerifyContainer}>
      <Animatable.View 
        animation={isFocused ? "pulse" : undefined} 
        duration={300}
      >
        <View 
          style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}
        >
          <Ionicons name="mail-outline" size={22} color={isFocused ? "#FF9900" : "#9CA3AF"} style={styles.inputIcon} />
          <TextInput
            style={styles.inputText}
            placeholder="Email Address"
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChangeText}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {isVerified ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.verifiedBadgeText}>Verified</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.getSMSButton,
                (isSending || countdown > 0) && styles.getSMSButtonDisabled
              ]}
              onPress={onPressSend}
              disabled={isSending || countdown > 0}
              activeOpacity={0.8}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.getSMSButtonText}>
                  {countdown > 0 ? `${countdown}s` : 'Send Code'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </Animatable.View>
    </View>
  );
};

// Enhanced Verification Code Input Field
const VerificationCodeInput = ({ value, onChangeText, onPressVerify, isVerifying, scrollViewRef }) => {
  const [isFocused, setIsFocused] = React.useState(false);
  
  return (
    <Animatable.View animation="fadeInDown" duration={500}>
      <View style={styles.verificationCodeContainer}>
        <Ionicons name="mail-open-outline" size={16} color="#92400E" />
        <Text style={styles.verificationHintText}> Check your email for the 6-digit verification code</Text>
      </View>
      
      <View style={styles.verificationContainer}>
        <View 
          style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}
        >
          <Ionicons name="keypad-outline" size={22} color={isFocused ? "#FF9900" : "#9CA3AF"} style={styles.inputIcon} />
          <TextInput
            style={styles.inputText}
            placeholder="Enter 6-digit code"
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChangeText}
            keyboardType="number-pad"
            maxLength={6}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <TouchableOpacity
            style={[
              styles.verifyButton,
              (isVerifying || value.length !== 6) && styles.verifyButtonDisabled
            ]}
            onPress={onPressVerify}
            disabled={isVerifying || value.length !== 6}
            activeOpacity={0.8}
          >
            {isVerifying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Animatable.View>
  );
};

// Enhanced Password Input Component
const PasswordInput = ({ value, onChangeText, passwordVisible, setPasswordVisible, scrollViewRef }) => {
  const [isFocused, setIsFocused] = React.useState(false);
  
  return (
    <Animatable.View 
      animation={isFocused ? "pulse" : undefined} 
      duration={300}
    >
      <View 
        style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}
      >
        <Ionicons name="lock-closed-outline" size={22} color={isFocused ? "#FF9900" : "#9CA3AF"} style={styles.inputIcon} />
        <TextInput
          style={styles.inputText}
          placeholder="Password (min. 6 characters)"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!passwordVisible}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} activeOpacity={0.7}>
          <Ionicons 
            name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} 
            size={22} 
            color={isFocused ? "#FF9900" : "#9CA3AF"} 
          />
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );
};
