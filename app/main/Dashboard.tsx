import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Link } from "expo-router";

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the Dashboard</Text>

      <Link href="../screens/Profile" style={styles.button}>
        <Text style={styles.buttonText}>Go to Profile</Text>
      </Link>

      <Link href="../screens/Settings" style={styles.button}>
        <Text style={styles.buttonText}>Go to Settings</Text>
      </Link>

      <Link href="../screens/About" style={styles.button}>
        <Text style={styles.buttonText}>Go to About</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
