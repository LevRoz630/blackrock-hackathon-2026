import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDashboard } from '../api/client';
import { colors, font } from '../theme';

const USER_ID = 'demo-user';

const RISK_COLORS = { high: '#ff5252', medium: '#e6a817', low: '#1a6b4a' };

function StatCard({ label, value, sub }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {sub ? <Text style={s.statSub}>{sub}</Text> : null}
    </View>
  );
}

function HBar({ label, value, maxValue, color }) {
  const pct = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0;
  return (
    <View style={s.hbarRow}>
      <Text style={s.hbarLabel} numberOfLines={1}>{label}</Text>
      <View style={s.hbarTrack}>
        <View style={[s.hbarFill, { width: `${pct}%`, backgroundColor: color || colors.brand }]} />
      </View>
      <Text style={s.hbarValue}>{typeof value === 'number' ? value.toFixed(0) : value}</Text>
    </View>
  );
}

function MiniBarChart({ data, valueKey, labelKey, color, height = 60 }) {
  const maxVal = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <View style={[s.miniChart, { height }]}>
      {data.map((d, i) => {
        const h = maxVal > 0 ? ((d[valueKey] || 0) / maxVal) * (height - 16) : 0;
        return (
          <View key={i} style={s.miniBarCol}>
            <View style={[s.miniBar, { height: h, backgroundColor: color || colors.brand }]} />
            <Text style={s.miniBarLabel}>{d[labelKey] ?? i}</Text>
          </View>
        );
      })}
    </View>
  );
}

function PulsingDot({ size, color }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity,
    }} />
  );
}

const MAP_IMG = require('../../assets/st-andrews-dark.png');

function RiskMap({ data }) {
  const [tooltip, setTooltip] = useState(null);
  if (!data || data.length === 0) return null;

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <View style={s.mapCard}>
      <Text style={s.mapTitle}>St Andrews risk map</Text>
      <View style={s.mapContainer}>
        <Image source={MAP_IMG} style={s.mapImage} resizeMode="cover" />

        {data.map((m) => {
          const dotSize = 6 + ((m.count / maxCount) * 6);
          const dotColor = RISK_COLORS[m.risk_level];
          const isHigh = m.risk_level === 'high';
          return (
            <TouchableOpacity
              key={m.name}
              activeOpacity={0.7}
              onPress={() => setTooltip(tooltip === m.name ? null : m.name)}
              style={[s.dotWrap, {
                left: `${m.x}%`,
                top: `${m.y}%`,
                marginLeft: -dotSize / 2,
                marginTop: -dotSize / 2,
              }]}
            >
              {isHigh ? (
                <PulsingDot size={dotSize} color={dotColor} />
              ) : (
                <View style={{
                  width: dotSize, height: dotSize, borderRadius: dotSize / 2,
                  backgroundColor: dotColor, opacity: 0.75,
                }} />
              )}
              {tooltip === m.name && (
                <View style={s.tooltip}>
                  <Text style={s.tooltipText}>{m.name}</Text>
                  <Text style={s.tooltipSub}>{'£'}{m.total_spent.toFixed(0)} ({m.count}x)</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={s.legendRow}>
        {['high', 'medium', 'low'].map(level => (
          <View key={level} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: RISK_COLORS[level] }]} />
            <Text style={s.legendText}>{level}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function WeeklyBudget({ summary }) {
  if (!summary) return null;
  const { weekly_budget, weekly_spent, weekly_remaining, nightly_breakdown, nightly_sub_budget } = summary;
  const weekPct = weekly_budget > 0 ? Math.min(100, (weekly_spent / weekly_budget) * 100) : 0;
  const weekColor = weekPct >= 100 ? colors.red : weekPct >= 80 ? '#e6a817' : colors.brand;

  return (
    <View style={s.weekCard}>
      <Text style={s.weekTitle}>Weekly budget</Text>
      <Text style={s.weekAmount}>
        {'£'}{weekly_spent.toFixed(0)} of {'£'}{weekly_budget.toFixed(0)} this week
      </Text>
      <View style={s.weekTrack}>
        <View style={[s.weekFill, { width: `${weekPct}%`, backgroundColor: weekColor }]} />
      </View>
      <Text style={[s.weekRemaining, { color: weekly_remaining < 0 ? colors.red : colors.sub }]}>
        {'£'}{Math.abs(weekly_remaining).toFixed(0)} {weekly_remaining >= 0 ? 'remaining' : 'over'}
      </Text>

      {nightly_breakdown.length > 0 && (
        <>
          <Text style={s.nightsLabel}>Nightly breakdown</Text>
          {nightly_breakdown.map((n) => {
            const pct = Math.min(100, n.pct_used);
            const barColor = pct >= 100 ? colors.red : pct >= 80 ? '#e6a817' : colors.brand;
            return (
              <View key={n.date} style={s.nightRow}>
                <Text style={s.nightDate}>{n.date.slice(5)}</Text>
                <View style={s.nightTrack}>
                  <View style={[s.nightFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                </View>
                <Text style={s.nightVal}>
                  {'£'}{n.total.toFixed(0)}/{'£'}{nightly_sub_budget.toFixed(0)}
                </Text>
              </View>
            );
          })}
        </>
      )}
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getDashboard(USER_ID)
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator color={colors.brand} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!data || data.status === 'no_data') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={{ padding: 24 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.back}>{'\u2190'} Back</Text>
          </TouchableOpacity>
          <Text style={[s.sectionTitle, { marginTop: 40 }]}>No insights yet</Text>
          <Text style={s.statSub}>Start using your card and insights will appear here.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { stats, overrides, risk_distribution, top_merchants, hourly_heatmap, daily_heatmap, outliers, risk_map, weekly_summary } = data;
  const riskMax = Math.max(...risk_distribution, 1);
  const merchantMax = top_merchants.length > 0 ? top_merchants[0].total : 1;
  const riskLabels = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-100'];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>{'\u2190'} Back</Text>
        </TouchableOpacity>

        <Text style={s.title}>Insights</Text>

        <View style={s.statGrid}>
          <StatCard label="Transactions" value={stats.total_transactions} />
          <StatCard label="Total spent" value={`£${stats.total_spent.toFixed(0)}`} />
          <StatCard
            label="Override rate"
            value={`${(overrides.override_rate * 100).toFixed(0)}%`}
            sub={`${overrides.override_count}/${overrides.blocked_count} blocked`}
          />
          <StatCard
            label="Avg decision"
            value={`${(overrides.avg_decision_latency_ms / 1000).toFixed(1)}s`}
          />
        </View>

        <RiskMap data={risk_map} />

        <WeeklyBudget summary={weekly_summary} />

        <View style={s.profileCard}>
          <Text style={s.profileLabel}>Spending profile</Text>
          <View style={s.profileRow}>
            <View style={s.profileItem}>
              <Text style={s.profileValue}>{'£'}{stats.avg_amount.toFixed(2)}</Text>
              <Text style={s.profileSub}>avg</Text>
            </View>
            <View style={s.profileItem}>
              <Text style={s.profileValue}>{'£'}{stats.std_amount.toFixed(2)}</Text>
              <Text style={s.profileSub}>std dev</Text>
            </View>
            <View style={s.profileItem}>
              <Text style={s.profileValue}>{'£'}{stats.suggested_threshold.toFixed(0)}</Text>
              <Text style={s.profileSub}>suggested limit</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionTitle}>Risk distribution</Text>
        {risk_distribution.map((count, i) => (
          <HBar
            key={i}
            label={riskLabels[i]}
            value={count}
            maxValue={riskMax}
            color={i >= 7 ? colors.red : i >= 4 ? '#e6a817' : colors.brand}
          />
        ))}

        <Text style={s.sectionTitle}>Top merchants</Text>
        {top_merchants.map((m) => (
          <HBar
            key={m.name}
            label={m.name}
            value={m.total}
            maxValue={merchantMax}
          />
        ))}

        <Text style={s.sectionTitle}>Hourly activity</Text>
        <MiniBarChart
          data={hourly_heatmap}
          valueKey="count"
          labelKey="hour"
          height={70}
        />

        <Text style={s.sectionTitle}>Daily activity</Text>
        <MiniBarChart
          data={daily_heatmap}
          valueKey="total"
          labelKey="day"
          color="#6c5ce7"
          height={60}
        />

        {outliers.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Outlier transactions</Text>
            {outliers.map((o, i) => (
              <View key={i} style={s.outlierRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.outlierMerchant}>{o.merchant}</Text>
                  <Text style={s.outlierTime}>{o.timestamp.slice(0, 16).replace('T', ' ')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.outlierAmount}>{'£'}{o.amount.toFixed(2)}</Text>
                  <Text style={s.outlierRisk}>risk {o.risk_score}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 24 },
  back: { fontFamily: font.medium, fontSize: 15, color: colors.brand, marginTop: 16 },
  title: { fontFamily: font.bold, fontSize: 28, color: colors.text, marginTop: 20, marginBottom: 24, letterSpacing: -1 },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  statValue: { fontFamily: font.bold, fontSize: 24, color: colors.text, letterSpacing: -1 },
  statLabel: { fontFamily: font.regular, fontSize: 12, color: colors.muted, marginTop: 4 },
  statSub: { fontFamily: font.regular, fontSize: 11, color: colors.sub, marginTop: 2 },

  // Risk Map
  mapCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  mapTitle: { fontFamily: font.medium, fontSize: 13, color: colors.muted, marginBottom: 12 },
  mapContainer: {
    width: '100%',
    aspectRatio: 800 / 600,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.95,
  },
  dotWrap: {
    position: 'absolute',
    zIndex: 2,
    alignItems: 'center',
  },
  tooltip: {
    position: 'absolute',
    top: -36,
    backgroundColor: '#222230',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    zIndex: 10,
  },
  tooltipText: { fontFamily: font.medium, fontSize: 10, color: colors.text },
  tooltipSub: { fontFamily: font.regular, fontSize: 9, color: colors.sub },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: font.regular, fontSize: 10, color: colors.muted },

  // Weekly Budget
  weekCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  weekTitle: { fontFamily: font.medium, fontSize: 13, color: colors.muted, marginBottom: 8 },
  weekAmount: { fontFamily: font.semi, fontSize: 16, color: colors.text, marginBottom: 8 },
  weekTrack: { height: 8, backgroundColor: colors.divider, borderRadius: 4, overflow: 'hidden' },
  weekFill: { height: 8, borderRadius: 4 },
  weekRemaining: { fontFamily: font.regular, fontSize: 12, marginTop: 6 },
  nightsLabel: { fontFamily: font.medium, fontSize: 12, color: colors.muted, marginTop: 14, marginBottom: 8 },
  nightRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  nightDate: { fontFamily: font.regular, fontSize: 10, color: colors.muted, width: 40 },
  nightTrack: { flex: 1, height: 5, backgroundColor: colors.divider, borderRadius: 3, marginHorizontal: 8, overflow: 'hidden' },
  nightFill: { height: 5, borderRadius: 3 },
  nightVal: { fontFamily: font.regular, fontSize: 10, color: colors.sub, width: 56, textAlign: 'right' },

  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 28,
  },
  profileLabel: { fontFamily: font.medium, fontSize: 13, color: colors.muted, marginBottom: 12 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between' },
  profileItem: { alignItems: 'center' },
  profileValue: { fontFamily: font.semi, fontSize: 18, color: colors.text },
  profileSub: { fontFamily: font.regular, fontSize: 11, color: colors.muted, marginTop: 2 },

  sectionTitle: { fontFamily: font.medium, fontSize: 14, color: colors.sub, marginBottom: 12, marginTop: 8 },

  hbarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  hbarLabel: { fontFamily: font.regular, fontSize: 11, color: colors.muted, width: 54 },
  hbarTrack: { flex: 1, height: 6, backgroundColor: colors.divider, borderRadius: 3, marginHorizontal: 8 },
  hbarFill: { height: 6, borderRadius: 3 },
  hbarValue: { fontFamily: font.medium, fontSize: 11, color: colors.sub, width: 36, textAlign: 'right' },

  miniChart: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 20 },
  miniBarCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  miniBar: { width: 6, borderRadius: 3, minHeight: 1 },
  miniBarLabel: { fontFamily: font.regular, fontSize: 8, color: colors.muted, marginTop: 3 },

  outlierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  outlierMerchant: { fontFamily: font.medium, fontSize: 14, color: colors.text },
  outlierTime: { fontFamily: font.regular, fontSize: 11, color: colors.muted, marginTop: 2 },
  outlierAmount: { fontFamily: font.semi, fontSize: 14, color: colors.red },
  outlierRisk: { fontFamily: font.regular, fontSize: 11, color: colors.muted, marginTop: 2 },
});
