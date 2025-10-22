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
} from 'react-native';
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Star Icon Top Right */}
        <View style={styles.starContainer}>
          <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2C12.5 5 15 7.5 18 8C15 8.5 12.5 11 12 14C11.5 11 9 8.5 6 8C9 7.5 11.5 5 12 2ZM12 22C11.5 19 9 16.5 6 16C9 15.5 11.5 13 12 10C12.5 13 15 15.5 18 16C15 16.5 12.5 19 12 22ZM2 12C5 11.5 7.5 9 8 6C8.5 9 11 11.5 14 12C11 12.5 8.5 15 8 18C7.5 15 5 12.5 2 12ZM22 12C19 12.5 16.5 15 16 18C15.5 15 13 12.5 10 12C13 11.5 15.5 9 16 6C16.5 9 19 11.5 22 12Z"
              fill="black"
            />
          </Svg>
        </View>

        {/* Title */}
        <Text style={styles.title}>Log in</Text>

        {/* Email Field */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            onFocus={() => handleFocus(150)}
          />
          {email !== '' && (
            <Ionicons name="checkmark-circle" size={20} color="#000" />
          )}
        </View>

        {/* Password Field */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={setPassword}
            onFocus={() => handleFocus(220)}
          />
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* Checkbox + Forgot Password */}
        <View style={styles.rowContainer}>
          <View style={styles.checkboxContainer}>
            <CheckBox
              value={agree}
              onValueChange={setAgree}
              tintColors={{ true: '#FF9900', false: '#ccc' }}
              style={styles.checkbox}
            />
            <Text style={styles.checkboxLabel}>
              I agree to the{' '}
              <Text style={styles.linkText}>Terms and Conditions</Text>
            </Text>
          </View>

          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* Log In Button */}
        <TouchableOpacity
          style={[styles.loginButton, !agree && styles.disabledButton]}
          disabled={!agree}
          onPress={handleLogin}
        >
          <Text style={styles.loginButtonText}>Log in</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>Or Login with</Text>
          <View style={styles.line} />
        </View>

        {/* Social Buttons */}
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-facebook" size={22} color="#1877F2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-google" size={22} color="#DB4437" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-apple" size={22} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Sign Up Navigation */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don’t have an account? </Text>
          <TouchableOpacity onPress={() => navigation.replace('Signup')}>
            <Text style={styles.signupHighlight}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
