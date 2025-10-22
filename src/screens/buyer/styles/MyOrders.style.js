import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  list: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  orderStatus: {
    fontSize: 14,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  detailsButton: {
    alignSelf: "flex-start",
    backgroundColor: "#007bff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  detailsText: {
    color: "#fff",
    fontWeight: "600",
  },
});
