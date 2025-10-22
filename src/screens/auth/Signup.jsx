import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CheckBox from '@react-native-community/checkbox';
import * as Animatable from 'react-native-animatable';
import styles from './styles/Signup.styles';
import { useAuth } from '../../context/AuthContext';

export default function Signup({ navigation }) {
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

  const { signup } = useAuth();

  const renderBuyerFields = () => (
    <Animatable.View animation="fadeInRight" duration={400} key="buyer">
      <InputField icon="person-outline" placeholder="Full Name" value={fullName} onChangeText={setFullName} />
      <InputField icon="mail-outline" placeholder="Email" value={buyerEmail} onChangeText={setBuyerEmail} />
      <PasswordField value={buyerPassword} onChangeText={setBuyerPassword} visible={passwordVisible} setVisible={setPasswordVisible} />
      <InputField icon="home-outline" placeholder="Address" value={buyerAddress} onChangeText={setBuyerAddress} />
      <InputField icon="call-outline" placeholder="Phone Number" value={buyerPhone} onChangeText={setBuyerPhone} keyboardType="phone-pad" />
    </Animatable.View>
  );

  const renderSellerFields = () => (
    <Animatable.View animation="fadeInLeft" duration={400} key="seller">
      <InputField icon="person-outline" placeholder="Full Name" value={sellerFullName} onChangeText={setSellerFullName} />
      <InputField icon="mail-outline" placeholder="Email" value={sellerEmail} onChangeText={setSellerEmail} />
      <PasswordField value={sellerPassword} onChangeText={setSellerPassword} visible={passwordVisible} setVisible={setPasswordVisible} />
      <InputField icon="storefront-outline" placeholder="Shop Name" value={shopName} onChangeText={setShopName} />
      <InputField icon="home-outline" placeholder="Address" value={sellerAddress} onChangeText={setSellerAddress} />
      <InputField icon="call-outline" placeholder="Phone Number" value={sellerPhone} onChangeText={setSellerPhone} keyboardType="phone-pad" />
    </Animatable.View>
  );

  // Handle Sign Up
  const handleSignup = async () => {
    if (!agree) {
      Alert.alert('Error', 'Please agree to the terms and conditions');
      return;
    }

    let userData = {};

    if (role === 'buyer') {
      if (!fullName || !buyerEmail || !buyerPassword || !buyerAddress || !buyerPhone) {
        Alert.alert('Error', 'Please fill all fields');
        return;
      }
      userData = {
        role,
        fullName,
        email: buyerEmail,
        password: buyerPassword,
        address: buyerAddress,
        phone: buyerPhone,
      };
    } else {
      if (!sellerFullName || !sellerEmail || !sellerPassword || !shopName || !sellerAddress || !sellerPhone) {
        Alert.alert('Error', 'Please fill all fields');
        return;
      }
      userData = {
        role,
        fullName: sellerFullName,
        email: sellerEmail,
        password: sellerPassword,
        shopName,
        address: sellerAddress,
        phone: sellerPhone,
      };
    }

    setIsLoading(true);
    
    try {
      await signup(userData);
      Alert.alert('Success', 'Account created successfully!', [
        { 
          text: 'OK', 
          onPress: () => navigation.replace('Login')
        }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

             {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Get Started</Text>
            <Text style={styles.headerSubtitle}>by creating a free account.</Text>
          </View>

          {/* Buyer / Seller Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, role === 'buyer' && styles.activeToggle]}
              onPress={() => setRole('buyer')}
            >
              <Text style={[styles.toggleText, role === 'buyer' && styles.activeText]}>Buyer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, role === 'seller' && styles.activeToggle]}
              onPress={() => setRole('seller')}
            >
              <Text style={[styles.toggleText, role === 'seller' && styles.activeText]}>Seller</Text>
            </TouchableOpacity>
          </View>

          {role === 'buyer' ? renderBuyerFields() : renderSellerFields()}

          {/* Terms Checkbox */}
          <View style={styles.checkboxContainer}>
            <CheckBox value={agree} onValueChange={setAgree} tintColors={{ true: '#ff9900', false: '#ccc' }} />
            <Text style={styles.checkboxLabel}>I agree to the terms and conditions</Text>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity 
            style={[styles.signupButton, isLoading && { opacity: 0.7 }]} 
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.signupButtonText}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          {/* Log In Navigation */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.replace('Login')}>
              <Text style={styles.loginHighlight}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
// Inside your Signup component:
const handleSignup = async () => {
  if (!agree) {
    alert('Please agree to the terms and conditions');
    return;
  }

  let userData = {};

  if (role === 'buyer') {
    if (!fullName || !buyerEmail || !buyerPassword || !buyerAddress || !buyerPhone) {
      alert('Please fill all fields');
      return;
    }
    userData = {
      role,
      fullName,
      email: buyerEmail,
      password: buyerPassword,
      address: buyerAddress,
      phone: buyerPhone,
    };
  } else {
    if (!sellerFullName || !sellerEmail || !sellerPassword || !shopName || !sellerAddress || !sellerPhone) {
      alert('Please fill all fields');
      return;
    }
    userData = {
      role,
      fullName: sellerFullName,
      email: sellerEmail,
      password: sellerPassword,
      shopName,
      address: sellerAddress,
      phone: sellerPhone,
    };
  }

  try {
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    alert('Account created successfully!');
    navigation.replace('Login');
  } catch (error) {
    console.error(error);
  }
}
// Reusable Input Field with Icon
const InputField = ({ placeholder, value, onChangeText, keyboardType, icon }) => (
  <View style={styles.inputContainer}>
    <Ionicons name={icon} size={20} color="#666" style={styles.inputIcon} />
    <TextInput
      style={styles.inputText}
      placeholder={placeholder}
      placeholderTextColor="#999"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType || 'default'}
    />
  </View>
);

// Reusable Password Field with Icon
const PasswordField = ({ value, onChangeText, visible, setVisible }) => (
  <View style={styles.inputContainer}>
    <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
    <TextInput
      style={styles.inputText}
      placeholder="Password"
      placeholderTextColor="#999"
      secureTextEntry={!visible}
      value={value}
      onChangeText={onChangeText}
    />
    <TouchableOpacity onPress={() => setVisible(!visible)}>
      <Ionicons name={visible ? 'eye-off' : 'eye'} size={22} color="#666" />
    </TouchableOpacity>
  </View>
);
