import React, { useEffect } from "react";
import { 
  View, 
  Text, 
  ImageBackground, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Dimensions,
  StatusBar,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Fonts, Spacing } from "../../constants/Colors";

const { height, width } = Dimensions.get("screen");

const WelcomeScreen = () => {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("jwt");
      if (token) {
        router.replace("/main/tabs/explore");
      }
    };
    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      {/* Platform-specific StatusBar */}
      <StatusBar 
        translucent={true}
        backgroundColor="transparent" 
        barStyle="light-content" 
      />
      
      <ImageBackground 
        source={require("../../assets/images/trekk.jpg")} 
        resizeMode="cover" 
        style={styles.backgroundImage}
      >
        {/* SafeAreaView with padding for status bar on Android */}
        <SafeAreaView style={[
          styles.fullScreen,
          { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }
        ]}>
          <View style={styles.overlay}>
            <View style={{ flex: 1 }}></View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>TrailLink!</Text>
              <Text style={styles.subtitle}>
                Connect, Plan, and Trek Together! Discover new trails, make friends, and explore nature safely.
              </Text>
            </View>
            <View style={{ flex: 1 }}></View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.button} 
                onPress={() => router.push("/auth/login")}
              >
                <Text style={styles.buttonText}>Getting Started</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => router.push("/auth/login")}
                style={styles.loginButtonContainer}
              >
                <Text style={styles.loginText}>
                  Already have an account? <Text style={styles.loginLink}>Login</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Prevents white flash when loading
  },
  fullScreen: {
    flex: 1,
    width: width,
    height: height,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: Spacing.lg,
    justifyContent: "space-between",
  },
  textContainer: {
    alignItems: "center",
    padding: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.regular,
    color: Colors.white,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontFamily: Fonts.default,
    color: Colors.white,
    textAlign: "center",
  },
  buttonContainer: {
    alignItems: "center",
    paddingBottom: Spacing.md,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  loginButtonContainer: {
    marginTop: 12,
    paddingVertical: 8,
  },
  loginText: {
    fontSize: 16,
    color: Colors.white,
    textAlign: "center",
  },
  loginLink: {
    color: Colors.link,
    fontWeight: "bold",
  },
});

export default WelcomeScreen;
