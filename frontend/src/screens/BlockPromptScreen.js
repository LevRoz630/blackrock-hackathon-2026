import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { decideTransaction } from '../api/client';
import { colors, font } from '../theme';

const USER_ID = 'demo-user';
const BASE_SECONDS = 40;

function computeWaitSeconds({ amount, blocksToday, overridesLast30d }) {
  const amountFactor = Math.min(amount / 200, 1);
  const overrideFactor = Math.min((overridesLast30d || 0) / 10, 1);

  const hour = new Date().getHours();
  const isLateNight = hour >= 22 || hour < 2;
  const timeFactor = isLateNight ? 0.5 : 0;

  const velocityFactor = (blocksToday || 0) > 2 ? 0.5 : 0;

  const bonus = 50 * (
    0.4 * amountFactor +
    0.3 * overrideFactor +
    0.15 * timeFactor +
    0.15 * velocityFactor
  );

  return Math.round(Math.min(Math.max(BASE_SECONDS + bonus, 40), 90));
}

function buildPrompts({ transaction, budget, remaining, blocksToday, overridesLast30d }) {
  const prompts = [];
  if (budget && remaining != null) {
    const pct = Math.round((transaction.amount / budget) * 100);
    prompts.push(`This is ${pct}% of your total budget.`);
    prompts.push(`You have \u00A3${remaining.toFixed(2)} left this window.`);
  }
  if (blocksToday > 0) {
    prompts.push(`${blocksToday} transactions blocked today.`);
  }
  if (overridesLast30d > 0) {
    prompts.push(`You've overridden ${overridesLast30d} blocks this month.`);
  }
  prompts.push('Will you still want this tomorrow morning?');
  if (transaction.context_line) {
    prompts.push(transaction.context_line);
  }
  return prompts;
}

export default function BlockPromptScreen({ route, navigation }) {
  const { transaction, budget, remaining, blocksToday, overridesLast30d } = route.params;
  const totalSeconds = useRef(
    computeWaitSeconds({
      amount: transaction.amount,
      blocksToday,
      overridesLast30d,
    })
  ).current;

  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [promptIndex, setPromptIndex] = useState(0);
  const intervalRef = useRef(null);
  const promptShownAt = useRef(Date.now());
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const prompts = useRef(
    buildPrompts({ transaction, budget, remaining, blocksToday, overridesLast30d })
  ).current;

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (prompts.length <= 1) return;
    const id = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setPromptIndex((i) => (i + 1) % prompts.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 5000);
    return () => clearInterval(id);
  }, [prompts.length, fadeAnim]);

  const done = secondsLeft === 0;
  const progress = (totalSeconds - secondsLeft) / totalSeconds;

  const handleDismiss = () => {
    const latency = Date.now() - promptShownAt.current;
    decideTransaction({
      transaction_token: transaction.id,
      user_token: USER_ID,
      amount: transaction.amount,
      merchant_name: transaction.merchant || '',
      approved: false,
      decision_latency_ms: latency,
    }).catch(() => {});
    navigation.goBack();
  };

  const hour = new Date().getHours();
  const isLateNight = hour >= 22 || hour < 2;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.top}>
        <Text style={s.label}>Blocked</Text>
        {isLateNight && <Text style={s.lateTag}>Late-night purchase</Text>}
      </View>

      <View style={s.body}>
        <Text style={s.amount}>{'\u00A3'}{transaction.amount?.toFixed(2)}</Text>
        <Text style={s.merchant}>{transaction.merchant || 'Unknown'}</Text>

        <Animated.Text style={[s.prompt, { opacity: fadeAnim }]}>
          {prompts[promptIndex]}
        </Animated.Text>
      </View>

      <View style={s.bottom}>
        {!done ? (
          <View style={s.timerWrap}>
            <View style={s.timerBar}>
              <View style={[s.timerFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={s.timerText}>{secondsLeft}s</Text>
          </View>
        ) : (
          <Text style={s.readyText}>Take a moment. Then decide.</Text>
        )}

        <TouchableOpacity
          style={[s.dismissBtn, !done && s.dismissBtnOff]}
          onPress={handleDismiss}
          disabled={!done}
          activeOpacity={0.7}
        >
          <Text style={[s.dismissText, !done && s.dismissTextOff]}>OK</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  top: {
    paddingHorizontal: 24,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontFamily: font.medium,
    fontSize: 14,
    color: colors.red,
  },
  lateTag: {
    fontFamily: font.medium,
    fontSize: 11,
    color: colors.red,
    backgroundColor: colors.redDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },

  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  amount: {
    fontFamily: font.bold,
    fontSize: 64,
    color: colors.text,
    letterSpacing: -2,
  },
  merchant: {
    fontFamily: font.regular,
    fontSize: 18,
    color: colors.sub,
    marginTop: 6,
  },
  prompt: {
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.muted,
    marginTop: 28,
    lineHeight: 22,
  },

  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  timerWrap: {
    marginBottom: 20,
  },
  timerBar: {
    height: 3,
    backgroundColor: colors.divider,
    borderRadius: 2,
    marginBottom: 10,
  },
  timerFill: {
    height: 3,
    backgroundColor: colors.red,
    borderRadius: 2,
  },
  timerText: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
  readyText: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.sub,
    textAlign: 'center',
    marginBottom: 20,
  },

  dismissBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  dismissBtnOff: {
    opacity: 0.3,
  },
  dismissText: {
    fontFamily: font.semi,
    fontSize: 16,
    color: colors.text,
  },
  dismissTextOff: {
    color: colors.muted,
  },
});
