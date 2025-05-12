import React, { useRef, useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Alert, KeyboardAvoidingView, 
  Platform, Keyboard, TouchableWithoutFeedback, Dimensions, StatusBar,
  Animated, Easing
} from 'react-native';
import { useRouter } from 'expo-router'; 
import { Colors } from '../../constants/Colors';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

interface DecodedToken {
  id: string;
  name: string;
  email: string;
}

const BackendURL = "http://192.168.4.34:5000";
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter(); 
  
  // Image height animation values
  const IMAGE_HEIGHT_NO_KEYBOARD = SCREEN_HEIGHT * 0.6;
  const IMAGE_HEIGHT_KEYBOARD = SCREEN_HEIGHT * 0.35;
  const imageHeightAnim = useRef(new Animated.Value(IMAGE_HEIGHT_NO_KEYBOARD)).current;
  const isKeyboardVisible = useRef(false);
  
  useEffect(() => {
    // Platform-specific keyboard listeners
    const keyboardWillShow = Platform.OS === 'ios' 
      ? Keyboard.addListener('keyboardWillShow', keyboardShow)
      : Keyboard.addListener('keyboardDidShow', keyboardShow);
    
    const keyboardWillHide = Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardWillHide', keyboardHide)
      : Keyboard.addListener('keyboardDidHide', keyboardHide);

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Smooth animation for keyboard showing
  const keyboardShow = (event: { duration: any; }) => {
    if (!isKeyboardVisible.current) {
      isKeyboardVisible.current = true;
      
      // Get keyboard animation duration from event (iOS only)
      const duration = Platform.OS === 'ios' ? event.duration : 250;
      
      Animated.timing(imageHeightAnim, {
        toValue: IMAGE_HEIGHT_KEYBOARD,
        duration: duration,
        easing: Easing.bezier(0.17, 0.59, 0.4, 0.77),
        useNativeDriver: false
      }).start();
    }
  };

  // Smooth animation for keyboard hiding
  const keyboardHide = (event: { duration: any; }) => {
    if (isKeyboardVisible.current) {
      isKeyboardVisible.current = false;
      
      // Get keyboard animation duration from event (iOS only)
      const duration = Platform.OS === 'ios' ? event.duration : 250;
      
      Animated.timing(imageHeightAnim, {
        toValue: IMAGE_HEIGHT_NO_KEYBOARD,
        duration: duration,
        easing: Easing.bezier(0.17, 0.59, 0.4, 0.77),
        useNativeDriver: false
      }).start();
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleLogin = async () => {
    try {
      // Validate inputs
      if (!email.trim() || !password.trim()) {
        Alert.alert("Missing Information", "Please fill in all fields.");
        return;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert("Invalid Email", "Please enter a valid email address.");
        return;
      }
      
      const response = await axios.post(`${BackendURL}/api/login`, {
        email,
        password,
      }, { withCredentials: true });
  
      if (response.data.sessionSet) {
        // ✅ Retrieve token from response body
        const token = response.data.token;
  
        if (token) {
          // ✅ Ensure token is valid before decoding
          if (token.split(".").length !== 3) {
            throw new Error("Invalid JWT format received.");
          }
  
          // ✅ Decode JWT
          const decoded = jwtDecode<DecodedToken>(token);
          console.log("Decoded User:", decoded);
  
          // ✅ Store JWT securely
          await SecureStore.setItemAsync("userToken", token);
          
          Alert.alert("Login successful!", "You are now logged in.");
          // Use replace instead of navigate to prevent back navigation
          router.replace("/main/tabs/explore");
        } else {
          throw new Error("JWT not found in response.");
        }
      } else {
        throw new Error("Session was not established.");
      }
    } catch (error: unknown) {
      //console.error("Login error:", error);
  
      let errorMessage = "Unknown error";
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
  
      Alert.alert("Login failed", errorMessage);
    }
  };

  // Handle back button press
  const handleBackPress = () => {
    // Use replace to prevent navigation stack buildup
    router.replace("/auth/welcome");
  };

  return (
    <View style={styles.container}>
      {/* Unified StatusBar for both platforms */}
      <StatusBar 
        translucent={true}
        backgroundColor="transparent" 
        barStyle="light-content" 
      />
      
      {/* Image Container with Animated Height */}
      <View style={styles.imageContainer}>
        <Animated.Image 
          source={require('../../assets/images/login.jpg')} 
          style={[styles.headerImage, { height: imageHeightAnim }]} 
        />
        <View style={styles.imageOverlay} />
        
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>
      
      {/* Form Container with Platform-specific KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={styles.formOuterContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <Animated.View style={styles.formContainer}>
            <Text style={styles.title}>Sign in to your account</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity 
              style={styles.button} 
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Log In</Text>
            </TouchableOpacity>

            <View style={styles.linkContainer}>
              <TouchableOpacity 
                onPress={() => router.replace('/auth/forgotPass')}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPassText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.signupContainer}
              onPress={() => router.replace('/auth/signup')}
              activeOpacity={0.7}
            >
              <Text style={styles.signupText}>
                Don't have an account? <Text style={styles.signupLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  headerImage: {
    width: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  formOuterContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  formContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    // Platform-specific shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  title: {
    fontSize: 26,
    marginBottom: 20,
    color: Colors.textPrimary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 16,
    backgroundColor: Colors.textPrimary, 
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16, 
    color: Colors.white,
  },
  button: {
    width: '100%',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkContainer: {
    alignSelf: 'flex-end',
    marginVertical: 10,
  },
  forgotPassText: {
    color: Colors.primary,
    fontSize: 15,
  },
  signupContainer: {
    marginTop: 5,
    alignItems: 'center',
  },
  signupText: {
    color: Colors.textPrimary,
    fontSize: 15,
  },
  signupLink: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
