import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const AUTO_DISMISS_MS = 3000;

export default function HighRiskOverlayScreen({ route, navigation }) {
  const { remaining, budget, unitLabel, unitCost } = route.params;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.goBack();
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [navigation]);

  const unitsLeft =
    unitLabel && unitCost ? Math.floor(remaining / unitCost) : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Remaining Budget</Text>
        <Text style={styles.amount}>
          {'\u00A3'}{remaining.toFixed(2)}
        </Text>
        <Text style={styles.ofBudget}>
          of {'\u00A3'}{budget.toFixed(2)}
        </Text>
        {unitsLeft != null && (
          <Text style={styles.unitText}>
            ~{unitsLeft} {unitLabel} left
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 40,
    borderWidth: 1,
    borderColor: '#333',
  },
  label: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
  },
  amount: {
    color: '#4ade80',
    fontSize: 48,
    fontWeight: '700',
  },
  ofBudget: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  unitText: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 12,
  },
});
