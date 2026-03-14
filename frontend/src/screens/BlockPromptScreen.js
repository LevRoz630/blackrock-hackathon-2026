import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { decideTransaction } from '../api/client';

const TIMER_SECONDS = 40;

export default function BlockPromptScreen({ route, navigation }) {
  const { transaction } = route.params;
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [deciding, setDeciding] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, []);

  const timerDone = secondsLeft === 0;

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

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timerDisplay = `${minutes}:${secs.toString().padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.timerRing}>
          <Text style={styles.timerText}>{timerDisplay}</Text>
        </View>

        <Text style={styles.heading}>Transaction Blocked</Text>

        <View style={styles.detailCard}>
          <Text style={styles.merchant}>
            {transaction.merchant || 'Unknown Merchant'}
          </Text>
          <Text style={styles.amount}>
            {'\u00A3'}{transaction.amount?.toFixed(2)}
          </Text>
        </View>

        {transaction.context_line && (
          <Text style={styles.contextLine}>{transaction.context_line}</Text>
        )}

        {!timerDone && (
          <Text style={styles.waitText}>
            Wait {secondsLeft}s before you can approve
          </Text>
        )}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.declineButton]}
          onPress={() => handleDecision(false)}
          disabled={deciding}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.approveButton,
            !timerDone && styles.approveButtonDisabled,
          ]}
          onPress={() => handleDecision(true)}
          disabled={!timerDone || deciding}
        >
          <Text
            style={[
              styles.approveButtonText,
              !timerDone && styles.approveButtonTextDisabled,
            ]}
          >
            Approve
          </Text>
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
  timerRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  timerText: {
    color: '#ef4444',
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  heading: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
  },
  detailCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  merchant: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 8,
  },
  amount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
  },
  contextLine: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  waitText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 8,
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
  approveButtonDisabled: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  approveButtonTextDisabled: {
    color: '#555',
  },
});
