import React from "react";
import { View, Text, StyleSheet } from "react-native";
import * as Progress from "react-native-progress";

const WaterProgress = ({ current, goal }) => {
  const progress = Math.min(current / goal, 1);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Water Intake Progress</Text>
      <Progress.Bar
        progress={progress}
        width={null}
        height={15}
        borderRadius={10}
        color="#00bfff"
        unfilledColor="#e0e0e0"
        borderWidth={0}
      />
      <Text style={styles.text}>
        {current} ml / {goal} ml
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "bold",
  },
  text: {
    textAlign: "center",
    marginTop: 10,
    fontWeight: "500",
  },
});

export default WaterProgress;
