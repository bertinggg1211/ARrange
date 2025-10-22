import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import styles from "./styles/MyOrders.style";

const dummyOrders = [
  {
    id: "1",
    title: "Modern Chandelier",
    status: "Delivered",
    date: "2025-09-01",
  },
  {
    id: "2",
    title: "Classic Ceiling Light",
    status: "Shipped",
    date: "2025-09-05",
  },
  {
    id: "3",
    title: "Crystal Pendant Lamp",
    status: "Processing",
    date: "2025-09-07",
  },
];

export default function MyOrders({ navigation }) {
  const renderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <Text style={styles.orderTitle}>{item.title}</Text>
      <Text style={styles.orderStatus}>Status: {item.status}</Text>
      <Text style={styles.orderDate}>Date: {item.date}</Text>

      <TouchableOpacity
        style={styles.detailsButton}
        onPress={() => console.log("Go to order details:", item.id)}
      >
        <Text style={styles.detailsText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Orders</Text>
      <FlatList
        data={dummyOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}
