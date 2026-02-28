import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

type SubscriptionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Subscription'>;

export default function SubscriptionScreen() {
  const navigation = useNavigation<SubscriptionScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.planTitle}>GlobalVox Pro</Text>
        <Text style={styles.price}>$20/month</Text>
        <Text style={styles.benefit}>Unlimited Translations</Text>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        activeOpacity={0.85}
        onPress={() => Alert.alert('GlobalVox Pro', 'Thank you! Subscription coming soon.')}
      >
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}
      >
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFF4EC',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#FF6600',
  },
  planTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF6600',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#222222',
    marginBottom: 12,
  },
  benefit: {
    fontSize: 16,
    color: '#555555',
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#FF6600',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
  },
  backText: {
    color: '#555555',
    fontSize: 16,
    fontWeight: '600',
  },
});
