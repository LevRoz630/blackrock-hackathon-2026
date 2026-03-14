import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, font } from '../theme';

const AUTO_DISMISS_MS = 3000;

export default function HighRiskOverlayScreen({ route, navigation }) {
  const { remaining, budget, unitLabel, unitCost } = route.params;

  useEffect(() => {
    const t = setTimeout(() => navigation.goBack(), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [navigation]);

  const unitsLeft = unitLabel && unitCost ? Math.floor(remaining / unitCost) : null;

  return (
    <BlurView intensity={40} tint="dark" style={s.backdrop}>
      <View style={s.card}>
        <Text style={s.amount}>{'\u00A3'}{remaining.toFixed(2)}</Text>
        <Text style={s.sub}>
          of {'\u00A3'}{budget.toFixed(2)} remaining
        </Text>
        {unitsLeft != null && (
          <Text style={s.units}>
            {unitsLeft} {unitLabel} left
          </Text>
        )}
      </View>
    </BlurView>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  amount: {
    fontFamily: font.bold,
    fontSize: 52,
    color: colors.brand,
    letterSpacing: -2,
  },
  sub: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.muted,
    marginTop: 8,
  },
  units: {
    fontFamily: font.medium,
    fontSize: 16,
    color: colors.sub,
    marginTop: 16,
  },
});
