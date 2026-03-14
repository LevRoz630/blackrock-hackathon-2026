import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSettings } from '../api/client';

const USER_ID = 'demo-user';

export default function HomeScreen({ navigation }) {
  const [settings, setSettings] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useFocusEffect(
    useCallback(() => {
      getSettings(USER_ID)
        .then(setSettings)
        .catch(() => setSettings(null));
    }, [])
  );

  const blockActive = settings?.block_enabled;
  const hrActive = settings?.high_risk_enabled;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Think Before You Spend</Text>

      <View style={styles.modesRow}>
        <View style={[styles.modeBadge, blockActive && styles.modeBadgeActive]}>
          <Text style={styles.modeBadgeText}>
            Block {blockActive ? 'ON' : 'OFF'}
          </Text>
          {blockActive && settings?.block_threshold != null && (
            <Text style={styles.modeDetail}>
              Threshold: {'\u00A3'}{settings.block_threshold}
            </Text>
          )}
        </View>

        <View style={[styles.modeBadge, hrActive && styles.modeBadgeActive]}>
          <Text style={styles.modeBadgeText}>
            High Risk {hrActive ? 'ON' : 'OFF'}
          </Text>
          {hrActive && settings?.high_risk_budget != null && (
            <Text style={styles.modeDetail}>
              Budget: {'\u00A3'}{settings.high_risk_budget}
            </Text>
          )}
        </View>
      </View>

      {hrActive && settings?.high_risk_budget != null && (
        <View style={styles.budgetCard}>
          <Text style={styles.budgetLabel}>Remaining Budget</Text>
          <Text style={styles.budgetAmount}>
            {'\u00A3'}{settings.high_risk_remaining ?? settings.high_risk_budget}
          </Text>
          {settings.high_risk_unit_label && (
            <Text style={styles.budgetUnit}>
              ~{Math.floor((settings.high_risk_remaining ?? settings.high_risk_budget) / (settings.high_risk_unit_cost || 1))}{' '}
              {settings.high_risk_unit_label} left
            </Text>
          )}
        </View>
      )}

      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      {transactions.length === 0 ? (
        <Text style={styles.emptyText}>No transactions yet</Text>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.txRow}>
              <Text style={styles.txMerchant}>{item.merchant}</Text>
              <Text style={styles.txAmount}>{'\u00A3'}{item.amount}</Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('ModeSetup')}
      >
        <Text style={styles.settingsButtonText}>Configure Modes</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  modesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  modeBadge: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  modeBadgeActive: {
    borderColor: '#4ade80',
    backgroundColor: '#0d1f0d',
  },
  modeBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modeDetail: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
  budgetCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  budgetLabel: {
    color: '#aaa',
    fontSize: 13,
  },
  budgetAmount: {
    color: '#4ade80',
    fontSize: 36,
    fontWeight: '700',
    marginTop: 4,
  },
  budgetUnit: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 20,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  txMerchant: {
    color: '#fff',
    fontSize: 14,
  },
  txAmount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    marginTop: 'auto',
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
