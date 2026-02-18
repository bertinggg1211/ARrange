import React, { useEffect, useState, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BuyerNavigator from "./src/navigation/BuyerTabNavigator";
import SellerNavigator from "./src/navigation/SellerTabNavigator";
import { CartProvider } from "./src/context/CartContext";
import { LikesProvider } from "./src/context/LikesContext";
import { ChatProvider } from "./src/context/ChatContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import deepLinkingService from "./src/utils/deepLinking";

// Chat screens (moved to root level to hide bottom tabs)
import ChatDetail from "./src/screens/seller/ChatDetail";

// Auth screens
import Onboarding from "./src/carousel_onboarding/components/Onboarding";
import Signup from "./src/screens/auth/Signup";
import Login from "./src/screens/auth/Login";
import ForgotPassword from "./src/screens/auth/ForgotPassword";
import ResetPassword from "./src/screens/auth/ResetPassword";

const Stack = createNativeStackNavigator();

// Auth Navigator
function AuthNavigator() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const { user } = useAuth(); // Add user dependency to re-check onboarding status

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const seen = await AsyncStorage.getItem('hasSeenOnboarding');
        setHasSeenOnboarding(seen === 'true');
        console.log('🔍 AuthNavigator - hasSeenOnboarding:', seen === 'true');
      } catch (e) {
        setHasSeenOnboarding(false);
      }
    };
    checkOnboarding();
  }, [user]); // Re-check when user state changes (including logout)

  if (hasSeenOnboarding === null) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={hasSeenOnboarding ? 'Login' : 'Onboarding'}>
      <Stack.Screen name="Onboarding" component={Onboarding} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
    </Stack.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  const { user, isLoading } = useAuth();
  
  console.log('AppNavigator - isLoading:', isLoading, 'user:', user ? `${user.email} (${user.role})` : 'No user');
  
  if (isLoading) {
    // You could add a splash screen here
    return null;
  }
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : user.role === 'buyer' ? (
        <Stack.Screen name="BuyerRoot" component={BuyerNavigator} />
      ) : (
        <>
          <Stack.Screen name="SellerRoot" component={SellerNavigator} />
          <Stack.Screen 
            name="ChatDetail" 
            component={ChatDetail}
            options={{
              headerShown: false,
              presentation: 'modal', // This makes it feel like a full-screen modal
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    // Initialize deep linking
    deepLinkingService.initialize(navigationRef);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ChatProvider>
          <CartProvider>
            <LikesProvider>
              <NavigationContainer ref={navigationRef}>
                <AppNavigator />
              </NavigationContainer>
            </LikesProvider>
          </CartProvider>
        </ChatProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
