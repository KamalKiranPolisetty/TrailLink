import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors, Fonts, Spacing, Radiuses } from "../../../../constants/Colors";
import { useRouter } from "expo-router";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "@react-navigation/native";
import { jwtDecode } from "jwt-decode";

const { width } = Dimensions.get("window");
const isTablet = width >= 768; // Basic threshold for tablet dimensions
const BACKEND_URL = "http://192.168.4.34:5000/api";
const DEFAULT_PROFILE_IMAGE = require('../../../../assets/images/profilePic.png');
// const DEFAULT_PROFILE_IMAGE = 'https://images.unsplash.com/photo-1521566652839-697aa473761a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8cGVyc29ufGVufDB8fDB8fHww';

interface DecodedToken {
  id: string;
  name: string;
  email: string;
  username: string;
  passwordHash: string;
  bio: string;
  profileImage?: string;
}

const ProfileViewScreen = () => {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Function to Get User Data from JWT only
  const fetchUserProfile = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

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
        setId(response.data.id || "");
        setName(response.data.name || "");
        setEmail(response.data.email || "");
        setUsername("@" + response.data.username || "@" + name);
        setBio(response.data.bio || "Here is my Bio");
        setProfileImage(
          response.data.profileImage ||
            Image.resolveAssetSource(DEFAULT_PROFILE_IMAGE).uri
        );
        setError(null);
      } else {
        throw new Error("Failed to fetch profile data from server");
      }
    } catch (error) {
      console.error("Error while fetching user profile:", error);
      setError("Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false); // Make sure refreshing state is reset
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    // No need to set refreshing to false here as it's already handled in fetchUserProfile
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
      // Clear the stored token
      await SecureStore.deleteItemAsync("userToken");

      // Redirect to login screen
      router.replace("/auth/login");
    } catch (error) {
      console.error("Error during logout:", error);
      Alert.alert("Error", "Failed to log out properly");
    }
  };

  const handleEditProfile = () => {
    // Navigate to update profile screen
    router.push("/main/tabs/profile/updateProfile");
  };

  const handleMenuItemPress = (item: string) => {
    switch (item) {
      case "Settings":
        router.push("/main/tabs/profile/settings");
        break;
      case "Chats":
        router.push("/main/tabs/chats");
        break;
      case "Notifications":
        router.push("/main/tabs/profile/notifications");
        break;
      case "Support":
        router.push("/main/tabs/profile/support");
        break;
      case "SOS":
        router.push("/main/tabs/profile/sos");
        break;
      case "Share":
        // Implement share functionality
        Alert.alert("Share", "Share functionality will be implemented soon");
        break;
      case "About us":
        router.push("/main/tabs/profile/about");
        break;
      case "Logout":
        Alert.alert("Logout", "Are you sure you want to log out?", [
          { text: "Cancel", style: "cancel" },
          { text: "Logout", onPress: handleLogout, style: "destructive" },
        ]);
        break;
      default:
        break;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Colors.background}
        />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Colors.background}
        />
        <MaterialIcons name="error-outline" size={50} color={Colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchUserProfile}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.profileCard}>
        <Image source={{ uri: profileImage }} style={styles.profileImage} />
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.username}>{username}</Text>

        {/* Bio display section - improved and only shown when there's content */}
        {bio ? (
          <View style={styles.bioContainer}>
            <MaterialIcons
              name="format-quote"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.bio}>{bio}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditProfile}
          activeOpacity={0.8}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menu}>
        <MenuItem
          label="Settings"
          iconName="settings"
          onPress={() => handleMenuItemPress("Settings")}
        />
        <MenuItem
          label="Chats"
          iconName="chat"
          onPress={() => handleMenuItemPress("Chats")}
        />
        <MenuItem
          label="Notifications"
          iconName="notifications"
          onPress={() => handleMenuItemPress("Notifications")}
        />
        <MenuItem
          label="Support"
          iconName="support-agent"
          onPress={() => handleMenuItemPress("Support")}
        />
        <MenuItem
          label="Share"
          iconName="share"
          onPress={() => handleMenuItemPress("Share")}
        />
        <MenuItem
          label="About us"
          iconName="info"
          onPress={() => handleMenuItemPress("About us")}
        />
        <MenuItem
          label="SOS"
          iconName="report"
          onPress={() => handleMenuItemPress("SOS")}
        />

        <MenuItem
          label="Logout"
          iconName="logout"
          onPress={() => handleMenuItemPress("Logout")}
          isDestructive
        />
      </View>
    </ScrollView>
  );
};

const MenuItem = ({ label, iconName, onPress, isDestructive = false }) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <MaterialIcons
      name={iconName}
      size={24}
      color={isDestructive ? Colors.error : Colors.textPrimary}
      style={styles.menuIcon}
    />
    <Text
      style={[styles.menuItemText, isDestructive && { color: Colors.error }]}
    >
      {label}
    </Text>
    <MaterialIcons
      name="keyboard-arrow-right"
      size={24}
      color={isDestructive ? Colors.error : Colors.textSecondary}
      style={styles.menuArrow}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  errorText: {
    marginTop: Spacing.md,
    color: Colors.error,
    fontSize: 16,
    textAlign: "center",
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
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    marginTop: Platform.OS === "ios" ? 50 : 30,
    borderRadius: Radiuses.medium,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: Radiuses.small,
    elevation: 4,
    marginBottom: Spacing.md,
    alignSelf: "center",
    width: width * 0.9, // Responsive width
  },
  profileImage: {
    width: isTablet ? 200 : width * 0.4, // Conditional size for tablet
    height: isTablet ? 200 : width * 0.4,
    borderRadius: isTablet ? 100 : width * 0.2, // Fully circular
    marginBottom: Spacing.md,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  username: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  bioContainer: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: Radiuses.small,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    width: "85%",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bio: {
    fontSize: 16,
    color: Colors.textSecondary,
    flex: 1,
    marginLeft: Spacing.sm,
    fontStyle: "italic",
  },
  editButton: {
    width: "80%", // Responsive width
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: Spacing.md,
  },
  editButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: Fonts.regular,
  },
  menu: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radiuses.medium,
    marginHorizontal: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: Radiuses.small,
    elevation: 2,
    marginBottom: Spacing.xl,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemText: {
    flex: 1,
    fontSize: 18,
    fontFamily: Fonts.regular,
    color: Colors.textPrimary,
    paddingLeft: Spacing.md,
  },
  menuIcon: {
    marginRight: Spacing.sm,
  },
  menuArrow: {
    marginLeft: Spacing.sm,
  },
});

export default ProfileViewScreen;
