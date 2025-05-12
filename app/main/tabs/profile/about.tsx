import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Platform,
  Linking,
  Dimensions
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radiuses } from '../../../../constants/Colors';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const AboutScreen = () => {
  const router = useRouter();
  const appVersion = Constants.manifest?.version || '1.0.0';

  const handleBackPress = () => {
    router.back();
  };

  const handleOpenWebsite = () => {
    Linking.openURL('https://example.com');
  };

  const handleOpenPrivacyPolicy = () => {
    Linking.openURL('https://example.com/privacy-policy');
  };

  const handleOpenTermsOfService = () => {
    Linking.openURL('https://example.com/terms-of-service');
  };

  const handleContactUs = () => {
    Linking.openURL('mailto:contact@traillink.com');
  };

  const teamMembers = [
    {
      name: 'Kamal Kiran polisetty',
      role: 'Frontend Developer',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    },
    {
      name: 'Prithvi Sriman Maddukuri',
      role: 'Backend Developer',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    },
    {
      name: 'Anindit Borodoli',
      role: 'Database Developer',
      image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress} activeOpacity={0.7}>
          <MaterialIcons name="keyboard-arrow-left" size={28} color={Colors.textSecondary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../../assets/images/TrailLinkLogo.png')}
            style={styles.logo}
            defaultSource={require('../../../../assets/images/TrailLinkLogo.png')}
          />
          <Text style={styles.appName}>TrailLink</Text>
          <Text style={styles.appVersion}>Version {appVersion}</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.sectionText}>
            Our mission is to create innovative solutions that empower people to connect, 
            collaborate, and achieve more together. We believe in building technology that 
            enhances human potential and creates positive impact in the world.
          </Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Our Story</Text>
          <Text style={styles.sectionText}>
            Founded in 2025, our company began with a simple idea: to make technology more 
            accessible and user-friendly. What started as a small team working out of a garage 
            has grown into a thriving company with users around the globe.
          </Text>
          <Text style={styles.sectionText}>
            Our journey has been defined by innovation, perseverance, and a deep commitment 
            to our users. We continue to push boundaries and explore new possibilities in 
            our quest to create meaningful technology solutions.
          </Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Our Team</Text>
          <View style={styles.teamContainer}>
            {teamMembers.map((member, index) => (
              <View key={index} style={styles.teamMember}>
                <Image
                  source={{ uri: member.image }}
                  style={styles.teamMemberImage}
                />
                <Text style={styles.teamMemberName}>{member.name}</Text>
                <Text style={styles.teamMemberRole}>{member.role}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.linksContainer}>
          <TouchableOpacity style={styles.linkItem} onPress={handleOpenWebsite} activeOpacity={0.7}>
            <MaterialIcons name="language" size={24} color={Colors.primary} />
            <Text style={styles.linkText}>Visit Our Website</Text>
            <MaterialIcons name="keyboard-arrow-right" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.linkItem} onPress={handleOpenPrivacyPolicy} activeOpacity={0.7}>
            <MaterialIcons name="security" size={24} color={Colors.primary} />
            <Text style={styles.linkText}>Privacy Policy</Text>
            <MaterialIcons name="keyboard-arrow-right" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.linkItem} onPress={handleOpenTermsOfService} activeOpacity={0.7}>
            <MaterialIcons name="description" size={24} color={Colors.primary} />
            <Text style={styles.linkText}>Terms of Service</Text>
            <MaterialIcons name="keyboard-arrow-right" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.linkItem} onPress={handleContactUs} activeOpacity={0.7}>
            <MaterialIcons name="email" size={24} color={Colors.primary} />
            <Text style={styles.linkText}>Contact Us</Text>
            <MaterialIcons name="keyboard-arrow-right" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.socialContainer}>
          <Text style={styles.socialTitle}>Follow Us</Text>
          <View style={styles.socialIcons}>
            <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7}>
              <FontAwesome name="facebook" size={28} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7}>
              <FontAwesome name="twitter" size={28} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7}>
              <FontAwesome name="instagram" size={28} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7}>
              <FontAwesome name="linkedin" size={28} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© {new Date().getFullYear()} TrailLink. All rights reserved.</Text>
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
  logoContainer: {
    borderRadius: 20,  // Ensure this is a number and 'px' is not necessary
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
    overflow: 'hidden',  // Add this to clip the contents
  },
  logo: {
    borderRadius: 20,  // Ensure this is consistent
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  appVersion: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  sectionContainer: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: Radiuses.medium,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: Radiuses.small,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  teamContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  teamMember: {
    width: isTablet ? '23%' : '48%',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  teamMemberImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.sm,
  },
  teamMemberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  teamMemberRole: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  linksContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radiuses.medium,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: Radiuses.small,
    elevation: 2,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: Spacing.md,
  },
  socialContainer: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: Radiuses.medium,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: Radiuses.small,
    elevation: 2,
    alignItems: 'center',
  },
  socialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
  },
  footer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});

export default AboutScreen;
