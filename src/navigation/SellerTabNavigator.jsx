import React, { useState, useRef, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, View, Text, Animated, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

// Screens
import Home from "../screens/seller/Home";
import UploadItem from "../screens/seller/UploadItem";
import Orders from "../screens/seller/Orders";
import Chat from "../screens/seller/Chat";
// ChatDetail moved to root level in App.tsx to hide bottom tabs
import ProductDetail from "../screens/seller/ProductDetail";
import EditProducts from "../screens/seller/EditProducts";
import EditProfileInfo from "../screens/seller/EditshopInfo";
// AR Scanners
import KiriEngineScanner from "../AR_KIRI/KiriEngineScanner";
import TripoScanner from "../AR_KIRI/TripoScanner";
import AutoCaptureScanner from "../AR_KIRI/AutoCaptureScanner";
import CustomCamera from "../AR_KIRI/CustomCamera";
import PhotoViewer from "../AR_KIRI/PhotoViewer";
import KiriEngineTest from "../AR_KIRI/KiriEngineTest";
import ARViewer from "../AR_KIRI/ARViewer";
import KiriARViewer from "../AR_KIRI/KiriARViewer";
import ProfileStackNavigator from "./ProfileStackNavigator";
import Settings from "../screens/seller/Settings";
import Notifications from "../screens/seller/Notifications";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Home Stack
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={Home} />
      <Stack.Screen name="ProductDetail" component={ProductDetail} />
      <Stack.Screen name="EditProducts" component={EditProducts} />
      <Stack.Screen name="EditProfileInfo" component={EditProfileInfo} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="KiriEngineScanner" component={KiriEngineScanner} />
      <Stack.Screen name="TripoScanner" component={TripoScanner} />
      <Stack.Screen name="AutoCaptureScanner" component={AutoCaptureScanner} options={{ headerShown: false }} />
      <Stack.Screen name="CustomCamera" component={CustomCamera} options={{ headerShown: false }} />
      <Stack.Screen name="PhotoViewer" component={PhotoViewer} options={{ headerShown: false }} />
      <Stack.Screen name="ARViewer" component={ARViewer} options={{ headerShown: false }} />
      <Stack.Screen name="KiriARViewer" component={KiriARViewer} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// Chat Stack
function ChatStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatScreen" component={Chat} />
      {/* ChatDetail moved to root level in App.tsx to hide bottom tabs */}
    </Stack.Navigator>
  );
}

// Orders Stack
function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersScreen" component={Orders} />
    </Stack.Navigator>
  );
}

// Upload Stack
function UploadStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UploadScreen" component={UploadItem} />
      <Stack.Screen name="KiriEngineScanner" component={KiriEngineScanner} />
      <Stack.Screen name="TripoScanner" component={TripoScanner} />
      <Stack.Screen name="AutoCaptureScanner" component={AutoCaptureScanner} options={{ headerShown: false }} />
      <Stack.Screen name="CustomCamera" component={CustomCamera} options={{ headerShown: false }} />
      <Stack.Screen name="PhotoViewer" component={PhotoViewer} options={{ headerShown: false }} />
      <Stack.Screen name="KiriEngineTest" component={KiriEngineTest} />
      <Stack.Screen name="ARViewer" component={ARViewer} options={{ headerShown: false }} />
      <Stack.Screen name="KiriARViewer" component={KiriARViewer} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// Custom Tab Bar Button Component
function TabBarButton({ label, iconName, isFocused, onPress }) {
  const [showLabel, setShowLabel] = useState(false);
  const labelAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showLabel) {
      Animated.parallel([
        Animated.timing(labelAnimation, {
          toValue: 1,
          duration: 100, // Faster animation (was 200)
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnimation, {
            toValue: 1.2,
            duration: 50, // Faster animation (was 100)
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnimation, {
            toValue: 1,
            duration: 50, // Faster animation (was 100)
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      Animated.timing(labelAnimation, {
        toValue: 0,
        duration: 100, // Faster animation (was 200)
        useNativeDriver: true,
      }).start();
    }
  }, [showLabel, labelAnimation, scaleAnimation]);

  const handlePress = () => {
    setShowLabel(true);
    onPress();
    // Hide the label after 1 second (was 2 seconds)
    setTimeout(() => setShowLabel(false), 1000);
  };

  const color = isFocused ? "#FF8B47" : "#FFFFFF";

  return (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, isFocused && styles.activeIconContainer]}>
        <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
          <Ionicons name={isFocused ? iconName : `${iconName}-outline`} size={24} color={color} />
        </Animated.View>
      </View>
      
      <Animated.View
        style={[
          styles.labelContainer,
          {
            opacity: labelAnimation,
            transform: [
              { translateY: labelAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0]
                })
              }
            ]
          }
        ]}
      >
        <Text style={[styles.label, { color }]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// Custom Tab Bar Component
function CustomTabBar({ state, descriptors, navigation }) {
  const [isTabBarVisible, setIsTabBarVisible] = React.useState(true);
  
  // Listen for navigation state changes to hide/show tab bar
  React.useEffect(() => {
    // Check initial state immediately
    const checkInitialState = () => {
      const currentState = navigation.getState();
      const currentRoute = currentState?.routes[currentState?.index];
      const routeName = currentRoute?.name;
      
      let activeRouteName = routeName;
      if (currentRoute?.state && currentRoute.state.routes && currentRoute.state.routes.length > 0) {
        const nestedState = currentRoute.state;
        const nestedRoute = nestedState.routes[nestedState.index];
        activeRouteName = nestedRoute?.name;
        console.log('🎯 Initial - Found nested route:', activeRouteName);
      } else {
        console.log('🎯 Initial - No nested state found, using tab route:', routeName);
        // If no nested state, check if this tab route should hide the bar
        if (routeName === 'Upload') {
          activeRouteName = 'UploadScreen'; // Default to UploadScreen for Upload tab
        }
      }
      
      console.log('🎯 Initial check - Current route:', routeName);
      console.log('🎯 Initial check - Active route:', activeRouteName);
      
      const hideTabBarScreens = ['UploadScreen', 'AutoCaptureScanner', 'CustomCamera', 'KiriEngineScanner', 'TripoScanner', 'PhotoViewer'];
      const shouldHideTabBar = hideTabBarScreens.includes(activeRouteName);
      
      console.log('🎯 Initial check - Should hide tab bar:', shouldHideTabBar);
      setIsTabBarVisible(!shouldHideTabBar);
    };
    
    // Check immediately
    checkInitialState();
    
    const unsubscribe = navigation.addListener('state', (e) => {
      // Get the current route name from navigation state
      const currentState = navigation.getState();
      const currentRoute = currentState?.routes[currentState?.index];
      const routeName = currentRoute?.name;
      
      // For stack navigators, get the active route within the stack
      let activeRouteName = routeName;
      if (currentRoute?.state && currentRoute.state.routes && currentRoute.state.routes.length > 0) {
        const nestedState = currentRoute.state;
        const nestedRoute = nestedState.routes[nestedState.index];
        activeRouteName = nestedRoute?.name;
        console.log('🎯 Found nested route:', activeRouteName);
      } else {
        console.log('🎯 No nested state found, using tab route:', routeName);
        // If no nested state, check if this tab route should hide the bar
        if (routeName === 'Upload') {
          activeRouteName = 'UploadScreen'; // Default to UploadScreen for Upload tab
        }
      }
      
      console.log('🎯 Current route:', routeName);
      console.log('🎯 Active route:', activeRouteName);
      
      // Hide tab bar for specific screens
      const hideTabBarScreens = ['UploadScreen', 'AutoCaptureScanner', 'CustomCamera', 'KiriEngineScanner', 'TripoScanner', 'PhotoViewer'];
      const shouldHideTabBar = hideTabBarScreens.includes(activeRouteName);
      
      console.log('🎯 Should hide tab bar:', shouldHideTabBar);
      console.log('🎯 Hide screens list:', hideTabBarScreens);
      console.log('🎯 Active route matches:', activeRouteName, 'in', hideTabBarScreens);
      
      setIsTabBarVisible(!shouldHideTabBar);
    });
    
    return unsubscribe;
  }, [navigation]);
  
  // Don't render tab bar if it should be hidden
  if (!isTabBarVisible) {
    console.log('🎯 Tab bar hidden');
    return null;
  }
  
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = route.name;
        const isFocused = state.index === index;

        let iconName;
        if (route.name === "Home") {
          iconName = "home";
        } else if (route.name === "Upload") {
          iconName = "add-circle";
        } else if (route.name === "Orders") {
          iconName = "list";
        } else if (route.name === "Chat") {
          iconName = "chatbubble";
        } else if (route.name === "Profile") {
          iconName = "person";
        }

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabBarButton
            key={index}
            label={label}
            iconName={iconName}
            isFocused={isFocused}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

// Main Tab Navigator
export default function SellerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersStack}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "list" : "list-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Upload" 
        component={UploadStack}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "add-circle" : "add-circle-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatStack}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "chatbubble" : "chatbubble-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}


// Styles for the custom tab bar
const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    height: Platform.OS === 'android' ? 85 : 90,
    paddingBottom: Platform.OS === 'android' ? 20 : 25,
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeIconContainer: {
    backgroundColor: 'rgba(255, 139, 71, 0.2)',
  },
  labelContainer: {
    position: 'absolute',
    top: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});