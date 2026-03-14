import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSettings, getDemoTransactions, getModeSuggestion } from '../api/client';
import { colors, font } from '../theme';

const USER_ID = 'demo-user';

export default function HomeScreen({ navigation }) {
  const [settings, setSettings] = useState(null);
  const [transactions] = useState(getDemoTransactions());
  const [suggestion, setSuggestion] = useState(null);

  useFocusEffect(
    useCallback(() => {
      getSettings(USER_ID)
        .then(setSettings)
        .catch(() => setSettings(null));
      getModeSuggestion(USER_ID)
        .then(setSuggestion)
        .catch(() => setSuggestion(null));
    }, [])
  );

  const blockOn = settings?.block_enabled;
  const hrOn = settings?.high_risk_enabled;
  const remaining = settings?.high_risk_remaining ?? settings?.high_risk_budget;
  const budget = settings?.high_risk_budget;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.brand}>SpendZen</Text>

        {hrOn && budget != null ? (
          <View style={s.hero}>
            <Text style={s.heroLabel}>left to spend</Text>
            <Text style={s.heroAmount}>{'\u00A3'}{remaining}</Text>
            <View style={s.bar}>
              <View style={[s.barFill, { width: `${Math.min(100, (remaining / budget) * 100)}%` }]} />
            </View>
            <View style={s.heroMeta}>
              <Text style={s.heroSub}>{'\u00A3'}{budget} budget</Text>
              {settings.high_risk_unit_label ? (
                <Text style={s.heroSub}>
                  {Math.floor(remaining / (settings.high_risk_unit_cost || 1))} {settings.high_risk_unit_label} left
                </Text>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={s.hero}>
            <Text style={s.heroLabel}>all clear</Text>
            <Text style={[s.heroAmount, { fontSize: 32 }]}>No active budget</Text>
          </View>
        )}

        <View style={s.modes}>
          <TouchableOpacity
            style={s.modeRow}
            onPress={() => navigation.navigate('ModeSetup')}
            activeOpacity={0.6}
          >
            <View style={[s.dot, blockOn && s.dotOn]} />
            <Text style={s.modeText}>
              Block mode {blockOn ? `\u00B7 \u00A3${settings?.block_threshold} limit` : '\u00B7 off'}
            </Text>
            <Text style={s.arrow}>{'\u203A'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.modeRow}
            onPress={() => navigation.navigate('ModeSetup')}
            activeOpacity={0.6}
          >
            <View style={[s.dot, hrOn && s.dotOn]} />
            <Text style={s.modeText}>
              High risk {hrOn ? `\u00B7 \u00A3${budget} window` : '\u00B7 off'}
            </Text>
            <Text style={s.arrow}>{'\u203A'}</Text>
          </TouchableOpacity>
        </View>

        {suggestion?.has_suggestion && (
          <TouchableOpacity
            style={s.suggestionCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ModeSetup')}
          >
            <View style={s.suggestionDot} />
            <View style={{ flex: 1 }}>
              <Text style={s.suggestionTitle}>
                Smart suggestion: {suggestion.suggestion.mode === 'block' ? 'Block' : 'High Risk'} mode
              </Text>
              <Text style={s.suggestionReason}>{suggestion.suggestion.reason}</Text>
              <Text style={s.suggestionBudget}>
                Recommended: {'\u00A3'}{suggestion.suggestion.recommended_budget} · {Math.round(suggestion.suggestion.confidence * 100)}% confidence
              </Text>
            </View>
            <Text style={s.arrow}>{'\u203A'}</Text>
          </TouchableOpacity>
        )}

        <Text style={s.listLabel}>Transactions</Text>
        {transactions.map((tx) => (
          <View key={tx.id} style={s.tx}>
            <View style={s.txLeft}>
              <Text style={s.txName}>{tx.merchant}</Text>
              <Text style={s.txTime}>{tx.time}</Text>
            </View>
            <Text style={s.txAmount}>-{'\u00A3'}{tx.amount.toFixed(2)}</Text>
          </View>
        ))}

        <View style={s.demoSection}>
          <Text style={s.demoLabel}>Demo</Text>
          <View style={s.demoRow}>
            <TouchableOpacity
              style={s.demoBtn}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <Text style={[s.demoBtnText, { color: colors.brand }]}>Insights</Text>
            </TouchableOpacity>
          </View>
          <View style={[s.demoRow, { marginTop: 10 }]}>
            <TouchableOpacity
              style={s.demoBtn}
              onPress={() =>
                navigation.navigate('BlockPrompt', {
                  transaction: {
                    id: 'demo-block',
                    merchant: 'Apple Store',
                    amount: 999.00,
                    context_line: '\u00A3140 left until loan payment on Mar 28',
                  },
                  budget: budget || 60,
                  remaining: remaining || 42,
                  blocksToday: 3,
                  overridesLast30d: 7,
                })
              }
            >
              <Text style={[s.demoBtnText, { color: colors.red }]}>Block</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.demoBtn}
              onPress={() =>
                navigation.navigate('HighRiskOverlay', {
                  remaining: remaining || 42,
                  budget: budget || 60,
                  unitLabel: settings?.high_risk_unit_label || 'drinks',
                  unitCost: settings?.high_risk_unit_cost || 6,
                })
              }
            >
              <Text style={[s.demoBtnText, { color: colors.brand }]}>Under</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.demoBtn}
              onPress={() =>
                navigation.navigate('HighRiskPrompt', {
                  transaction: { id: 'demo-hr', merchant: 'Wetherspoons', amount: 24.00 },
                  runningTotal: 78,
                  budget: budget || 60,
                })
              }
            >
              <Text style={[s.demoBtnText, { color: colors.red }]}>Over</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 24 },

  brand: {
    fontFamily: font.bold,
    fontSize: 20,
    color: colors.text,
    marginTop: 20,
    marginBottom: 40,
  },

  hero: { marginBottom: 44 },
  heroLabel: {
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.sub,
    marginBottom: 6,
  },
  heroAmount: {
    fontFamily: font.bold,
    fontSize: 56,
    color: colors.text,
    letterSpacing: -2,
    marginBottom: 16,
  },
  bar: {
    height: 4,
    backgroundColor: colors.divider,
    borderRadius: 2,
  },
  barFill: {
    height: 4,
    backgroundColor: colors.brand,
    borderRadius: 2,
  },
  heroMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  heroSub: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.muted,
  },

  modes: {
    marginBottom: 40,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.muted,
    marginRight: 12,
  },
  dotOn: {
    backgroundColor: colors.brand,
  },
  modeText: {
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.sub,
    flex: 1,
  },
  arrow: {
    fontFamily: font.regular,
    fontSize: 20,
    color: colors.muted,
  },

  listLabel: {
    fontFamily: font.medium,
    fontSize: 13,
    color: colors.muted,
    marginBottom: 8,
  },
  tx: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  txLeft: { flex: 1 },
  txName: {
    fontFamily: font.medium,
    fontSize: 15,
    color: colors.text,
  },
  txTime: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  txAmount: {
    fontFamily: font.semi,
    fontSize: 15,
    color: colors.sub,
  },

  demoSection: {
    marginTop: 44,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    paddingTop: 16,
  },
  demoLabel: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.muted,
    marginBottom: 12,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  demoBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
    borderRadius: 6,
  },
  demoBtnText: {
    fontFamily: font.medium,
    fontSize: 13,
  },
});
