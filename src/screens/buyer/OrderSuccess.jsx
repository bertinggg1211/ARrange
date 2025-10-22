import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, Image, Animated } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import styles from "./styles/OrderSuccess.style";

export default function OrderSuccess({ navigation }) {
  // Animation value for success checkmark
  const scaleAnim = new Animated.Value(0);
  
  useEffect(() => {
    // Start animation when component mounts
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{
        transform: [{ scale: scaleAnim }],
        alignItems: 'center',
      }}>
        <View style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: '#4CAF50',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 20,
        }}>
          <Icon name="checkmark" size={60} color="#fff" />
        </View>
      </Animated.View>
      
      <Text style={styles.title}>Order Placed Successfully!</Text>
      
      <Text style={styles.message}>
        Thank you for your purchase! Your order has been received and is being processed.
        You will receive a confirmation email shortly.
      </Text>
      
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate("MyOrders")}
      >
        <Text style={styles.btnText}>View My Orders</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.homeBtn}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.homeBtnText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );
}
