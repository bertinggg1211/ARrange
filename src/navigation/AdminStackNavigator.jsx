import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Admin screens
import AdminTabNavigator from './AdminTabNavigator';
import UserManagement from '../screens/admin/UserManagement';
import OrderManagement from '../screens/admin/OrderManagement';
import ProductManagement from '../screens/admin/ProductManagement';

const Stack = createStackNavigator();

export default function AdminStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
      <Stack.Screen name="UserManagement" component={UserManagement} />
      <Stack.Screen name="OrderManagement" component={OrderManagement} />
      <Stack.Screen name="ProductManagement" component={ProductManagement} />
    </Stack.Navigator>
  );
}
