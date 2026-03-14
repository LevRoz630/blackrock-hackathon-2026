import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { getDemoSteps, getTotalSteps } from '../services/demoSequence';
import { colors, font } from '../theme';

export default function DemoScreen({ navigation }) {
  const steps = useRef(getDemoSteps()).current;
  const total = getTotalSteps();
  const [stepIndex, setStepIndex] = useState(0);
  const [visited, setVisited] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    React.useCallback(() => {
      if (visited) {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        setStepIndex((i) => Math.min(i + 1, total));
      }
    }, [visited, fadeAnim, total])
  );

  const step = stepIndex < total ? steps[stepIndex] : null;
  const done = stepIndex >= total;

  const handleShowScreen = () => {
    if (!step) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVisited(true);
    navigation.navigate(step.screen, step.params);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fadeAnim.setValue(0);
    setStepIndex((i) => i + 1);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  const handleRestart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStepIndex(0);
    setVisited(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={16}>
          <Text style={s.back}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        {!done && (
          <Text style={s.counter}>{stepIndex + 1} / {total}</Text>
        )}
      </View>

      <Animated.View style={[s.body, { opacity: fadeAnim }]}>
        {done ? (
          <View style={s.doneWrap}>
            <Text style={s.doneTitle}>That's SpendPause</Text>
            <Text style={s.doneSubtitle}>
              Real-time behavioural friction backed by ML and research. Impulse spending, paused.
            </Text>
            <TouchableOpacity style={s.restartBtn} onPress={handleRestart} activeOpacity={0.7}>
              <Text style={s.restartText}>Run again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={s.progress}>
              {steps.map((_, i) => (
                <View key={i} style={[s.dot, i <= stepIndex && s.dotActive]} />
              ))}
            </View>

            <Text style={s.stepTitle}>{step.title}</Text>
            <Text style={s.narrative}>{step.narrative}</Text>
          </>
        )}
      </Animated.View>

      {!done && (
        <View style={s.bottom}>
          <View style={s.btnRow}>
            <TouchableOpacity style={s.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
              <Text style={s.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.showBtn} onPress={handleShowScreen} activeOpacity={0.7}>
              <Text style={s.showText}>Show me</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  back: {
    fontFamily: font.medium,
    fontSize: 15,
    color: colors.brand,
  },
  counter: {
    fontFamily: font.medium,
    fontSize: 13,
    color: colors.muted,
  },

  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  progress: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 32,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
  },
  dotActive: {
    backgroundColor: colors.brand,
  },

  stepTitle: {
    fontFamily: font.bold,
    fontSize: 28,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  narrative: {
    fontFamily: font.regular,
    fontSize: 16,
    color: colors.sub,
    lineHeight: 24,
  },

  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  skipText: {
    fontFamily: font.semi,
    fontSize: 16,
    color: colors.muted,
  },
  showBtn: {
    flex: 2,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.brand,
  },
  showText: {
    fontFamily: font.semi,
    fontSize: 16,
    color: '#050506',
  },

  doneWrap: {
    alignItems: 'center',
  },
  doneTitle: {
    fontFamily: font.bold,
    fontSize: 28,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  doneSubtitle: {
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  restartBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.brand + '44',
  },
  restartText: {
    fontFamily: font.semi,
    fontSize: 15,
    color: colors.brand,
  },
});
