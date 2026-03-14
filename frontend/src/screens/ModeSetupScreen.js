import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { getSettings, updateSettings } from '../api/client';

const USER_ID = 'demo-user';

export default function ModeSetupScreen({ navigation }) {
  const [blockEnabled, setBlockEnabled] = useState(false);
  const [blockThreshold, setBlockThreshold] = useState('50');

  const [hrEnabled, setHrEnabled] = useState(false);
  const [hrBudget, setHrBudget] = useState('60');
  const [hrWindowMinutes, setHrWindowMinutes] = useState('240');
  const [hrUnitLabel, setHrUnitLabel] = useState('');
  const [hrUnitCost, setHrUnitCost] = useState('');

  useEffect(() => {
    getSettings(USER_ID)
      .then((s) => {
        if (!s) return;
        setBlockEnabled(!!s.block_enabled);
        if (s.block_threshold != null) setBlockThreshold(String(s.block_threshold));
        setHrEnabled(!!s.high_risk_enabled);
        if (s.high_risk_budget != null) setHrBudget(String(s.high_risk_budget));
        if (s.high_risk_window_minutes != null) setHrWindowMinutes(String(s.high_risk_window_minutes));
        if (s.high_risk_unit_label) setHrUnitLabel(s.high_risk_unit_label);
        if (s.high_risk_unit_cost != null) setHrUnitCost(String(s.high_risk_unit_cost));
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    const payload = {
      block_enabled: blockEnabled,
      block_threshold: blockEnabled ? parseFloat(blockThreshold) || 0 : null,
      high_risk_enabled: hrEnabled,
      high_risk_budget: hrEnabled ? parseFloat(hrBudget) || 0 : null,
      high_risk_window_minutes: hrEnabled ? parseInt(hrWindowMinutes, 10) || 240 : null,
      high_risk_unit_label: hrEnabled && hrUnitLabel ? hrUnitLabel : null,
      high_risk_unit_cost: hrEnabled && hrUnitCost ? parseFloat(hrUnitCost) || null : null,
    };

    try {
      await updateSettings(USER_ID, payload);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Configure Modes</Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Block Mode</Text>
            <Switch
              value={blockEnabled}
              onValueChange={setBlockEnabled}
              trackColor={{ true: '#4ade80' }}
            />
          </View>
          <Text style={styles.sectionDesc}>
            Auto-decline individual purchases above a threshold. 40-second timer before you can approve.
          </Text>
          {blockEnabled && (
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Threshold ({'\u00A3'})</Text>
              <TextInput
                style={styles.input}
                value={blockThreshold}
                onChangeText={setBlockThreshold}
                keyboardType="numeric"
                placeholder="50"
                placeholderTextColor="#666"
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>High Risk Environment</Text>
            <Switch
              value={hrEnabled}
              onValueChange={setHrEnabled}
              trackColor={{ true: '#4ade80' }}
            />
          </View>
          <Text style={styles.sectionDesc}>
            Set a spending budget for a time window. Transactions exceeding the budget are auto-declined.
          </Text>
          {hrEnabled && (
            <>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Budget ({'\u00A3'})</Text>
                <TextInput
                  style={styles.input}
                  value={hrBudget}
                  onChangeText={setHrBudget}
                  keyboardType="numeric"
                  placeholder="60"
                  placeholderTextColor="#666"
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Window (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={hrWindowMinutes}
                  onChangeText={setHrWindowMinutes}
                  keyboardType="numeric"
                  placeholder="240"
                  placeholderTextColor="#666"
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Unit label (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={hrUnitLabel}
                  onChangeText={setHrUnitLabel}
                  placeholder="e.g. drinks"
                  placeholderTextColor="#666"
                />
              </View>
              {hrUnitLabel !== '' && (
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Cost per unit ({'\u00A3'})</Text>
                  <TextInput
                    style={styles.input}
                    value={hrUnitCost}
                    onChangeText={setHrUnitCost}
                    keyboardType="numeric"
                    placeholder="6"
                    placeholderTextColor="#666"
                  />
                </View>
              )}
            </>
          )}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scroll: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionDesc: {
    color: '#888',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  inputLabel: {
    color: '#ccc',
    fontSize: 14,
    flex: 1,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 16,
    width: 120,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#333',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
