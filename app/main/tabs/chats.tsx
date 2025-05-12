import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Platform,
  Dimensions,
  BackHandler
} from "react-native";
import axios from "axios";
import { useRouter, useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import * as Haptics from 'expo-haptics';

const BACKEND_URL = "http://192.168.4.34:5000/api";
const { width } = Dimensions.get("window");

interface Member {
  _id: string;
  name: string;
  email: string;
}

interface Member {
  _id: string;
  name: string;
  email: string;
}

interface Group {
  _id: string;
  groupName: string;
  members?: Member[]; // Full member objects
}

interface DecodedToken {
  id: string;
  name: string;
  email: string;
  members?: Member[]; // Full member objects
}

interface DecodedToken {
  id: string;
  name: string;
  email: string;
}

export default function ChatsScreen(): JSX.Element {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchUserIdFromJWT = async (): Promise<string | null> => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (token) {
        const decoded: DecodedToken = jwtDecode(token);
        return decoded.id;
      }
    } catch (error) {
      console.error("Error decoding JWT:", error);
    }
    return null;
  };
  const navigation = useNavigation();
  // Get the source parameter from URL params
  const { source } = useLocalSearchParams<{ source: string }>();

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const userId = await fetchUserIdFromJWT();
      if (!userId) return;

      const response = await axios.get(`${BACKEND_URL}/groups/listGroups`, {
        withCredentials: true,
      });

      const allGroups: Group[] = response.data;

      // ✅ Filter groups where the user is a member (members contains objects)
      const userGroups = allGroups.filter((group) =>
        group.members?.some((member) => member._id === userId)
      );

      setGroups(userGroups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      Alert.alert("Error", "Failed to load chat groups");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [])
  );
  

  // Handle the back navigation with proper animation
  const handleBackPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (source === 'profile') {
      // Use the native navigation for smoother animation
      navigation.goBack();
      // Then handle the actual route change
      setTimeout(() => {
        router.replace('/profile');
      }, 100);
    } else if (source === 'explore') {
      // Use the native navigation for smoother animation
      navigation.goBack();
      // Then handle the actual route change
      setTimeout(() => {
        router.replace('/(tabs)/explore');
      }, 100);
    } else {
      // Default navigation with standard animation
      navigation.goBack();
    }
    return true;
  }, [router, source, navigation]);

  // Add back button handler with useFocusEffect
  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        handleBackPress
      );
      
      return () => backHandler.remove();
    }, [handleBackPress])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGroups();
  }, []);

  const navigateToGroupDetail = useCallback((groupId: string, groupName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    router.push({
      pathname: "/group/[id]",
      params: {
        id: groupId,
        name: groupName,
        source: source || 'chats'
      }
    });
  }, [router, source]);
  const renderGroupItem = ({ item }: { item: Group }) => {
    const memberCount = item.members?.length || 0;


    return (
      <TouchableOpacity
      style={styles.card}
      onPress={() => navigateToGroupDetail(item._id, item.groupName)}
      activeOpacity={0.7}
    >
        <View style={styles.cardContent}>
          <View style={styles.groupInfoContainer}>
            <View style={styles.groupIconContainer}>
              <Ionicons name="chatbubbles" size={24} color={Colors.primary} />
            </View>
            <View style={styles.groupTextContainer}>
              <Text style={styles.groupName}>{item.groupName}</Text>
            </View>
          </View>


          <View style={styles.groupMetaContainer}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={16} color="#4A5568" />
              <Text style={styles.statText}>
                {memberCount} {memberCount === 1 ? "Member" : "Members"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#A0AEC0" />
      <Text style={styles.emptyText}>No chat groups found</Text>
      <Text style={styles.emptySubtext}>Pull down to refresh</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      
      {/* Header with back button */}
      <View style={styles.headerContainer}>
        <View style={styles.headerWithBackContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#2D3748" />
          </TouchableOpacity>
          <View>
            <Text style={styles.header}>Chat Groups</Text>
            <Text style={styles.subheader}>Connect with your trek buddies</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item._id}
          renderItem={renderGroupItem}
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
    </View>
  );
}

const styles = StyleSheet.create({
  // ... same styles as before (unchanged)
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
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
  header: {
    fontSize: 24,
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
    paddingBottom: 30,
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
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  cardContent: {
    padding: 16,
  },
  groupInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  groupIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F9FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  groupTextContainer: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3748",
  },
  groupMetaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EDF2F7",
    paddingTop: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
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

