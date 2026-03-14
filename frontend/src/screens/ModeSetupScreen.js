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
import * as Haptics from 'expo-haptics';
import { getSettings, updateSettings } from '../api/client';
import { colors, font } from '../theme';

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    navigation.goBack();
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={16}>
          <Text style={s.back}>{'\u2190'} Back</Text>
        </TouchableOpacity>

        <Text style={s.title}>Settings</Text>

        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionName}>Block mode</Text>
            <Switch
              value={blockEnabled}
              onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBlockEnabled(v); }}
              trackColor={{ false: colors.divider, true: colors.brand }}
              thumbColor="#fff"
            />
          </View>
          <Text style={s.desc}>
            Blocks purchases above a threshold. You get a cooldown period to reconsider before you can approve.
          </Text>
          {blockEnabled && (
            <Row label="Threshold" prefix="\u00A3" value={blockThreshold} onChange={setBlockThreshold} />
          )}
        </View>

        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionName}>High risk environment</Text>
            <Switch
              value={hrEnabled}
              onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setHrEnabled(v); }}
              trackColor={{ false: colors.divider, true: colors.brand }}
              thumbColor="#fff"
            />
          </View>
          <Text style={s.desc}>
            Sets a spending budget for a time window. Anything over budget gets auto-declined.
          </Text>
          {hrEnabled && (
            <>
              <Row label="Budget" prefix="\u00A3" value={hrBudget} onChange={setHrBudget} />
              <Row label="Window" suffix="min" value={hrWindowMinutes} onChange={setHrWindowMinutes} />
              <Row label="Unit label" value={hrUnitLabel} onChange={setHrUnitLabel} placeholder="e.g. drinks" text />
              {hrUnitLabel !== '' && (
                <Row label="Cost per unit" prefix="\u00A3" value={hrUnitCost} onChange={setHrUnitCost} />
              )}
            </>
          )}
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.7}>
          <Text style={s.saveBtnText}>Save</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, prefix, suffix, value, onChange, placeholder, text }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <View style={s.rowInput}>
        {prefix && <Text style={s.rowFix}>{prefix}</Text>}
        <TextInput
          style={s.input}
          value={value}
          onChangeText={onChange}
          keyboardType={text ? 'default' : 'numeric'}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
        />
        {suffix && <Text style={s.rowFix}>{suffix}</Text>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 24 },

  back: {
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.brand,
    marginTop: 16,
  },
  title: {
    fontFamily: font.bold,
    fontSize: 28,
    color: colors.text,
    letterSpacing: -0.5,
    marginTop: 24,
    marginBottom: 36,
  },

  section: {
    marginBottom: 32,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionName: {
    fontFamily: font.semi,
    fontSize: 17,
    color: colors.text,
  },
  desc: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowLabel: {
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.sub,
    flex: 1,
  },
  rowInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowFix: {
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.muted,
  },
  input: {
    fontFamily: font.semi,
    fontSize: 16,
    color: colors.text,
    textAlign: 'right',
    minWidth: 60,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },

  saveBtn: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    fontFamily: font.semi,
    fontSize: 16,
    color: '#050506',
  },
});
