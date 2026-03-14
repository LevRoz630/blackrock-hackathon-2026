import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { decideTransaction } from '../api/client';

export default function HighRiskPromptScreen({ route, navigation }) {
  const { transaction, runningTotal, budget } = route.params;
  const [deciding, setDeciding] = useState(false);

  const overBy = runningTotal - budget;

  const handleDecision = async (approved) => {
    setDeciding(true);
    try {
      await decideTransaction({
        transaction_id: transaction.id,
        approved,
      });
    } catch {
      // silently handle
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Over Budget</Text>
        <Text style={styles.subheading}>Transaction auto-declined</Text>

        <View style={styles.detailCard}>
          <Text style={styles.merchant}>
            {transaction.merchant || 'Unknown Merchant'}
          </Text>
          <Text style={styles.txAmount}>
            {'\u00A3'}{transaction.amount?.toFixed(2)}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Running Total</Text>
            <Text style={styles.statValue}>
              {'\u00A3'}{runningTotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Over By</Text>
            <Text style={[styles.statValue, styles.overValue]}>
              {'\u00A3'}{overBy.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => handleDecision(false)}
          disabled={deciding}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => handleDecision(true)}
          disabled={deciding}
        >
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  heading: {
    color: '#ef4444',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subheading: {
    color: '#888',
    fontSize: 14,
    marginBottom: 32,
  },
  detailCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  merchant: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 8,
  },
  txAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  stat: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  overValue: {
    color: '#ef4444',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 36,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  declineButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
