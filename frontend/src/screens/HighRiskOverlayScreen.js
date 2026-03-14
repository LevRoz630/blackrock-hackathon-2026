import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { colors, font } from '../theme';

const AUTO_DISMISS_MS = 3000;

export default function HighRiskOverlayScreen({ route, navigation }) {
  const { remaining, budget, unitLabel, unitCost } = route.params;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(progress, {
      toValue: 1,
      duration: AUTO_DISMISS_MS,
      useNativeDriver: false,
    }).start();
    const t = setTimeout(() => navigation.goBack(), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [navigation, progress]);

  const unitsLeft = unitLabel && unitCost ? Math.floor(remaining / unitCost) : null;

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['100%', '0%'],
  });

  return (
    <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
      <BlurView intensity={40} tint="dark" style={s.backdrop}>
        <View style={s.card}>
          <Text style={s.amount}>{'\u00A3'}{remaining.toFixed(2)}</Text>
          <Text style={s.sub}>
            of {'\u00A3'}{budget.toFixed(2)} remaining
          </Text>
          {unitsLeft != null && (
            <Text style={s.units}>
              ~{unitsLeft} {unitLabel} left
            </Text>
          )}
          <View style={s.timerTrack}>
            <Animated.View style={[s.timerFill, { width: barWidth }]} />
          </View>
        </View>
      </BlurView>
    </TouchableWithoutFeedback>
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
    paddingTop: 40,
    paddingBottom: 24,
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
  timerTrack: {
    width: '100%',
    height: 3,
    backgroundColor: colors.divider,
    borderRadius: 2,
    marginTop: 24,
    overflow: 'hidden',
  },
  timerFill: {
    height: 3,
    backgroundColor: colors.brand,
    borderRadius: 2,
  },
});
