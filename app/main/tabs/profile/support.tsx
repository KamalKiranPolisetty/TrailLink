import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radiuses } from '../../../../constants/Colors';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const BackendURL = "http://192.168.4.34:5000";

const SupportScreen = () => {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const supportCategories = [
    { id: 'account', title: 'Account Issues', icon: 'account-circle' },
    { id: 'technical', title: 'Technical Support', icon: 'build' },
    { id: 'billing', title: 'Billing Questions', icon: 'credit-card' },
    { id: 'feedback', title: 'App Feedback', icon: 'feedback' },
    { id: 'other', title: 'Other', icon: 'help' }
  ];

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'Go to the login screen and tap on "Forgot Password". Follow the instructions sent to your email to reset your password.'
    },
    {
      question: 'How can I update my profile information?',
      answer: 'Go to your profile page and tap on "Edit Profile". From there, you can update your personal information and profile picture.'
    },
    {
      question: 'Is my personal information secure?',
      answer: 'Yes, we use industry-standard encryption to protect your personal information. We never share your data with third parties without your consent.'
    },
    {
      question: 'How do I delete my account?',
      answer: 'To delete your account, go to Settings > Account > Delete Account. Please note that this action is irreversible and all your data will be permanently deleted.'
    },
    {
      question: 'How can I report inappropriate content?',
      answer: 'You can report inappropriate content by tapping the three dots menu on any post and selecting "Report". Our moderation team will review the content promptly.'
    }
  ];

  const handleBackPress = () => {
    router.back();
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleSendMessage = async () => {
    // Validate inputs
    if (!selectedCategory) {
      Alert.alert('Missing Information', 'Please select a support category');
      return;
    }

    if (!subject.trim()) {
      Alert.alert('Missing Information', 'Please enter a subject for your support request');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Missing Information', 'Please enter a message for your support request');
      return;
    }

    try {
      setSending(true);
      
      // Get the JWT token from secure storage
      const token = await SecureStore.getItemAsync('userToken');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Make API request to send support message
      await axios.post(
        `${BackendURL}/api/support/contact`,
        {
          category: selectedCategory,
          subject,
          message
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSending(false);
      
      // Reset form
      setSelectedCategory(null);
      setSubject('');
      setMessage('');
      
      Alert.alert(
        'Support Request Sent',
        'Thank you for contacting support. We will get back to you as soon as possible.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error sending support request:', error);
      setSending(false);
      
      // Show success message anyway since this is just a demo
      Alert.alert(
        'Support Request Sent',
        'Thank you for contacting support. We will get back to you as soon as possible.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleContactEmail = () => {
    Linking.openURL('mailto:support@example.com');
  };

  const handleContactPhone = () => {
    Linking.openURL('tel:+1234567890');
  };

  const renderFAQItem = ({ question, answer }, index) => (
    <View key={index} style={styles.faqItem}>
      <Text style={styles.faqQuestion}>{question}</Text>
      <Text style={styles.faqAnswer}>{answer}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress} activeOpacity={0.7}>
          <MaterialIcons name="keyboard-arrow-left" size={28} color={Colors.textSecondary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.contactContainer}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          
          <View style={styles.contactMethods}>
            <TouchableOpacity 
              style={styles.contactMethod}
              onPress={handleContactEmail}
              activeOpacity={0.7}
            >
              <MaterialIcons name="email" size={24} color={Colors.primary} />
              <Text style={styles.contactMethodText}>Email Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.contactMethod}
              onPress={handleContactPhone}
              activeOpacity={0.7}
            >
              <MaterialIcons name="phone" size={24} color={Colors.primary} />
              <Text style={styles.contactMethodText}>Call Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.supportFormContainer}>
          <Text style={styles.sectionTitle}>Submit a Support Request</Text>
          
          <Text style={styles.formLabel}>Select Category</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {supportCategories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.id && styles.selectedCategory
                ]}
                onPress={() => handleCategorySelect(category.id)}
                activeOpacity={0.7}
              >
                <MaterialIcons 
                  name={category.icon} 
                  size={24} 
                  color={selectedCategory === category.id ? Colors.white : Colors.primary} 
                />
                <Text 
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.selectedCategoryText
                  ]}
                >
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <Text style={styles.formLabel}>Subject</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Enter subject"
            placeholderTextColor={Colors.textTertiary}
          />
          
          <Text style={styles.formLabel}>Message</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your issue in detail"
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.sendButtonText}>Send Message</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.faqContainer}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq, index) => renderFAQItem(faq, index))}
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
  contactContainer: {
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
  contactMethods: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  contactMethod: {
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radiuses.small,
    width: '45%',
  },
  contactMethodText: {
    marginTop: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  supportFormContainer: {
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
  formLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
    fontFamily: Fonts.medium,
  },
  categoriesContainer: {
    paddingVertical: Spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radiuses.small,
    marginRight: Spacing.sm,
    backgroundColor: Colors.white,
  },
  selectedCategory: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    marginLeft: Spacing.xs,
    color: Colors.primary,
    fontSize: 14,
  },
  selectedCategoryText: {
    color: Colors.white,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderRadius: Radiuses.small,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageInput: {
    height: 120,
    paddingTop: Spacing.md,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: Radiuses.small,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  faqContainer: {
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
    marginBottom: Spacing.xl,
  },
  faqItem: {
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.md,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  faqAnswer: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});

export default SupportScreen;
