import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import Profile from "../screens/seller/Profile";
import EditProfileInfo from "../screens/seller/EditshopInfo";
import ProfileEdit from "../screens/seller/ProfileEdit";
import Settings from "../screens/seller/Settings";

const Stack = createNativeStackNavigator();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileScreen" component={Profile} />
      <Stack.Screen name="EditProfileInfo" component={EditProfileInfo} />
      <Stack.Screen name="ProfileEdit" component={ProfileEdit} />
      <Stack.Screen name="Settings" component={Settings} />
    </Stack.Navigator>
  );
}
