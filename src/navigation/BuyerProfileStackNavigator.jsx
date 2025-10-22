import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Buyer screens
import Profile from "../screens/buyer/Profile";
import EditProfile from "../screens/buyer/EditProfile";
import Settings from "../screens/buyer/Settings";
import MyOrders from "../screens/buyer/MyOrders";

const Stack = createNativeStackNavigator();

export default function BuyerProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileScreen" component={Profile} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="MyOrders" component={MyOrders} />
    </Stack.Navigator>
  );
}


