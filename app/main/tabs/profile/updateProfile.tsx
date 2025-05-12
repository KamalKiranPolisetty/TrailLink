import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Spacing, Radiuses } from '../../../../constants/Colors';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const BACKEND_URL = "http://192.168.4.34:5000/api";
const DEFAULT_PROFILE_IMAGE = require('../../../../assets/images/profilePic.png');
// const DEFAULT_PROFILE_IMAGE = 'https://images.unsplash.com/photo-1521566652839-697aa473761a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8cGVyc29ufGVufDB8fDB8fHww';


interface DecodedToken {
  id: string;
  name: string;
  email: string;
  username?: string;
  bio?: string;
  profileImage?: string;
}

const ProfileScreen = () => {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [newProfileImage, setNewProfileImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Function to Get User Data from JWT only
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        handleSessionExpired();
        return; // Exit the function if no token
      }

      const decoded = jwtDecode(token) as any; // Properly handle decoding with correct typing
      if (!decoded || !decoded.id) {
        throw new Error("JWT does not contain 'id'");
      }

      const response = await axios.get(`${BACKEND_URL}/profile/${decoded.id}`);
      if (response.status === 200 && response.data) {
        setUserData(response.data);
        setId(response.data.id || '');
        setName(response.data.name || '');
        setEmail(response.data.email || '');
        setUsername(response.data.username || '');
        setBio(response.data.bio || '');
        setProfileImage(response.data.profileImage || Image.resolveAssetSource(DEFAULT_PROFILE_IMAGE).uri);
      } else {
        throw new Error('Failed to fetch profile data from server');
      }
    } catch (error) {
      console.error("Error while fetching user profile:", error);
      setError("Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile();
    }, [])
  )

  // Select profile image
  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets[0].uri) {
        setNewProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error selecting image:", error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleUpdateProfile = async () => {
    try {
  
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        handleSessionExpired();
        return; // Exit the function if no token
      }

      const decoded = jwtDecode(token) as any; // Properly handle decoding with correct typing
      if (!decoded || !decoded.id) {
        throw new Error("JWT does not contain 'id'");
      }
  
  
      const updatedData = {
        name: name,
        email: email,
        username: username,
        bio: bio,
        profileImage: newProfileImage || profileImage,
      };
      
      setUpdating(true);
      setError(null);
  
      // Include the token in the Authorization header
      const response = await axios.patch(
        `${BACKEND_URL}/profile/update/${decoded.id}`,
        updatedData,
        { 
          withCredentials: true,
        }
      );
  
      if (response.data) {
        // Save the updated token so profile changes are immediately reflected
        if (response.data.token) {
          await SecureStore.setItemAsync('userToken', response.data.token);
        }
        
        setUpdating(false);
        Alert.alert(
          'Success', 
          'Your profile has been updated successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      setUpdating(false);
      console.error('Error updating profile:', error);
      
      // Handle specific error messages from the backend
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to update profile');
      }
      
      // If unauthorized, redirect to login
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        handleSessionExpired();
      }
    }
  };

  const handleSessionExpired = () => {
    Alert.alert(
      "Session Expired",
      "Your session has expired. Please log in again.",
      [{ text: "OK", onPress: () => handleLogout() }]
    );
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <MaterialIcons name="error-outline" size={50} color={Colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress} activeOpacity={0.7}>
            <MaterialIcons name="keyboard-arrow-left" size={28} color={Colors.textSecondary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: newProfileImage || profileImage }}
            style={styles.profileImage}
          />
          <TouchableOpacity 
            style={styles.changePhotoButton} 
            onPress={handleSelectImage}
            activeOpacity={0.8}
          >
            <MaterialIcons name="camera-alt" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor="#A0AEC0"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Your username"
              placeholderTextColor="#A0AEC0"
              autoCapitalize="none"
            />
            <Text style={styles.helperText}>Only letters, numbers, underscores and periods</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Your email address"
              placeholderTextColor="#A0AEC0"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor="#A0AEC0"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleUpdateProfile}
            disabled={updating}
            activeOpacity={0.8}
          >
            {updating ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    color:"#718096",
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  errorText: {
    marginTop: Spacing.md,
    color: Colors.error,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: Fonts.regular,
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: Radiuses.small,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: Spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontFamily: Fonts.regular,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    fontFamily: Fonts.regular,
  },
  placeholder: {
    width: 80, // To balance the header
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
    position: 'relative',
  },
  profileImage: {
    width: isTablet ? 180 : width * 0.35,
    height: isTablet ? 180 : width * 0.35,
    borderRadius: isTablet ? 90 : width * 0.175,
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: isTablet ? width / 2 - 90 + 15 : width / 2 - width * 0.35 / 2 + 15,
    backgroundColor:"rgba(45, 55, 72, 0.7)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  formContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radiuses.medium,
    marginHorizontal: Spacing.md,
    padding: Spacing.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: Radiuses.small,
    elevation: 2,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 16,
    color:"#2D3748",
    marginBottom: Spacing.xs,
    fontFamily: Fonts.regular,
  },
  required: {
    color: Colors.error,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radiuses.small,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: Fonts.regular,
  },
  helperText: {
    fontSize: 12,
    color: "#718096",
    marginTop: 4,
    marginLeft: 4,
    fontFamily: Fonts.regular,
  },
  bioInput: {
    height: 100,
    paddingTop: Spacing.md,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: Radiuses.small,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Fonts.regular,
  },
  
});

export default ProfileScreen;