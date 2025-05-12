// app/main/tabs/profile/settings.tsx
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
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radiuses } from '../../../../constants/Colors';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const SettingsScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings state
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [dataUsage, setDataUsage] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    // Load user settings from local storage
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load settings from AsyncStorage or SecureStore
      const savedSettings = await SecureStore.getItemAsync('userSettings');
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setDarkMode(settings.darkMode || false);
        setNotifications(settings.notifications !== false);
        setLocationServices(settings.locationServices !== false);
        setDataUsage(settings.dataUsage || false);
        setEmailNotifications(settings.emailNotifications !== false);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Save settings to AsyncStorage or SecureStore
      const settings = {
        darkMode,
        notifications,
        locationServices,
        dataUsage,
        emailNotifications
      };
      
      await SecureStore.setItemAsync('userSettings', JSON.stringify(settings));
      
      // Show success message
      Alert.alert('Success', 'Settings saved successfully');
      
      setSaving(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaving(false);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Would you like to change your password?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            // Navigate to change password screen or show modal
           // Alert.alert('Feature Coming Soon', 'Password change functionality will be available in the next update.');
           router.navigate('/main/tabs/profile/ChangePasswordScreen');
          }
        }
      ]
    );
  };

  const handlePrivacySettings = () => {
    Alert.alert('Feature Coming Soon', 'Privacy settings will be available in the next update.');
  };

  const handleLanguageSettings = () => {
    Alert.alert('Feature Coming Soon', 'Language settings will be available in the next update.');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Feature Coming Soon', 'Account deletion functionality will be available in the next update.');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress} activeOpacity={0.7}>
          <MaterialIcons name="keyboard-arrow-left" size={28} color={Colors.textSecondary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="brightness-6" size={24} color={Colors.textPrimary} />
              <Text style={styles.settingLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={darkMode ? Colors.primary : Colors.textTertiary}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="notifications" size={24} color={Colors.textPrimary} />
              <Text style={styles.settingLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={notifications ? Colors.primary : Colors.textTertiary}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="location-on" size={24} color={Colors.textPrimary} />
              <Text style={styles.settingLabel}>Location Services</Text>
            </View>
            <Switch
              value={locationServices}
              onValueChange={setLocationServices}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={locationServices ? Colors.primary : Colors.textTertiary}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="data-usage" size={24} color={Colors.textPrimary} />
              <Text style={styles.settingLabel}>Data Saving Mode</Text>
            </View>
            <Switch
              value={dataUsage}
              onValueChange={setDataUsage}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={dataUsage ? Colors.primary : Colors.textTertiary}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="email" size={24} color={Colors.textPrimary} />
              <Text style={styles.settingLabel}>Email Notifications</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={emailNotifications ? Colors.primary : Colors.textTertiary}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={saveSettings}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Settings</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.accountContainer}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <TouchableOpacity 
            style={styles.accountItem}
            onPress={handleChangePassword}
            activeOpacity={0.7}
          >
            <View style={styles.accountItemLeft}>
              <MaterialIcons name="lock" size={24} color={Colors.textPrimary} />
              <Text style={styles.accountItemText}>Change Password</Text>
            </View>
            <MaterialIcons name="keyboard-arrow-right" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.accountItem}
            onPress={handlePrivacySettings}
            activeOpacity={0.7}
          >
            <View style={styles.accountItemLeft}>
              <MaterialIcons name="security" size={24} color={Colors.textPrimary} />
              <Text style={styles.accountItemText}>Privacy Settings</Text>
            </View>
            <MaterialIcons name="keyboard-arrow-right" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.accountItem}
            onPress={handleLanguageSettings}
            activeOpacity={0.7}
          >
            <View style={styles.accountItemLeft}>
              <MaterialIcons name="language" size={24} color={Colors.textPrimary} />
              <Text style={styles.accountItemText}>Language</Text>
            </View>
            <MaterialIcons name="keyboard-arrow-right" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.accountItem, styles.deleteAccountItem]}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <View style={styles.accountItemLeft}>
              <MaterialIcons name="delete-forever" size={24} color={Colors.error} />
              <Text style={[styles.accountItemText, styles.deleteAccountText]}>Delete Account</Text>
            </View>
            <MaterialIcons name="keyboard-arrow-right" size={24} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>App Version: 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: 16,
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
  placeholder: {
    width: 80, // To balance the header
  },
  scrollContainer: {
    flex: 1,
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
    marginLeft: Spacing.xs,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: Fonts.regular,
    marginLeft: Spacing.md,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.sm,
    borderRadius: Radiuses.small,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  accountContainer: {
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
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  accountItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountItemText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: Fonts.regular,
    marginLeft: Spacing.md,
  },
  deleteAccountItem: {
    borderBottomWidth: 0,
  },
  deleteAccountText: {
    color: Colors.error,
  },
  versionContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  versionText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
});

export default SettingsScreen;
