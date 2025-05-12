import React, { useState, useEffect, useCallback } from "react";
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Alert, RefreshControl, ActivityIndicator, Dimensions, ImageBackground,
  StatusBar, Platform
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

const BACKEND_URL = "http://192.168.4.34:5000/api"; 
const { width } = Dimensions.get("window");

interface Post {
  _id: string;
  title: string;
  location: string;
  description: string;
  image?: string;
  createdBy: string; // Admin (creator) of the post
  members: string[]; // Users who have joined
}

interface DecodedToken {
  id: string;
  name: string;
  email: string;
}

export default function Explore(): JSX.Element {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<DecodedToken | null>(null);
  // Track image loading errors with a map of post IDs
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const router = useRouter();

  // Function to Get User Data from JWT
  const fetchLoggedInUser = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (token) {
        const decoded: DecodedToken = jwtDecode(token);
        setLoggedInUser(decoded);
        //console.log("Logged in user:", decoded); // Add logging to verify user data
      }
    } catch (error) {
      console.error("Error decoding user JWT:", error);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/posts/listPosts`);
      setPosts(response.data);
      //console.log("Posts fetched:", response.data); // Add logging to verify post data
    } catch (error) {
      console.error("Error fetching posts:", error);
      Alert.alert("Error", "Failed to load posts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLoggedInUser();
    fetchPosts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, []);

  const handleJoinPost = async (postId: string) => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const response = await axios.post(
        `${BACKEND_URL}/posts/join/${postId}`, 
        {}, 
        { 
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      Alert.alert("Success", response.data.message);
      fetchPosts();
    } catch (error: unknown) {
      console.error("Join post error:", error);
  
      let errorMessage = "Failed to join post";
  
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
  
      Alert.alert("Error", errorMessage);
    }
  };
  
  const handleLeavePost = async (postId: string) => {
    // Show confirmation dialog before leaving
    Alert.alert(
      "Leave Trek",
      "Are you sure you want to leave this trek?",
      [
        { 
          text: "Cancel", 
          style: "cancel" 
        },
        { 
          text: "Leave", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync("userToken");
              const response = await axios.post(
                `${BACKEND_URL}/posts/leave/${postId}`, 
                {}, 
                { 
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              Alert.alert("Success", response.data.message);
              fetchPosts();
            } catch (error: unknown) {
              console.error("Leave post error:", error);
          
              let errorMessage = "Failed to leave group";
          
              if (axios.isAxiosError(error) && error.response?.data?.error) {
                errorMessage = error.response.data.error;
              } else if (error instanceof Error) {
                errorMessage = error.message;
              }
          
              Alert.alert("Error", errorMessage);
            }
          } 
        }
      ]
    );
  };
  
  const handleDeletePost = async (postId: string) => {
    Alert.alert(
      "Delete Trek",
      "Are you sure you want to delete this trek? This action cannot be undone.",
      [
        { 
          text: "Cancel", 
          style: "cancel" 
        },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync("userToken");
              await axios.delete(
                `${BACKEND_URL}/posts/delete/${postId}`, 
                { 
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              Alert.alert("Success", "Trek has been deleted successfully.");
              fetchPosts();
            } catch (error) {
              console.error("Delete post error:", error);
              Alert.alert("Error", "Failed to delete post");
            }
          }
        }
      ]
    );
  };

  const handleEditPost = (postId: string) => {
    router.push({
      pathname: "/main/EditPost",
      params: { postId }
    });




  };

  // Calculate number of members in a trek
  const getMemberCount = (post: Post) => {
    return post.members.length;
  };

  // Format description to be shorter with ellipsis if too long
  const formatDescription = (description: string) => {
    if (description.length > 100) {
      return description.substring(0, 100) + "...";
    }
    return description;
  };
  
  const imageUrls = [
    "https://images.unsplash.com/photo-1583299566806-58d7cf26b38c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTl8fGdyb3VwJTIwdHJla2tpbmd8ZW58MHx8MHx8fDA%3D",
    "https://images.unsplash.com/photo-1636043019482-372c39444fd6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjB8fGdyb3VwJTIwdHJla2tpbmd8ZW58MHx8MHx8fDA%3D",
    "https://plus.unsplash.com/premium_photo-1723575911960-a155e5be8ba0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzN8fGdyb3VwJTIwdHJla2tpbmd8ZW58MHx8MHx8fDA%3D",
    "https://plus.unsplash.com/premium_photo-1723784428582-efe5b955e280?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDV8fGdyb3VwJTIwdHJla2tpbmd8ZW58MHx8MHx8fDA%3D",
    "https://images.unsplash.com/photo-1733041453976-e4a98467c389?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTF8fGdyb3VwJTIwdHJla2tpbmd8ZW58MHx8MHx8fDA%3D"
  ];

  // Function to get image URL with improved fallback logic
  const getImageUrl = (post: Post) => {
    const postId = post._id;
    
    // If there was already an error loading this image, use fallback
    if (imageErrors[postId]) {
      return getFallbackImageUrl(postId);
    }
    
    // Check if image exists and is not a local file path
    if (!post.image || post.image === "" ) {
      return getFallbackImageUrl(postId);
    }
    
    // If it's a valid URL, use it
    return post.image;
  };
  
  // Get a fallback image URL that stays consistent for each post
  const getFallbackImageUrl = (postId: string) => {
    // Use the last character of the post ID to deterministically select an image
    const index = parseInt(postId.slice(-1), 16) % imageUrls.length;
    return imageUrls[index];
  };

  // Handle image loading errors
  const handleImageError = (postId: string) => {
    //console.log(`Image error for post ${postId}`);
    setImageErrors(prev => ({
      ...prev,
      [postId]: true
    }));
  };

  
const navigateToPostDetail = useCallback((postId: string) => {
  router.push({
    pathname: "/post/[post]",
    params: {
      post: postId
    }
  });
}, [router]);


  const renderPostItem = ({ item }: { item: Post }) => {
    // Check if the user is admin
    let isAdmin = false;
    
    if (loggedInUser) {
      // If createdBy is an object with _id property
      if (typeof item.createdBy === 'object' && item.createdBy !== null && '_id' in item.createdBy) {
        isAdmin = loggedInUser.id === item.createdBy._id;
      } 
      // If createdBy is already a string ID
      else if (typeof item.createdBy === 'string') {
        isAdmin = loggedInUser.id === item.createdBy;
      }
    }
    
    const isMember = item.members.includes(loggedInUser?.id ?? "");
    const memberCount = getMemberCount(item);
    const formattedDescription = formatDescription(item.description);
    
    return (
      <TouchableOpacity
    activeOpacity={0.85}
    onPress={() => navigateToPostDetail(item._id)}
  >
      <View style={styles.card}>
        <ImageBackground 
          source={{ uri: getImageUrl(item) }} 
          style={styles.image}
          imageStyle={styles.imageStyle}
          onError={() => handleImageError(item._id)}
        >
          <View style={styles.imageDarkOverlay}>
            <Text style={styles.imageTitle}>{item.title}</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={16} color="#FFFFFF" />
              <Text style={styles.imageLocation}>{item.location}</Text>
            </View>
          </View>
          
          {/* Admin-only action icons with improved visibility */}
          {isAdmin && (
            <View style={styles.adminActions}>
              <TouchableOpacity 
                style={styles.actionIcon} 
                onPress={() => handleEditPost(item._id)}
              >
                <Ionicons name="create-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionIcon} 
                onPress={() => handleDeletePost(item._id)}
              >
                <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </ImageBackground>
        
        <View style={styles.cardContent}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={16} color="#4A5568" />
              <Text style={styles.statText}>{memberCount} {memberCount === 1 ? 'Member' : 'Members'}</Text>
            </View>
            
            {/* Display admin badge if user is admin */}
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.description}>{formattedDescription}</Text>
          
          {/* Join/Leave button at bottom of card */}
          <View style={styles.buttonContainer}>
            {isMember ? (
              <TouchableOpacity 
                style={[styles.leaveButton, isAdmin && styles.adminButton]} 
                onPress={() => handleLeavePost(item._id)}
                disabled={isAdmin} // Admin cannot leave their own post
              >
                <Ionicons 
                  name={isAdmin ? "shield-checkmark" : "exit-outline"} 
                  size={18} 
                  color="#FFFFFF" 
                  style={styles.buttonIcon} 
                />
                <Text style={styles.buttonText}>
                  {isAdmin ? "You are the Trek Admin" : "Leave Trek"}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.joinButton} 
                onPress={() => handleJoinPost(item._id)}
              >
                <Ionicons name="enter-outline" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Join Trek</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      </TouchableOpacity>
    );
  };

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="trail-sign-outline" size={64} color="#A0AEC0" />
      <Text style={styles.emptyText}>No treks found</Text>
      <Text style={styles.emptySubtext}>Create a new trek or pull down to refresh</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header with shadow */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Explore Treks</Text>
        <Text style={styles.subheader}>Discover adventures near you</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={styles.loadingText}>Loading adventures...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={renderPostItem}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[Colors.secondary]} 
              tintColor={Colors.secondary}
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={EmptyListComponent}
        />
      )}

      {/* Floating Create Button with improved shadow */}
      <TouchableOpacity 
        style={styles.createButton} 
        onPress={() => router.navigate("/main/createPost")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  headerContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
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
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2D3748",
  },
  subheader: {
    fontSize: 14,
    color: "#718096",
    marginTop: 2,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 80, // Extra padding at bottom for FAB
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#718096",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 180,
    position: "relative",
  },
  imageStyle: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  imageDarkOverlay: {
    backgroundColor: "rgba(0,0,0,0.3)",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
  },
  imageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  imageLocation: {
    fontSize: 14,
    color: "#FFFFFF",
    marginLeft: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  adminActions: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.6)", // Darker for better visibility
    borderRadius: 8,
    padding: 8,
    zIndex: 10, // Ensure buttons are clickable
  },
  actionIcon: {
    marginHorizontal: 8,
    width: 36, // Increased size
    height: 36, // Increased size
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    padding: 15,
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 10,
    justifyContent: "space-between", // Space out stats and admin badge
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    backgroundColor: "#F7FAFC",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  statText: {
    fontSize: 12,
    color: "#4A5568",
    marginLeft: 5,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  adminBadgeText: {
    fontSize: 12,
    color: "#FFFFFF",
    marginLeft: 5,
    fontWeight: "bold",
  },
  description: {
    fontSize: 14,
    color: "#4A5568",
    lineHeight: 20,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 100,
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  leaveButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 100,
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    justifyContent: "center",
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  adminButton: {
    backgroundColor: "#4A5568", // Different color for admin status
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  buttonIcon: {
    marginRight: 6,
  },
  createButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4A5568",
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#718096",
    marginTop: 8,
    textAlign: "center",
  },
});