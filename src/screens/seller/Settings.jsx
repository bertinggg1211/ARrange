import React, { useState } from "react";
import { View, Text, Switch, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { useAuth } from "../../context/AuthContext";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Using similar styles as buyer Settings
const styles = {
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#333",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingTextContainer: {
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: "#333",
  },
  settingDescription: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    marginLeft: 16,
  },
  logoutButton: {
    backgroundColor: "#fff",
    marginTop: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  logoutText: {
    color: "#ff3b30",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
};

export default function Settings({ navigation }) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
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

      {/* Shop Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Icon name="storefront-outline" size={20} color="#333" /> Shop Settings
        </Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="business-outline" size={22} color="#333" />
          <Text style={styles.menuText}>Shop Information</Text>
          <Icon name="chevron-forward-outline" size={20} color="#999" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="card-outline" size={22} color="#333" />
          <Text style={styles.menuText}>Payment Methods</Text>
          <Icon name="chevron-forward-outline" size={20} color="#999" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="cube-outline" size={22} color="#333" />
          <Text style={styles.menuText}>Shipping Options</Text>
          <Icon name="chevron-forward-outline" size={20} color="#999" />
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
            <Text style={styles.settingDescription}>Receive order updates and customer messages</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: "#d1d1d6", true: "#4cd964" }}
          />
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingText}>Dark Mode</Text>
            <Text style={styles.settingDescription}>Use dark theme</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: "#d1d1d6", true: "#4cd964" }}
          />
        </View>
        
        <TouchableOpacity style={styles.settingRow} onPress={handleLanguageChange}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingText}>Language</Text>
            <Text style={styles.settingDescription}>Current: {language}</Text>
          </View>
          <Icon name="chevron-forward-outline" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Icon name="person-outline" size={20} color="#333" /> Account
        </Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="shield-checkmark-outline" size={22} color="#333" />
          <Text style={styles.menuText}>Privacy & Security</Text>
          <Icon name="chevron-forward-outline" size={20} color="#999" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="help-circle-outline" size={22} color="#333" />
          <Text style={styles.menuText}>Help & Support</Text>
          <Icon name="chevron-forward-outline" size={20} color="#999" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="information-circle-outline" size={22} color="#333" />
          <Text style={styles.menuText}>About</Text>
          <Icon name="chevron-forward-outline" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      
      {/* Bottom padding */}
      <View style={{ height: 40 }} />
    </ScrollView>
    </SafeAreaView>
  );
}