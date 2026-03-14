import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { getSettings, getModeSuggestion, getWallet, getSavings } from '../api/client';
import { colors, font } from '../theme';

const USER_ID = 'demo-user';

function formatTime(iso) {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatDate(iso) {
  const d = new Date(iso);
  const day = d.getDate();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${day} ${months[d.getMonth()]}`;
}

function StreakBadge({ days }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (days < 1) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [days, pulseAnim]);

  if (days < 1) return null;
  const label = days === 1 ? '1 day streak' : `${days} day streak`;
  return (
    <Animated.View style={[s.streakBadge, { transform: [{ scale: pulseAnim }] }]}>
      <Text style={s.streakFire}>{'\uD83D\uDD25'}</Text>
      <Text style={s.streakText}>{label}</Text>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }) {
  const [settings, setSettings] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [savings, setSavings] = useState(null);

  useFocusEffect(
    useCallback(() => {
      getSettings(USER_ID)
        .then(setSettings)
        .catch(() => setSettings(null));
      getModeSuggestion(USER_ID)
        .then(setSuggestion)
        .catch(() => setSuggestion(null));
      getWallet(USER_ID)
        .then(setWallet)
        .catch(() => setWallet(null));
      getSavings(USER_ID)
        .then(setSavings)
        .catch(() => setSavings(null));
    }, [])
  );

  const blockOn = settings?.block_enabled;
  const hrOn = settings?.high_risk_enabled;
  const remaining = settings?.high_risk_remaining ?? settings?.high_risk_budget;
  const budget = settings?.high_risk_budget;
  const vc = wallet?.virtual_card;
  const cards = wallet?.linked_cards || [];
  const txns = wallet?.recent_transactions || [];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.brand}>SpendPause</Text>

        <LinearGradient
          colors={['#0f1f1a', '#131325']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.card}
        >
          <View style={s.cardTop}>
            <Text style={s.cardLabel}>SpendPause</Text>
            <View style={[s.cardBadge, vc?.status === 'active' && s.cardBadgeActive]}>
              <Text style={[s.cardBadgeText, vc?.status === 'active' && s.cardBadgeTextActive]}>
                {vc?.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>
          </View>

          <Text style={s.cardBalance}>
            {'\u00A3'}{vc ? vc.total_balance.toLocaleString('en-GB', { minimumFractionDigits: 2 }) : '---'}
          </Text>
          <Text style={s.cardBalanceSub}>Total balance across {vc?.card_count || 0} accounts</Text>

          <View style={s.cardBottom}>
            <Text style={s.cardNumber}>
              {'\u2022\u2022\u2022\u2022'}  {'\u2022\u2022\u2022\u2022'}  {'\u2022\u2022\u2022\u2022'}  {vc?.last_four || '----'}
            </Text>
            <Text style={s.cardType}>VIRTUAL</Text>
          </View>
        </LinearGradient>

        {savings && savings.total_saved > 0 && (
          <View style={s.savingsCard}>
            <View style={s.savingsTop}>
              <View>
                <Text style={s.savingsLabel}>You saved</Text>
                <Text style={s.savingsAmount}>
                  {'\u00A3'}{savings.saved_this_week.toFixed(2)}
                  <Text style={s.savingsPeriod}> this week</Text>
                </Text>
              </View>
              <StreakBadge days={savings.streak_days} />
            </View>
            <View style={s.savingsStats}>
              <View style={s.savingsStat}>
                <Text style={s.savingsStatNum}>{'\u00A3'}{savings.total_saved.toFixed(0)}</Text>
                <Text style={s.savingsStatLabel}>total saved</Text>
              </View>
              <View style={s.savingsDivider} />
              <View style={s.savingsStat}>
                <Text style={s.savingsStatNum}>{savings.impulses_stopped}</Text>
                <Text style={s.savingsStatLabel}>impulses stopped</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={s.sectionLabel}>Linked accounts</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.linkedRow}
          contentContainerStyle={s.linkedContent}
        >
          {cards.map((c) => (
            <View key={c.id} style={[s.linkedCard, { borderColor: c.color + '44' }]}>
              <View style={[s.linkedDot, { backgroundColor: c.color }]} />
              <View>
                <Text style={s.linkedName}>{c.card_name}</Text>
                <Text style={s.linkedMeta}>
                  {c.card_type.toUpperCase()} {'\u00B7'} {c.last_four}
                </Text>
              </View>
              <Text style={s.linkedBalance}>
                {'\u00A3'}{c.balance.toFixed(0)}
              </Text>
            </View>
          ))}
        </ScrollView>

        {hrOn && budget != null && (
          <View style={s.budgetBar}>
            <View style={s.budgetTop}>
              <Text style={s.budgetLabel}>Tonight's budget</Text>
              <Text style={s.budgetAmount}>
                {'\u00A3'}{remaining} <Text style={s.budgetOf}>/ {'\u00A3'}{budget}</Text>
              </Text>
            </View>
            <View style={s.bar}>
              <View style={[s.barFill, { width: `${Math.min(100, (remaining / budget) * 100)}%` }]} />
            </View>
            {settings.high_risk_unit_label ? (
              <Text style={s.budgetUnits}>
                ~{Math.floor(remaining / (settings.high_risk_unit_cost || 1))} {settings.high_risk_unit_label} left
              </Text>
            ) : null}
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
                Recommended: {'\u00A3'}{suggestion.suggestion.recommended_budget} {'\u00B7'} {Math.round(suggestion.suggestion.confidence * 100)}% confidence
              </Text>
            </View>
            <Text style={s.arrow}>{'\u203A'}</Text>
          </TouchableOpacity>
        )}

        <Text style={s.sectionLabel}>Transactions</Text>
        {txns.map((tx) => (
          <View key={tx.id} style={s.tx}>
            <View style={s.txLeft}>
              <Text style={s.txName}>{tx.merchant}</Text>
              <View style={s.txMeta}>
                <View style={[s.txDot, { backgroundColor: tx.source_color }]} />
                <Text style={s.txSource}>{tx.source_card}</Text>
                <Text style={s.txTime}>{'\u00B7'} {formatDate(tx.timestamp)} {formatTime(tx.timestamp)}</Text>
              </View>
            </View>
            <View style={s.txRight}>
              <Text style={[s.txAmount, tx.was_blocked && s.txAmountBlocked]}>
                -{'\u00A3'}{tx.amount.toFixed(2)}
              </Text>
              {tx.was_blocked && <Text style={s.txBlocked}>BLOCKED</Text>}
            </View>
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
    marginBottom: 28,
  },

  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.brand + '18',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  cardLabel: {
    fontFamily: font.semi,
    fontSize: 14,
    color: colors.sub,
    letterSpacing: 1,
  },
  cardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: colors.muted + '33',
  },
  cardBadgeActive: {
    backgroundColor: colors.brand + '22',
  },
  cardBadgeText: {
    fontFamily: font.semi,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1,
  },
  cardBadgeTextActive: {
    color: colors.brand,
  },
  cardBalance: {
    fontFamily: font.bold,
    fontSize: 42,
    color: colors.text,
    letterSpacing: -1.5,
  },
  cardBalanceSub: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
    marginBottom: 28,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNumber: {
    fontFamily: font.medium,
    fontSize: 14,
    color: colors.muted,
    letterSpacing: 2,
  },
  cardType: {
    fontFamily: font.semi,
    fontSize: 11,
    color: colors.sub,
    letterSpacing: 2,
  },

  savingsCard: {
    backgroundColor: colors.brandDim,
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.brand + '30',
  },
  savingsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  savingsLabel: {
    fontFamily: font.medium,
    fontSize: 13,
    color: colors.brand,
  },
  savingsAmount: {
    fontFamily: font.bold,
    fontSize: 28,
    color: colors.text,
    letterSpacing: -1,
    marginTop: 2,
  },
  savingsPeriod: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.muted,
  },
  savingsStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingsStat: {
    flex: 1,
  },
  savingsStatNum: {
    fontFamily: font.semi,
    fontSize: 18,
    color: colors.text,
  },
  savingsStatLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  savingsDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.brand + '33',
    marginHorizontal: 16,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1800',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#ff8c0044',
    gap: 4,
  },
  streakFire: {
    fontSize: 14,
  },
  streakText: {
    fontFamily: font.semi,
    fontSize: 12,
    color: '#ff8c00',
  },

  sectionLabel: {
    fontFamily: font.medium,
    fontSize: 13,
    color: colors.muted,
    marginBottom: 12,
  },

  linkedRow: {
    marginBottom: 28,
    marginHorizontal: -24,
  },
  linkedContent: {
    paddingHorizontal: 24,
    gap: 10,
  },
  linkedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    gap: 10,
    flexShrink: 0,
  },
  linkedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  linkedName: {
    fontFamily: font.medium,
    fontSize: 13,
    color: colors.text,
  },
  linkedMeta: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  linkedBalance: {
    fontFamily: font.semi,
    fontSize: 14,
    color: colors.sub,
    marginLeft: 8,
  },

  budgetBar: {
    backgroundColor: colors.brandDim,
    borderRadius: 12,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.brand + '22',
  },
  budgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  budgetLabel: {
    fontFamily: font.medium,
    fontSize: 13,
    color: colors.brand,
  },
  budgetAmount: {
    fontFamily: font.semi,
    fontSize: 15,
    color: colors.text,
  },
  budgetOf: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.muted,
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
  budgetUnits: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 8,
  },

  modes: {
    marginBottom: 24,
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

  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandDim,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.brand + '33',
  },
  suggestionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
    marginRight: 12,
  },
  suggestionTitle: {
    fontFamily: font.semi,
    fontSize: 14,
    color: colors.brand,
  },
  suggestionReason: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.sub,
    marginTop: 3,
  },
  suggestionBudget: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
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
  txMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 5,
  },
  txDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  txSource: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.sub,
  },
  txTime: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.muted,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontFamily: font.semi,
    fontSize: 15,
    color: colors.sub,
  },
  txAmountBlocked: {
    color: colors.red,
  },
  txBlocked: {
    fontFamily: font.semi,
    fontSize: 9,
    color: colors.red,
    letterSpacing: 0.5,
    marginTop: 2,
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
