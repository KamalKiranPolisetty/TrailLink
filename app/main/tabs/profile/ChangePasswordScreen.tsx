import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radiuses } from '../../../../constants/Colors';
import { useRouter } from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BackendURL = "http://192.168.4.34:5000/api";

const ChangePasswordScreen = () => {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleBackPress = () => {
    router.back();
  };
  
  const handleChangePassword = async () => {
    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'New password must be at least 6 characters long.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Get auth token
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again.');
        router.navigate('/auth/login');
        return;
      }
      
      // Send request to backend
      const response = await axios.patch(
        `${BackendURL}/change-password`,
        {
          currentPassword,
          newPassword
        },
        {
            withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Password change response:', response.data);
      
      setLoading(false);
      
      // Show success message
      Alert.alert(
        'Success',
        'Your password has been changed successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error) {
      setLoading(false);
      console.log('Password change error:', error);
      let errorMessage = 'An error occurred. Please try again.';
      if (error.response) {
        // Get error message from server response
        errorMessage = error.response.data.message || errorMessage;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress} activeOpacity={0.7}>
          <MaterialIcons name="keyboard-arrow-left" size={28} color={Colors.textSecondary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <Text style={styles.formInstructions}>
              Enter your current password and choose a new password for your account.
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter your current password"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter your new password"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your new password"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleChangePassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Change Password</Text>
              )}
            </TouchableOpacity>
            
            <Text style={styles.securityNote}>
              For your security, please use a strong password that contains at least 6 characters including numbers and special characters.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  placeholder: {
    width: 80, // To balance the header
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  formContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radiuses.medium,
    margin: Spacing.md,
    padding: Spacing.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: Radiuses.small,
    elevation: 2,
  },
  formInstructions: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: Radiuses.small,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Radiuses.small,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  securityNote: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: Spacing.md,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ChangePasswordScreen;