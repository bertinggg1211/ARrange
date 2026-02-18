import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from "react-native-vector-icons/Ionicons";

// Screens
import Home from "../screens/buyer/Home";
import Search from "../screens/buyer/Search";
import Likes from "../screens/buyer/Likes";
import Order from "../screens/buyer/Order";
import Shop from "../screens/buyer/Shop";
import ChatList from "../screens/buyer/ChatList";
import Chat from "../screens/buyer/Chat";
import Checkout from "../screens/buyer/Checkout";
import ProductDetail from "../screens/buyer/ProductDetail";
import ViewProducts from "../screens/buyer/ViewProducts";
import ShopViewer from "../screens/buyer/ShopViewer";
import ShopReviews from "../screens/buyer/ShopReviews";
import ARViewer from "../AR_KIRI/ARViewer";
import KiriARViewer from "../AR_KIRI/KiriARViewer";
import AutoCaptureScanner from "../AR_KIRI/AutoCaptureScanner";
import CustomCamera from "../AR_KIRI/CustomCamera";
import TryAR from "../screens/buyer/TryAR";
import ViewAR from "../screens/buyer/ViewAR";
import BuyerProfileStackNavigator from "../navigation/BuyerProfileStackNavigator";
import Cart from "../screens/buyer/Cart";
import { useLikes } from "../context/LikesContext";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabBarButton({ label, iconName, isFocused, onPress, badgeCount }) {
  const iconColor = isFocused ? '#FF8B47' : '#FFFFFF';
  const bgColor = isFocused ? 'rgba(255, 139, 71, 0.2)' : 'rgba(255, 255, 255, 0.1)';
  return (
    <TouchableOpacity style={styles.tabButton} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.iconShape, { backgroundColor: bgColor }]}>
        <Ionicons name={isFocused ? iconName : `${iconName}-outline`} size={24} color={iconColor} />
        {badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { likes } = useLikes();
  const likesCount = Array.isArray(likes) ? likes.length : 0;
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 10 : 6);
  const containerHeight = 52 + bottomInset; // smaller core height + safe-area
  return (
    <View style={styles.tabBarWrapper}>
      <View style={[styles.tabBarContainer, { paddingBottom: bottomInset, paddingTop: 2, height: containerHeight }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          let iconName;
          if (route.name === "Home") iconName = "home";
          else if (route.name === "Likes") iconName = "heart";
          else if (route.name === "Order") iconName = "receipt";
          else if (route.name === "Chat") iconName = "chatbubble";
          else if (route.name === "Profile") iconName = "person";

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          const badgeCount = route.name === 'Likes' ? likesCount : 0;
          return (
            <TabBarButton key={route.key} label={route.name} iconName={iconName} isFocused={isFocused} onPress={onPress} badgeCount={badgeCount} />
          );
        })}
      </View>
    </View>
  );
}

function BuyerTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }} tabBar={(props) => <CustomTabBar {...props} /> }>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Likes" component={Likes} />
      <Tab.Screen name="Order" component={Order} />
      <Tab.Screen name="Chat" component={ChatList} />
      <Tab.Screen name="Profile" component={BuyerProfileStackNavigator} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    zIndex: 50,
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    height: 60,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderTopWidth: 0,
    borderTopColor: 'transparent',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
  },
  iconShape: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});

export default function BuyerNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BuyerTabs" component={BuyerTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Search" component={Search} options={{ headerShown: false }} />
      <Stack.Screen name="Shop" component={Shop} options={{ headerShown: false }} />
      <Stack.Screen name="ShopViewer" component={ShopViewer} options={{ headerShown: false }} />
      <Stack.Screen name="ShopReviews" component={ShopReviews} options={{ headerShown: false }} />
      <Stack.Screen name="ViewProducts" component={ViewProducts} options={{ headerShown: false }} />
      <Stack.Screen name="Cart" component={Cart} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={Chat} options={{ headerShown: false }} />
      <Stack.Screen name="ARViewer" component={ARViewer} options={{ headerShown: false }} />
      <Stack.Screen name="KiriARViewer" component={KiriARViewer} options={{ headerShown: false }} />
      <Stack.Screen name="TryAR" component={TryAR} options={{ headerShown: false }} />
      <Stack.Screen name="ViewAR" component={ViewAR} options={{ headerShown: false }} />
      <Stack.Screen name="AutoCaptureScanner" component={AutoCaptureScanner} options={{ headerShown: false }} />
      <Stack.Screen name="CustomCamera" component={CustomCamera} options={{ headerShown: false }} />
      <Stack.Screen name="Checkout" component={Checkout} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetail" component={ProductDetail} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
