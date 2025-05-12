import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  ScrollView, 
  Image, 
  ImageBackground, 
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  id: string;
  name: string;
  email: string;
}


const BACKEND_URL = "http://192.168.4.34:5000/api";
const { width } = Dimensions.get("window");

interface Post {
  _id: string;
  title: string;
  description: string;
  location: string;
  image?: string;
  eventDate: string;
  members: {
    _id: string;
    name: string;
    email: string;
  }[];
  createdBy: {
    name: string;
    email: string;
  };
}

interface WeatherDay {
  date: string;
  emoji: string;
  label: string;
  code: number;
  min: number;
  max: number;
}

export default function PostDetail() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  // Since your dynamic route is [post].tsx, the param name is "post"
  const postId = params.post ? String(params.post) : "";
  const [postData, setPostData] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherDay[] | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const getWeatherEmojiAndLabel = (code: number): [string, string] => {
    if (code === 0) return ["☀️", "Clear"];
    if (code <= 3) return ["⛅", "Cloudy"];
    if (code <= 48) return ["🌫️", "Foggy"];
    if (code <= 67) return ["🌦️", "Drizzle"];
    if (code <= 82) return ["🌧️", "Rain"];
    if (code <= 86) return ["❄️", "Snow"];
    if (code >= 95) return ["⛈️", "Thunderstorm"];
    return ["❓", "Unknown"];
  };

  const getWeatherColor = (code: number) => {
    if (code === 0) return "#FEF08A";
    if (code <= 3) return "#CBD5E1";
    if (code <= 48) return "#E0E7FF";
    if (code <= 67) return "#A5F3FC";
    if (code <= 82) return "#BFDBFE";
    if (code <= 86) return "#E0E7FF";
    if (code >= 95) return "#FECACA";
    return "#F3F4F6";
  };

  const isEventDateInRange = (dateStr: string): boolean => {
    const event = new Date(dateStr);
    const today = new Date();
    const maxDaysAhead = 15;
  
    const diffInTime = event.getTime() - today.getTime();
    const diffInDays = diffInTime / (1000 * 3600 * 24);
  
    return diffInDays >= 0 && diffInDays <= maxDaysAhead;
  };

  // Fallback image logic
  const imageUrls = [
    "https://images.unsplash.com/photo-1583299566806-58d7cf26b38c?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1636043019482-372c39444fd6?w=500&auto=format&fit=crop&q=60",
    "https://plus.unsplash.com/premium_photo-1723575911960-a155e5be8ba0?w=500&auto=format&fit=crop&q=60",
    "https://plus.unsplash.com/premium_photo-1723784428582-efe5b955e280?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1733041453976-e4a98467c389?w=500&auto=format&fit=crop&q=60"
  ];

  const getFallbackImageUrl = (id: string) => {
    const index = parseInt(id.slice(-1), 16) % imageUrls.length;
    return imageUrls[index];
  };

  const getImageUrl = () => {
    if (!postData) return "";
    if (imageError || !postData.image || postData.image === "") {
      return getFallbackImageUrl(postData._id);
    }
    return postData.image;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  useEffect(() => {
    if (!postId) return;

    const fetchLoggedInUser = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");
        if (token) {
          const decoded: DecodedToken = jwtDecode(token);
          setLoggedInUserId(decoded.id);
        }
      } catch (error) {
        console.error("Error decoding JWT:", error);
      }
    };
    
    fetchLoggedInUser();
    

    const fetchPostAndWeather = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/postinfo/${postId}`);
        const post = res.data;
        setPostData(post);

        const { location, eventDate } = post;

        // Check the date range before attempting a weather fetch
        if (!isEventDateInRange(eventDate)) {
          setWeatherError("⏳ Come back closer to the event date for updated weather info.");
          return;
        }

        // Simplify location for geocoding (e.g., "Hyderabad")
        const locationName = location.split(",")[0].trim();

        const geoRes = await axios.get("https://geocoding-api.open-meteo.com/v1/search", {
          params: { name: locationName, count: 1 },
        });

        const geo = geoRes.data.results?.[0];
        if (!geo) {
          setWeatherError("Weather not available for this location.");
          return;
        }

        const { latitude, longitude } = geo;
        const start = new Date(eventDate);
        const end = new Date(start);
        end.setDate(start.getDate() + 2);

        const startISO = start.toISOString().split("T")[0];
        const endISO = end.toISOString().split("T")[0];

        const forecastRes = await axios.get("https://api.open-meteo.com/v1/forecast", {
          params: {
            latitude,
            longitude,
            start_date: startISO,
            end_date: endISO,
            daily: "temperature_2m_max,temperature_2m_min,weathercode",
            timezone: "auto",
          },
        });
        
        const daily = forecastRes.data?.daily;
        
        if (
          !daily ||
          !daily.weathercode ||
          !Array.isArray(daily.weathercode) ||
          daily.weathercode.length === 0 ||
          daily.weathercode[0] === null
        ) {
          setWeatherError("⏳ Come back closer to the event date for updated weather info.");
          return;
        }
        
        const formattedWeather = daily.time.map((dateStr: string, index: number) => {
          const code = daily.weathercode[index];
          const min = daily.temperature_2m_min[index];
          const max = daily.temperature_2m_max[index];
          const [emoji, label] = getWeatherEmojiAndLabel(code);

          const dateFormatted = new Date(dateStr).toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          });

          return {
            date: dateFormatted,
            emoji,
            label,
            code,
            min,
            max,
          };
        });

        setWeatherData(formattedWeather);
      } catch (error) {
        console.error("Weather fetch error:", error);
        setWeatherError("Weather not available.");
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndWeather();
  }, [postId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading trek details...</Text>
      </View>
    );
  }

  if (!postData) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={64} color="#A0AEC0" />
        <Text style={styles.errorText}>Trek not found.</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formattedEventDate = new Date(postData.eventDate).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.mainContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground 
          source={{ uri: getImageUrl() }}
          style={styles.headerImage}
          onError={handleImageError}
        >
          <View style={styles.backButtonContainer}>
            <TouchableOpacity
              style={styles.circleButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.imageDarkOverlay}>
            <Text style={styles.heroTitle}>{postData.title}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={20} color="#FFFFFF" />
              <Text style={styles.locationText}>{postData.location}</Text>
            </View>
          </View>
        </ImageBackground>
        
        <View style={styles.contentCard}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="calendar" size={20} color={Colors.secondary} />
              <Text style={styles.dateText}>{formattedEventDate}</Text>
            </View>
            <View style={styles.memberBadge}>
              <Ionicons name="people" size={20} color="#FFFFFF" />
              <Text style={styles.memberCount}>{postData.members.length} joined</Text>
            </View>
          </View>
          
          <View style={styles.sectionTitle}>
            <Ionicons name="partly-sunny" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitleText}>Weather Forecast</Text>
          </View>
          
          <View style={styles.weatherContainer}>
            {weatherError ? (
              <View style={[styles.weatherErrorCard, {backgroundColor: "#FEF3C7"}]}>
                <Text style={styles.weatherErrorText}>{weatherError}</Text>
              </View>
            ) : weatherData ? (
              weatherData.map((day, index) => (
                <View
                  key={index}
                  style={[styles.weatherCard, { backgroundColor: getWeatherColor(day.code) }]}
                >
                  <Text style={styles.weatherIcon}>{day.emoji}</Text>
                  <View style={styles.weatherDetails}>
                    <Text style={styles.weatherDate}>{day.date}</Text>
                    <Text style={styles.weatherLabel}>{day.label}</Text>
                    <Text style={styles.weatherTemp}>{day.min}°C - {day.max}°C</Text>
                  </View>
                </View>
              ))
            ) : (
              <ActivityIndicator size="small" color={Colors.primary} />
            )}
          </View>
          
          <View style={styles.sectionTitle}>
            <Ionicons name="information-circle" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitleText}>Trek Details</Text>
          </View>
          
          <Text style={styles.description}>{postData.description}</Text>
          
          <View style={styles.creatorSection}>
            <View style={styles.creatorAvatar}>
              <Text style={styles.avatarText}>{postData.createdBy.name.charAt(0)}</Text>
            </View>
            <View style={styles.creatorInfo}>
              <Text style={styles.createdByLabel}>Created by</Text>
              <Text style={styles.creatorName}>{postData.createdBy.name}</Text>
            </View>
          </View>

          {/* Members List Section */}
          <View style={styles.membersListSection}>
            <Text style={styles.sectionTitleText}>Members</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.membersScroll}>
              {postData.members.map((member) => (
                <View key={member._id} style={styles.memberItem}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{member.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
          {loggedInUserId && postData.members.some(member => member._id === loggedInUserId) && (
  <TouchableOpacity
    style={styles.chatButton}
    onPress={() =>
      router.push("/main/tabs/chats")
      
    }
  >
    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFF" style={styles.chatIcon} />
    <Text style={styles.chatButtonText}>Go to Group Chat</Text>
  </TouchableOpacity>
)}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  chatButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  chatButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  chatIcon: {
    marginRight: 4,
  },
  
  mainContainer: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#718096",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#E53E3E",
    marginTop: 10,
    marginBottom: 20,
  },
  headerImage: {
    width: "100%",
    height: Math.min(300, Dimensions.get("window").height * 0.35),
  },
  backButtonContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 10 : 20,
    left: 20,
    zIndex: 10,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageDarkOverlay: {
    backgroundColor: "rgba(0,0,0,0.4)",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  locationText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginLeft: 6,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  contentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginTop: -24,
    marginHorizontal: 16,
    paddingHorizontal: Dimensions.get("window").width > 400 ? 24 : 16,
    paddingTop: 24,
    paddingBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  dateText: {
    fontSize: 16,
    color: "#4A5568",
    marginLeft: 8,
    fontWeight: "500",
    flexShrink: 1,
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  memberCount: {
    color: "#FFFFFF",
    marginLeft: 6,
    fontWeight: "600",
    fontSize: 14,
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3748",
    marginLeft: 8,
  },
  weatherContainer: {
    marginBottom: 16,
  },
  weatherErrorCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  weatherErrorText: {
    fontSize: 15,
    color: "#92400E",
  },
  weatherCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  weatherIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  weatherDetails: {
    flex: 1,
  },
  weatherDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
  },
  weatherLabel: {
    fontSize: 14,
    color: "#4A5568",
  },
  weatherTemp: {
    fontSize: 14,
    color: "#4A5568",
    fontWeight: "500",
  },
  description: {
    fontSize: 16,
    color: "#4A5568",
    lineHeight: 24,
    marginBottom: 24,
  },
  creatorSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    padding: 15,
    borderRadius: 12,
  },
  creatorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  creatorInfo: {
    marginLeft: 15,
    flex: 1,
  },
  createdByLabel: {
    fontSize: 12,
    color: "#718096",
  },
  creatorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
  },
  membersListSection: {
    marginVertical: 16,
  },
  membersScroll: {
    flexDirection: "row",
  },
  memberItem: {
    alignItems: "center",
    marginRight: 12,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  memberAvatarText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  memberName: {
    marginTop: 4,
    fontSize: 12,
    color: "#2D3748",
    maxWidth: 60,
    textAlign: "center",
  },
});

