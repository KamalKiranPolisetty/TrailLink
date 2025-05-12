import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radiuses } from '../../../../constants/Colors';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const BackendURL = "http://192.168.4.34:5000";

const NotificationsScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  
  // Notification settings
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    loadNotificationSettings();
    fetchNotifications();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const savedSettings = await SecureStore.getItemAsync('notificationSettings');
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setPushEnabled(settings.pushEnabled !== false);
        setEmailEnabled(settings.emailEnabled !== false);
        setSoundEnabled(settings.soundEnabled !== false);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      const settings = {
        pushEnabled,
        emailEnabled,
        soundEnabled
      };
      
      await SecureStore.setItemAsync('notificationSettings', JSON.stringify(settings));
      
      Alert.alert('Success', 'Notification settings updated successfully');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the JWT token from secure storage
      const token = await SecureStore.getItemAsync('userToken');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Make API request with the token
      const response = await axios.get(`${BackendURL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // If API is not available, use mock data
      if (!response.data || response.status !== 200) {
        setNotifications(getMockNotifications());
      } else {
        setNotifications(response.data);
      }
      
      setLoading(false);
    } catch (error) {
      // console.error('Error fetching notifications:', error);
      // Use mock data if API fails
      setNotifications(getMockNotifications());
      setLoading(false);
      Alert.alert('Notice', 'Still working on this feature.');
    }
  };

  const getMockNotifications = () => {
    return [
      {
        id: '1',
        title: 'New Message',
        message: 'You have a new message from John Doe',
        time: '2 hours ago',
        read: false,
        type: 'message'
      },
      {
        id: '2',
        title: 'Friend Request',
        message: 'Jane Smith sent you a friend request',
        time: '1 day ago',
        read: true,
        type: 'friend'
      },
      {
        id: '3',
        title: 'System Update',
        message: 'App updated to version 2.0.1',
        time: '3 days ago',
        read: true,
        type: 'system'
      },
      {
        id: '4',
        title: 'Event Reminder',
        message: 'Community meetup tomorrow at 6 PM',
        time: '4 days ago',
        read: false,
        type: 'event'
      },
      {
        id: '5',
        title: 'New Feature',
        message: 'Check out our new messaging features!',
        time: '1 week ago',
        read: true,
        type: 'system'
      }
    ];
  };

  const markAsRead = async (id: string) => {
    try {
      // Update local state first for immediate feedback
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === id ? {...notification, read: true} : notification
        )
      );
      
      // Get the JWT token from secure storage
      const token = await SecureStore.getItemAsync('userToken');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Make API request to mark notification as read
      await axios.put(`${BackendURL}/api/notifications/${id}/read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // No need to show error to user for this action
    }
  };

  const clearAllNotifications = async () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Get the JWT token from secure storage
              const token = await SecureStore.getItemAsync('userToken');
              
              if (!token) {
                throw new Error('Authentication token not found');
              }

              // Make API request to clear all notifications
              await axios.delete(`${BackendURL}/api/notifications/clear`, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });

              // Clear local state
              setNotifications([]);
              setLoading(false);
              
              Alert.alert('Success', 'All notifications cleared');
            } catch (error) {
              //console.error('Error clearing notifications:', error);
              setLoading(false);
              Alert.alert('Error', 'Failed to clear notifications');
            }
          }
        }
      ]
    );
  };

  const handleBackPress = () => {
    router.back();
  };

  const renderNotificationItem = ({ item }) => {
    const getIconName = (type) => {
      switch (type) {
        case 'message': return 'chat';
        case 'friend': return 'person-add';
        case 'system': return 'system-update';
        case 'event': return 'event';
        default: return 'notifications';
      }
    };

    return (
      <TouchableOpacity 
        style={[styles.notificationItem, !item.read && styles.unreadNotification]}
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationIcon}>
          <MaterialIcons name={getIconName(item.type)} size={24} color={Colors.primary} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress} activeOpacity={0.7}>
          <MaterialIcons name="keyboard-arrow-left" size={28} color={Colors.textSecondary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={clearAllNotifications}
          activeOpacity={0.7}
        >
          <MaterialIcons name="delete-sweep" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.settingsContainer}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={pushEnabled ? Colors.primary : Colors.textTertiary}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Email Notifications</Text>
          <Switch
            value={emailEnabled}
            onValueChange={setEmailEnabled}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={emailEnabled ? Colors.primary : Colors.textTertiary}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Notification Sounds</Text>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={soundEnabled ? Colors.primary : Colors.textTertiary}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={saveNotificationSettings}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.notificationsContainer}>
        <Text style={styles.sectionTitle}>Recent Notifications</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.notificationsList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="notifications-off" size={50} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  },
  clearButton: {
    padding: Spacing.xs,
  },
  settingsContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radiuses.medium,
    margin: Spacing.md,
    padding: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: Radiuses.small,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: Fonts.regular,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.sm,
    borderRadius: Radiuses.small,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationsContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radiuses.medium,
    margin: Spacing.md,
    marginTop: 0,
    padding: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: Radiuses.small,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: 16,
  },
  notificationsList: {
    paddingBottom: Spacing.lg,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  unreadNotification: {
    backgroundColor: Colors.primaryLightest,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLightest,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
  },
});

export default NotificationsScreen;
