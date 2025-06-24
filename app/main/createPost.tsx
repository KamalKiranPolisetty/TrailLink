import React, { useState, useEffect, useCallback } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, 
  Image, SafeAreaView, ScrollView, Dimensions, KeyboardAvoidingView, Platform,
  ActivityIndicator, BackHandler, Animated
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Colors } from "@/constants/Colors";

const BACKEND_URL = "http://192.168.4.34:5000/api";
const DEFAULT_IMAGE = "https://www.agoda.com/special-editions/responsible-travel/trekking-lightly-exploring-nature-one-step-at-a-time/";
const { width } = Dimensions.get("window");

export default function CreatePostScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [formOpacity] = useState(new Animated.Value(0));
  const [eventDate, setEventDate] = useState<Date | null>(null);
const [showDatePicker, setShowDatePicker] = useState(false);

  
  const router = useRouter();

  // Animate form in when mounted
  useEffect(() => {
    Animated.timing(formOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Clear form function with animation
  const resetForm = useCallback((navigateBack = false) => {
    // Animate form out
    Animated.timing(formOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      // Reset state after animation completes
      setTitle("");
      setDescription("");
      setLocation("");
      setImage(null);
      setLoading(false);
      setIsSubmitting(false);
      
      // Navigate back if requested
      if (navigateBack) {
        router.back();
      } else {
        // Animate back in if we're staying on this screen
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [router, formOpacity]);

  // Handle back button press
  const handleBackPress = useCallback(() => {
    if (isSubmitting) {
      return true; // Prevent back if submitting
    }
    
    // Check if form has any data
    const hasFormData = title.length > 0 || description.length > 0 || location.length > 0 || image !== null;
    
    if (hasFormData) {
      Alert.alert(
        "Discard Changes",
        "Are you sure you want to go back? Your trek post will be discarded.",
        [
          { text: "Stay", style: "cancel" },
          { 
            text: "Discard", 
            style: "destructive",
            onPress: () => resetForm(true)
          }
        ]
      );
      return true; // Prevent default back behavior
    } else {
      // No data to save, just go back
      resetForm(true);
      return true;
    }
  }, [title, description, location, image, isSubmitting, resetForm]);

  // Reset form when screen comes into focus and handle back button
  useFocusEffect(
    useCallback(() => {
      // Animate form in when screen gets focus
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Set up back handler
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        handleBackPress
      );
      
      return () => backHandler.remove();
    }, [handleBackPress, formOpacity])
  );

  // Get current location
  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        setLocationLoading(false);
        return;
      }

      // Use lower accuracy for faster response
      const locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
        timeInterval: 5000 // Reduce time interval
      });
      
      const { latitude, longitude } = locationData.coords;

      // Use reverse geocoding to get location name
      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (geocode && geocode.length > 0) {
        const { city, region, country } = geocode[0];
        const locationString = [city, region, country]
          .filter(Boolean)
          .join(", ");
        
        setLocation(locationString);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Location Error', 'Could not get your current location');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7, // Reduced quality to improve performance
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Image Error', 'Failed to select image');
    }
  };

  const handleCreatePost = async () => {
    if (!title || !description || !location || !eventDate) {
      Alert.alert("Missing Fields", "Please fill all the required fields including event date");
      return;
    }
    

    // Prevent multiple submissions
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setLoading(true);
    
    try {
      const postData = {
        title,
        description,
        location,
        image: image || DEFAULT_IMAGE,
        eventDate,
      };
      

      const response = await axios.post(`${BACKEND_URL}/posts/createPost`, postData, { 
        withCredentials: true,
        timeout: 15000 // Increased timeout a bit
      });
      
      // Show success message but don't reset form immediately
      Alert.alert(
        "Success", 
        "Your trek post has been created!",
        [
          { 
            text: "OK", 
            onPress: () => {
              // Animate out first, then navigate
              Animated.timing(formOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => {
                router.replace("/main/tabs/explore");
              });
              
              // Reset form data in background
              setTimeout(() => {
                resetForm();
              }, 300);
            } 
          }
        ],
        { cancelable: false }
      );
      
    } catch (error) {
      console.error("Create post error:", error);
      
      let errorMessage = "Failed to create post";

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = "Connection timeout. Please try again.";
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <Animated.ScrollView 
          style={{ opacity: formOpacity }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }} // Add padding to avoid tab bar
        >
          {/* Header with Back Button (like in ChatsScreen) */}
          <View style={styles.headerContainer}>
            <View style={styles.headerWithBackContainer}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleBackPress}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#2D3748" />
              </TouchableOpacity>
              <View>
                <Text style={styles.headerTitle}>Create Trek Post</Text>
                <Text style={styles.headerSubtitle}>Share your adventure with the community</Text>
              </View>
            </View>
          </View>

          {/* Image Upload Section */}
          <View style={styles.imageContainer}>
            <TouchableOpacity onPress={handleImagePicker} disabled={isSubmitting}>
              {image ? (
                <Image 
                  source={{ uri: image }} 
                  style={styles.imagePreview} 
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={50} color="#A0AEC0" />
                  <Text style={styles.placeholderText}>Add Cover Photo</Text>
                </View>
              )}
              <View style={styles.imageOverlay}>
                <Ionicons name="camera" size={22} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Trek Title</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="flag-outline" size={20} color="#4A5568" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="What's the name of your trek?" 
                  placeholderTextColor="#A0AEC0"
                  value={title} 
                  onChangeText={setTitle} 
                  maxLength={50}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.locationInputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="location-outline" size={20} color="#4A5568" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Where did you trek?" 
                    placeholderTextColor="#A0AEC0"
                    value={location} 
                    onChangeText={setLocation}
                    editable={!isSubmitting}
                  />
                  {location.length > 0 && !isSubmitting && (
                    <TouchableOpacity 
                      style={styles.clearButton} 
                      onPress={() => setLocation("")}
                    >
                      <Ionicons name="close-circle" size={20} color={Colors.secondary} />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity 
                  style={[
                    styles.currentLocationButton,
                    locationLoading && styles.buttonDisabled
                  ]}
                  onPress={getCurrentLocation}
                  disabled={locationLoading || isSubmitting}
                >
                  {locationLoading ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <>
                      <Ionicons name="navigate" size={18} color={Colors.primary} />
                      <Text style={styles.currentLocationText}>Current</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <View style={styles.textareaWrapper}>
                <TextInput 
                  style={styles.textarea} 
                  placeholder="Share details about your trek experience..." 
                  placeholderTextColor="#A0AEC0"
                  value={description} 
                  onChangeText={setDescription} 
                  multiline 
                  numberOfLines={6}
                  textAlignVertical="top"
                  editable={!isSubmitting}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.inputWrapper}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={20} color="#4A5568" style={styles.inputIcon} />
                <Text style={[styles.input, { color: eventDate ? "#2D3748" : "#A0AEC0" }]}>
                  {eventDate ? eventDate.toDateString() : "Select event date"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
  <View style={{ borderRadius: 10, padding: 10 }}>
    <DateTimePicker
      value={eventDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)}
      mode="date"
      display={Platform.OS === "ios" ? "inline" : "default"}
      minimumDate={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)}
      themeVariant="light"
      onChange={(event, selectedDate) => {
        if (Platform.OS === "android") {
          setShowDatePicker(false); // ✅ Hide the picker on Android after selection
        }
      
        if (selectedDate) {
          setEventDate(selectedDate);
        }
      
        // On iOS, keep it open if user tapped outside — don't force-close
        if (Platform.OS === "ios" && event.type === "set") {
          setShowDatePicker(false);
        }
      }}
      
    />
  </View>
)}

            </View>
          </View>


          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.button, (loading || isSubmitting) && styles.buttonDisabled]} 
            onPress={handleCreatePost}
            disabled={loading || isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.buttonText}>Publishing...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="send" size={20} color="#FFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Publish Trek</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F7FAFC",
    paddingBottom: 60, // Add padding to account for tab bar
  },
  headerContainer: {
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerWithBackContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: "#EDF2F7",
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#2D3748",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#718096",
    marginTop: 2,
  },
  imageContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    backgroundColor: "#EDF2F7",
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    backgroundColor: "#EDF2F7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  placeholderText: {
    marginTop: 8,
    color: "#718096",
    fontSize: 16,
  },
  imageOverlay: {
    position: "absolute",
    right: 15,
    bottom: 15,
    backgroundColor: "rgba(45, 55, 72, 0.7)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: { 
    fontSize: 16, 
    fontWeight: "600", 
    marginBottom: 8,
    color: "#2D3748",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    flex: 1,
  },
  locationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputIcon: {
    paddingLeft: 15,
  },
  input: { 
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: "#2D3748",
  },
  clearButton: {
    padding: 10,
  },
  currentLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#EBF8FF",
    minWidth: 80,
    height: 40,
  },
  currentLocationText: {
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: "500",
  },
  textareaWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  textarea: {
    padding: 15,
    fontSize: 16,
    color: "#2D3748",
    minHeight: 120,
  },
  button: { 
    backgroundColor: Colors.primary, 
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 16, 
    borderRadius: 12, 
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: Colors.secondary,
    opacity: 0.8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: { 
    color: "#FFF", 
    fontSize: 18, 
    fontWeight: "600",
    marginLeft: 8,
  },
});
