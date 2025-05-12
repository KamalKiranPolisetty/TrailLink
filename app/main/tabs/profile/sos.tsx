import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Vibration,
  Linking,
  Platform,
  Dimensions
} from 'react-native';
import * as SMS from 'expo-sms';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, Radiuses } from '../../../../constants/Colors';

const { width } = Dimensions.get('window');

const SOSScreen = () => {
  const [sending, setSending] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const router = useRouter();
  
  // Emergency contacts - in a real app these would be configurable
  const emergencyContacts = ['+15122106021']; // Replace with real emergency contact

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setHasLocationPermission(status === 'granted');
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setHasLocationPermission(status === 'granted');
    return status === 'granted';
  };

  const sendSOS = async () => {
    setSending(true);
    
    // Vibrate with SOS pattern (... --- ...)
    const sosPattern = [300, 200, 300, 200, 300, 500, 800, 500, 800, 500, 800, 500, 300, 200, 300, 200, 300];
    Vibration.vibrate(sosPattern);

    try {
      // Request location permission if not already granted
      if (!hasLocationPermission) {
        const granted = await requestLocationPermission();
        if (!granted) {
          Alert.alert('Permission Denied', 'Location access is required to send your location with SOS');
          setSending(false);
          return;
        }
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      const { latitude, longitude } = location.coords;
      const googleMapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
      
      const message = `🚨 SOS EMERGENCY! I need immediate help. My current location: ${googleMapsUrl}`;

      // Check if SMS is available
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        const { result } = await SMS.sendSMSAsync(emergencyContacts, message);
        
        if (result === 'sent' || result === 'unknown') {
          Alert.alert('Success', 'SOS message sent successfully!');
        } else {
          Alert.alert('Not Sent', 'The message was not sent. Please try again or call directly.');
        }
      } else {
        Alert.alert(
          'SMS Not Available', 
          'SMS is not available on this device. Would you like to call emergency services instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call Emergency', onPress: makeEmergencyCall, style: 'destructive' }
          ]
        );
      }
    } catch (error) {
      console.error('Error sending SOS:', error);
      Alert.alert('Error', 'Failed to send SOS. Please try again or call emergency services directly.');
    } finally {
      setSending(false);
    }
  };

  const confirmSOS = () => {
    Alert.alert(
      'Send SOS Alert',
      'This will send your current location to your emergency contact. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'SEND SOS', onPress: sendSOS, style: 'destructive' }
      ],
      { cancelable: true }
    );
  };

  const makeEmergencyCall = () => {
    // Replace with your country's emergency number
    const emergencyNumber = '+5122106021'; // 911 in US, 112 in EU, etc.
    Linking.openURL(`tel:${emergencyNumber}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency SOS</Text>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Info card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={24} color={Colors.primary} />
          <Text style={styles.infoText}>
            In case of emergency, press the SOS button. Your location will be sent to your emergency contact.
          </Text>
        </View>

        {/* Location status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <MaterialIcons 
              name={hasLocationPermission ? "location-on" : "location-off"} 
              size={24} 
              color={hasLocationPermission ? "green" : Colors.error} 
            />
            <Text style={styles.statusText}>
              Location: {hasLocationPermission ? "Available" : "Not Available"}
            </Text>
            {!hasLocationPermission && (
              <TouchableOpacity style={styles.enableButton} onPress={requestLocationPermission}>
                <Text style={styles.enableButtonText}>Enable</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Main SOS button */}
        <View style={styles.sosButtonContainer}>
          <TouchableOpacity
            style={styles.sosButton}
            onPress={confirmSOS}
            disabled={sending}
            activeOpacity={0.7}
          >
            {sending ? (
              <ActivityIndicator size="large" color={Colors.white} />
            ) : (
              <>
                <MaterialIcons name="warning" size={36} color={Colors.white} />
                <Text style={styles.sosButtonText}>SEND SOS</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Direct call button */}
        <View style={styles.callContainer}>
          <Text style={styles.callText}>Or directly call emergency services:</Text>
          <TouchableOpacity 
            style={styles.callButton}
            onPress={makeEmergencyCall}
          >
            <MaterialIcons name="call" size={24} color={Colors.white} />
            <Text style={styles.callButtonText}>EMERGENCY CALL</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    paddingBottom: 15,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    fontFamily: Fonts.bold,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primaryLightest,
    padding: 15,
    borderRadius: Radiuses.medium,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    color: Colors.textPrimary,
    lineHeight: 20,
    fontFamily: Fonts.regular,
  },
  statusCard: {
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: Radiuses.medium,
    marginBottom: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    flex: 1,
    marginLeft: 10,
    color: Colors.textPrimary,
    fontFamily: Fonts.regular,
  },
  enableButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radiuses.small,
  },
  enableButtonText: {
    color: Colors.white,
    fontWeight: '500',
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  sosButtonContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  sosButton: {
    backgroundColor: Colors.error,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 5,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  sosButtonText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    fontFamily: Fonts.bold,
  },
  callContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  callText: {
    marginBottom: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: Fonts.regular,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Radiuses.medium,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  callButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
});

export default SOSScreen;