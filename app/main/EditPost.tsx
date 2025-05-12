import React, { useState, useEffect, useCallback } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, 
  Image, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, BackHandler, Animated
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router"; 
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Colors } from "@/constants/Colors";

const BACKEND_URL = "http://192.168.4.34:5000/api";
const DEFAULT_IMAGE = "https://www.agoda.com/special-editions/responsible-travel/trekking-lightly-exploring-nature-one-step-at-a-time/";

export default function EditPost() {
  const { postId } = useLocalSearchParams();
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingPost, setFetchingPost] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [formOpacity] = useState(new Animated.Value(0));
  const [originalData, setOriginalData] = useState({
    title: "",
    location: "",
    description: "",
    image: null
  });

  // Animate form in when mounted
  useEffect(() => {
    Animated.timing(formOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch the post data when component mounts
  useEffect(() => {
    const fetchPostData = async () => {
      try {
        setFetchingPost(true);
        const response = await axios.get(`${BACKEND_URL}/posts/listPosts`);
        const posts = response.data;
        const post = posts.find((p) => p._id === postId);
        
        if (post) {
          setTitle(post.title);
          setLocation(post.location);
          setDescription(post.description);
          if (post.image) setImage(post.image);
          
          // Store original data for comparison
          setOriginalData({
            title: post.title,
            location: post.location,
            description: post.description,
            image: post.image || null
          });
        } else {
          Alert.alert("Error", "Post not found");
          router.back();
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        Alert.alert("Error", "Failed to load post data");
      } finally {
        setFetchingPost(false);
      }
    };

    if (postId) {
      fetchPostData();
    }
  }, [postId]);

  // Check if form has changes
  const hasChanges = useCallback(() => {
    return (
      title !== originalData.title ||
      location !== originalData.location ||
      description !== originalData.description ||
      image !== originalData.image
    );
  }, [title, location, description, image, originalData]);

  // Handle back button press
  const handleBackPress = useCallback(() => {
    if (isSubmitting) {
      return true; // Prevent back if submitting
    }
    
    if (hasChanges()) {
      Alert.alert(
        "Discard Changes",
        "Are you sure you want to go back? Your changes will be discarded.",
        [
          { text: "Stay", style: "cancel" },
          { 
            text: "Discard", 
            style: "destructive",
            onPress: () => router.back()
          }
        ]
      );
      return true; // Prevent default back behavior
    } else {
      // No changes, just go back
      router.back();
      return true;
    }
  }, [isSubmitting, router, hasChanges]);

  // Handle back button
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

  const handleUpdatePost = async () => {

    if (!postId || typeof postId !== "string") {
  Alert.alert("Error", "Invalid or missing post ID.");
  router.back();
  return null;
}

    // Basic validation
    if (!title.trim() || !location.trim() || !description.trim()) {
      Alert.alert("Missing Fields", "Please fill all the required fields");
      return;
    }

    // Check if there are any changes
    if (!hasChanges()) {
      Alert.alert("No Changes", "You haven't made any changes to update");
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setLoading(true);

    try {
      const response = await axios.patch(
        `${BACKEND_URL}/posts/edit/${postId}`,
        { 
          title, 
          description, 
          location, 
          image: image || DEFAULT_IMAGE 
        },
        { 
          withCredentials: true,
          timeout: 15000 // Increased timeout
        }
      );

      // Show success message
      Alert.alert(
        "Success", 
        "Your trek has been updated!",
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
            } 
          }
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Error updating post:", error);
      
      let errorMessage = "Failed to update post";
      
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
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  // Show loading indicator while fetching post data
  if (fetchingPost) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading trek data...</Text>
      </View>
    );
  }

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
          {/* Header with Back Button */}
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
                <Text style={styles.headerTitle}>Edit Trek Post</Text>
                <Text style={styles.headerSubtitle}>Update your adventure details</Text>
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
          </View>

          {/* Update Button */}
          <TouchableOpacity 
            style={[
              styles.button, 
              (loading || isSubmitting) && styles.buttonDisabled,
              !hasChanges() && styles.buttonDisabled
            ]} 
            onPress={handleUpdatePost}
            disabled={loading || isSubmitting || !hasChanges()}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.buttonText}>Updating...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#FFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Update Trek</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#718096",
    fontSize: 16,
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