import React, { useState } from "react";
import { View, Text, Switch, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from "react-native-vector-icons/Ionicons";
import styles from "./styles/Settings.style";
import { useAuth } from "../../context/AuthContext";

export default function Settings({ navigation }) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometricLogin, setBiometricLogin] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [savePaymentInfo, setSavePaymentInfo] = useState(false);
  const [language, setLanguage] = useState("English");
  
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              // Navigation will be handled by the AppNavigator in App.tsx
              // which will redirect to Auth screens when user is null
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          } 
        },
      ]
    );
  };

  const handleLanguageChange = () => {
    Alert.alert(
      "Select Language",
      "Choose your preferred language",
      [
        { text: "English", onPress: () => setLanguage("English") },
        { text: "Filipino", onPress: () => setLanguage("Filipino") },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
    <ScrollView>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Icon name="person-circle-outline" size={20} color="#333" /> Account
        </Text>
        
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Text style={styles.settingText}>Edit Profile</Text>
          <Icon name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingText}>Change Password</Text>
          <Icon name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={handleLanguageChange}
        >
          <Text style={styles.settingText}>Language</Text>
          <View style={styles.settingValue}>
            <Text style={styles.settingValueText}>{language}</Text>
            <Icon name="chevron-forward" size={20} color="#999" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Icon name="options-outline" size={20} color="#333" /> Preferences
        </Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingText}>Notifications</Text>
            <Text style={styles.settingDescription}>Receive order updates and promotions</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={(val) => setNotifications(val)}
            trackColor={{ false: "#d1d1d1", true: "#4CAF50" }}
            thumbColor={notifications ? "#fff" : "#f4f3f4"}
          />
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingText}>Dark Mode</Text>
            <Text style={styles.settingDescription}>Use dark theme throughout the app</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={(val) => setDarkMode(val)}
            trackColor={{ false: "#d1d1d1", true: "#4CAF50" }}
            thumbColor={darkMode ? "#fff" : "#f4f3f4"}
          />
        </View>
      </View>

      {/* Privacy & Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Icon name="shield-checkmark-outline" size={20} color="#333" /> Privacy & Security
        </Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingText}>Biometric Login</Text>
            <Text style={styles.settingDescription}>Use fingerprint or face ID to login</Text>
          </View>
          <Switch
            value={biometricLogin}
            onValueChange={(val) => setBiometricLogin(val)}
            trackColor={{ false: "#d1d1d1", true: "#4CAF50" }}
            thumbColor={biometricLogin ? "#fff" : "#f4f3f4"}
          />
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingText}>Location Services</Text>
            <Text style={styles.settingDescription}>Allow app to access your location</Text>
          </View>
          <Switch
            value={locationServices}
            onValueChange={(val) => setLocationServices(val)}
            trackColor={{ false: "#d1d1d1", true: "#4CAF50" }}
            thumbColor={locationServices ? "#fff" : "#f4f3f4"}
          />
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingText}>Save Payment Info</Text>
            <Text style={styles.settingDescription}>Securely store payment methods</Text>
          </View>
          <Switch
            value={savePaymentInfo}
            onValueChange={(val) => setSavePaymentInfo(val)}
            trackColor={{ false: "#d1d1d1", true: "#4CAF50" }}
            thumbColor={savePaymentInfo ? "#fff" : "#f4f3f4"}
          />
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Icon name="information-circle-outline" size={20} color="#333" /> About
        </Text>
        
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingText}>Terms of Service</Text>
          <Icon name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingText}>Privacy Policy</Text>
          <Icon name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingText}>App Version</Text>
          <Text style={styles.versionText}>1.0.0</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Icon name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}
