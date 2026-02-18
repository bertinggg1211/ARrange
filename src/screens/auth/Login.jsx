import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Svg, Path } from 'react-native-svg';
import CheckBox from '@react-native-community/checkbox';
import { useAuth } from '../../context/AuthContext';
import styles from './styles/Login.styles';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  const { login } = useAuth();
  const scrollViewRef = useRef(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    
    try {
      const userData = await login(email, password);
      Alert.alert('Success', `Welcome back, ${userData.fullName || 'User'}!`);
      // Do not manually replace; App.tsx will switch navigator based on auth context
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message || 'Something went wrong during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFocus = (inputRefY) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: inputRefY,
        animated: true,
      });
    }, 100);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Header Section */}
        <View style={styles.headerContainer}>
          {/* Star Icon */}
          <View style={styles.starContainer}>
            <Svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2C12.5 5 15 7.5 18 8C15 8.5 12.5 11 12 14C11.5 11 9 8.5 6 8C9 7.5 11.5 5 12 2ZM12 22C11.5 19 9 16.5 6 16C9 15.5 11.5 13 12 10C12.5 13 15 15.5 18 16C15 16.5 12.5 19 12 22ZM2 12C5 11.5 7.5 9 8 6C8.5 9 11 11.5 14 12C11 12.5 8.5 15 8 18C7.5 15 5 12.5 2 12ZM22 12C19 12.5 16.5 15 16 18C15.5 15 13 12.5 10 12C13 11.5 15.5 9 16 6C16.5 9 19 11.5 22 12Z"
                fill="#FF9900"
              />
            </Svg>
          </View>

          {/* Title */}
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          {/* Email Field */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email</Text>
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
                onFocus={() => {
                  setEmailFocused(true);
                  handleFocus(150);
                }}
                onBlur={() => setEmailFocused(false)}
              />
              {email !== '' && (
                <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
              )}
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[styles.inputContainer, passwordFocused && styles.inputContainerFocused]}>
              <Ionicons 
                name="lock-closed-outline" 
                size={22} 
                color={passwordFocused ? '#FF9900' : '#999999'} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#BBBBBB"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
                onFocus={() => {
                  setPasswordFocused(true);
                  handleFocus(220);
                }}
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                <Ionicons
                  name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#999999"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Checkbox + Forgot Password */}
        <View style={styles.rowContainer}>
          <View style={styles.checkboxContainer}>
            <CheckBox
              value={agree}
              onValueChange={setAgree}
              tintColors={{ true: '#FF9900', false: '#CCCCCC' }}
              style={styles.checkbox}
            />
            <Text style={styles.checkboxLabel}>
              I agree to the{' '}
              <Text style={styles.linkText}>Terms</Text>
            </Text>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPassword}>Forgot?</Text>
          </TouchableOpacity>
        </View>

        {/* Log In Button */}
        <TouchableOpacity
          style={[styles.loginButton, (!agree || isLoading) && styles.disabledButton]}
          disabled={!agree || isLoading}
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        {/* Sign Up Navigation */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.replace('Signup')} activeOpacity={0.7}>
            <Text style={styles.signupHighlight}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
