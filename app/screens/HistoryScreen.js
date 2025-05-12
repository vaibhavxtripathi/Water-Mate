import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

const sampleHistory = [
  { id: "1", date: "Apr 7", amount: 2000 },
  { id: "2", date: "Apr 6", amount: 2700 },
  { id: "3", date: "Apr 5", amount: 3100 },
];

export default function HistoryScreen({ navigation }) {
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.waterIcon}>💧</Text>
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.date}>{item.date}</Text>
          <Text style={styles.amount}>{item.amount} ml</Text>
        </View>
      </View>
      <TouchableOpacity>
        <Text style={styles.arrowIcon}>›</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hydration History</Text>
      <FlatList
        data={sampleHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E0F7FA",
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#023E8A",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  date: {
    fontSize: 18,
    fontWeight: "500",
    color: "#0077B6",
  },
  amount: {
    fontSize: 14,
    color: "#48CAE4",
  },
  waterIcon: {
    fontSize: 28,
    color: "#00B4D8",
  },
  arrowIcon: {
    fontSize: 24,
    color: "#0077B6",
  },
});
