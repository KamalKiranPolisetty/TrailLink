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

const BackendURL = "http://192.168.4.34:5000";
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SignupScreen = () => {
  const [name, setName] = useState('');
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

  const handleSignup = async () => {
    try {
      // Validate inputs
      if (!name.trim() || !email.trim() || !password.trim()) {
        Alert.alert("Missing Information", "Please fill in all fields.");
        return;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert("Invalid Email", "Please enter a valid email address.");
        return;
      }
      
      // Password validation (minimum 6 characters)
      if (password.length < 6) {
        Alert.alert("Weak Password", "Password must be at least 6 characters long.");
        return;
      }

      // Check if email already exists
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      Alert.alert("Email already in use", "Please use a different email address.");
      return;
    }
      
      const response = await axios.post(`${BackendURL}/api/signup`, {
        name,
        email,
        password,
      });
      
      Alert.alert(
        "Signup successful!", 
        "You can now log in with your credentials.",
        [{ text: "OK", onPress: () => router.navigate("/auth/login") }]
      );
    } catch (error: any) {
      console.error("Signup error:", error);
      const errorMessage = error.response?.data?.message || "Unknown error";
      Alert.alert("Signup failed", errorMessage);
    }
  };

  // Function to check if the email exists
const checkEmailExists = async (email: string) => {
  try {
    const response = await axios.get(`${BackendURL}/api/check-email?email=${email}`);
    return response.data.exists; // Assuming the backend returns { exists: true/false }
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
};

  return (
    <View style={styles.container}>
      {/* Platform-specific StatusBar */}
      {Platform.OS === 'ios' ? (
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      ) : (
        <StatusBar backgroundColor={Colors.textPrimary} barStyle="light-content" />
      )}
      
      {/* Image Container with Animated Height */}
      <View style={styles.imageContainer}>
        <Animated.Image 
          source={require('../../assets/images/login.jpg')} 
          style={[styles.headerImage, { height: imageHeightAnim }]} 
        />
        <View style={styles.imageOverlay} />
      </View>
      
      {/* Form Container with Platform-specific KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={styles.formOuterContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <Animated.View style={styles.formContainer}>
            <Text style={styles.title}>Create your account</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

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
              onPress={handleSignup}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.loginContainer}
              onPress={() => router.navigate('/auth/login')}
              activeOpacity={0.7}
            >
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginLink}>Log In</Text>
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
  loginContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  loginText: {
    color: Colors.textPrimary,
    fontSize: 15,
  },
  loginLink: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});

export default SignupScreen;
