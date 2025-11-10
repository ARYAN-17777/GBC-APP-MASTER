import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function TermsAndConditionsScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.title}>GENERAL BILIMORIA'S CANTEEN</Text>
          <Text style={styles.subtitle}>Terms & Conditions and Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>
          <Text style={styles.version}>Version 2.0 - Enhanced Security & Real-time Features</Text>
          <Text style={styles.powered}>🔗 Powered by Supabase & Expo</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. ACCEPTANCE OF TERMS</Text>
          <Text style={styles.text}>
            By accessing and using the General Bilimoria's Canteen mobile application ("App"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. DESCRIPTION OF SERVICE</Text>
          <Text style={styles.text}>
            General Bilimoria's Canteen provides a mobile application for ordering food and beverages from our restaurant. The service includes menu browsing, order placement, payment processing, and order management features.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. USER ACCOUNTS</Text>
          <Text style={styles.text}>
            To use certain features of the App, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
          </Text>
          <Text style={styles.text}>
            You are responsible for safeguarding the password and for all activities that occur under your account. You agree not to disclose your password to any third party.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. ORDERING AND PAYMENT</Text>
          <Text style={styles.text}>
            All orders placed through the App are subject to acceptance by General Bilimoria's Canteen. We reserve the right to refuse or cancel any order for any reason.
          </Text>
          <Text style={styles.text}>
            Payment must be made at the time of order placement. All prices are subject to change without notice.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. PRIVACY POLICY</Text>
          <Text style={styles.text}>
            We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our App.
          </Text>
          
          <Text style={styles.subsectionTitle}>5.1 Information We Collect</Text>
          <Text style={styles.text}>
            • Personal Information: Name, email address, phone number, delivery address
            • Account Information: Username, password (encrypted)
            • Order Information: Food preferences, order history, payment details
            • Device Information: Device type, operating system, app usage data
          </Text>

          <Text style={styles.subsectionTitle}>5.2 How We Use Your Information</Text>
          <Text style={styles.text}>
            • To process and fulfill your orders
            • To communicate with you about your orders
            • To improve our services and app functionality
            • To send promotional offers (with your consent)
            • To ensure security and prevent fraud
          </Text>

          <Text style={styles.subsectionTitle}>5.3 Data Security</Text>
          <Text style={styles.text}>
            We use industry-standard security measures to protect your personal information. Your data is stored securely using Supabase's enterprise-grade infrastructure with encryption at rest and in transit.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. DATA SHARING</Text>
          <Text style={styles.text}>
            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy:
          </Text>
          <Text style={styles.text}>
            • Service providers who assist in operating our app
            • Legal requirements or to protect our rights
            • Business transfers (mergers, acquisitions)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. YOUR RIGHTS</Text>
          <Text style={styles.text}>
            You have the right to:
            • Access your personal data
            • Correct inaccurate data
            • Delete your account and data
            • Opt-out of marketing communications
            • Data portability
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. COOKIES AND TRACKING</Text>
          <Text style={styles.text}>
            Our App may use cookies and similar tracking technologies to enhance user experience and analyze app usage. You can control cookie settings through your device preferences.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. THIRD-PARTY SERVICES</Text>
          <Text style={styles.text}>
            Our App integrates with third-party services including:
            • Supabase (database and authentication)
            • Payment processors
            • Analytics services
          </Text>
          <Text style={styles.text}>
            These services have their own privacy policies and terms of service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. CHILDREN'S PRIVACY</Text>
          <Text style={styles.text}>
            Our App is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. CHANGES TO TERMS</Text>
          <Text style={styles.text}>
            We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting in the App. Your continued use of the App constitutes acceptance of the modified terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. LIMITATION OF LIABILITY</Text>
          <Text style={styles.text}>
            General Bilimoria's Canteen shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. GOVERNING LAW</Text>
          <Text style={styles.text}>
            These terms shall be governed by and construed in accordance with the laws of the United Kingdom, without regard to its conflict of law provisions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. CONTACT INFORMATION</Text>
          <Text style={styles.text}>
            If you have any questions about these Terms & Conditions or Privacy Policy, please contact us:
          </Text>
          <Text style={styles.contactText}>
            General Bilimoria's Canteen{'\n'}
            Email: info@gbccanteen.com{'\n'}
            Phone: +44 1234 567890{'\n'}
            Address: Sawbridgeworth, United Kingdom
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. ACKNOWLEDGMENT</Text>
          <Text style={styles.text}>
            By using our App, you acknowledge that you have read and understood these Terms & Conditions and Privacy Policy and agree to be bound by them.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 General Bilimoria's Canteen. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#F47B20',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F47B20',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  version: {
    fontSize: 12,
    color: '#F47B20',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 5,
  },
  powered: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F47B20',
    marginTop: 10,
    marginBottom: 5,
  },
  text: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  contactText: {
    fontSize: 14,
    color: '#F47B20',
    lineHeight: 20,
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#F47B20',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
