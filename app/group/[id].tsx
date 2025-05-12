import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Keyboard,
  StatusBar,
  BackHandler,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { io, Socket } from "socket.io-client";
import * as Haptics from 'expo-haptics';

const BACKEND_URL = "http://192.168.4.34:5000";
const { width } = Dimensions.get("window");

interface Message {
  _id: string;
  sender: { name: string; _id: string };
  content: string;
  createdAt: string;
  timestamp: string;
}

interface DecodedToken {
  id: string;
  name: string;
  email: string;
}

export default function GroupChatScreen() {
  const params = useLocalSearchParams();
  const groupId = params.id ? String(params.id) : "";
  const groupName = params.name ? String(params.name) : "Group Chat";
  const source = params.source ? String(params.source) : "chats";

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();
  const navigation = useNavigation();

  const initializeUserAndSocket = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token || !groupId) return;

      const decoded = jwtDecode<DecodedToken>(token);
      setUserId(decoded.id);
      setUserName(decoded.name);

      // Setup socket connection
      const socket = io(BACKEND_URL, {
        withCredentials: true,
        transports: ["websocket"],
      });
      
      socketRef.current = socket;
      
      socket.emit("joinGroup", {
        groupId,
        userId: decoded.id,
      });
      
      socket.on("receiveMessage", (msg) => {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      });
    } catch (err) {
      console.error("Socket/User init error:", err);
    }
  };

  const fetchMessages = async () => {
    try {
      setRefreshing(true);
      const res = await axios.get(`${BACKEND_URL}/api/chat/${groupId}`, {
        withCredentials: true,
      });
      setMessages(res.data);
      scrollToBottom();
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !userId || !groupId) return;
    
    try {
      setSending(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      socketRef.current?.emit("sendMessage", {
        groupId,
        senderId: userId,
        content: messageText,
      });
      
      setMessageText("");
      Keyboard.dismiss();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messages.length > 0) {
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  // Handle back button press
  const handleBackPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (source === 'profile') {
      navigation.goBack();
      setTimeout(() => {
        router.replace('/profile');
      }, 100);
    } else if (source === 'explore') {
      navigation.goBack();
      setTimeout(() => {
        router.replace('/(tabs)/explore');
      }, 100);
    } else {
      navigation.goBack();
    }
    return true;
  }, [router, source, navigation]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );
    
    const init = async () => {
      await initializeUserAndSocket();
      await fetchMessages();
    };
  
    if (groupId) {
      init();
    }
  
    return () => {
      socketRef.current?.disconnect();
      backHandler.remove();
    };
  }, [groupId, handleBackPress]);

  const onRefresh = useCallback(() => {
    fetchMessages();
  }, []);

  const renderItem = ({ item }: { item: Message }) => {
    const isMe = item.sender && userId && item.sender._id === userId;
    const messageDate = new Date(item.createdAt || item.timestamp);
    const time = messageDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
        {!isMe && <Text style={styles.senderName}>{item.sender.name}</Text>}
        <View style={[
          styles.messageBubble, 
          isMe ? styles.myBubble : styles.otherBubble,
          { maxWidth: width * 0.7 }
        ]}>
          <Text style={styles.messageText}>{item.content}</Text>
          <Text style={styles.timestamp}>{time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header with back button - matched to ChatsScreen */}
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
              <Text style={styles.header}>{groupName}</Text>
              <Text style={styles.subheader}>Chat with your group members</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.secondary} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={[Colors.secondary]}
                tintColor={Colors.secondary}
              />
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color="#A0AEC0" />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Start a conversation!</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            onPress={sendMessage} 
            disabled={sending || !messageText.trim()}
            style={styles.sendButton}
            activeOpacity={0.7}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  container: {
    flex: 1,
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
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  messageRow: {
    marginBottom: 16,
    maxWidth: "80%",
  },
  myMessageRow: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  otherMessageRow: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  myBubble: {
    backgroundColor: "#419441",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A5568",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  messageText: {
    fontSize: 15,
    color: "#2D3748",
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    color: "#A0AEC0",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  input: {
    flex: 1,
    fontSize: 16,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    color: "#2D3748",
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
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