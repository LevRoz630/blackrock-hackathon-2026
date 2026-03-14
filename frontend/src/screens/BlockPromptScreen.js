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
const BASE_SECONDS = 5;

function computeWaitSeconds({ amount, blocksToday, overridesLast30d }) {
  const amountFactor = Math.min(amount / 200, 1);
  const overrideFactor = Math.min((overridesLast30d || 0) / 10, 1);

  const hour = new Date().getHours();
  const isLateNight = hour >= 22 || hour < 2;
  const timeFactor = isLateNight ? 0.5 : 0;

  const velocityFactor = (blocksToday || 0) > 2 ? 0.5 : 0;

  const bonus = 10 * (
    0.4 * amountFactor +
    0.3 * overrideFactor +
    0.15 * timeFactor +
    0.15 * velocityFactor
  );

  return Math.round(Math.min(Math.max(BASE_SECONDS + bonus, 5), 15));
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

  const prompts = useRef(
    buildPrompts({ transaction, budget, remaining, blocksToday, overridesLast30d })
  ).current;

  const fadeAnim = useRef(new Animated.Value(1)).current;

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

  const handleApprove = () => {
    const latency = Date.now() - promptShownAt.current;
    decideTransaction({
      transaction_token: transaction.id,
      user_token: USER_ID,
      amount: transaction.amount,
      merchant_name: transaction.merchant || '',
      approved: true,
      decision_latency_ms: latency,
    }).catch(() => {});
    navigation.goBack();
  };

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

        <View style={s.btnRow}>
          <TouchableOpacity
            style={[s.declineBtn, !done && s.btnOff]}
            onPress={handleDismiss}
            disabled={!done}
            activeOpacity={0.7}
          >
            <Text style={[s.declineText, !done && s.btnTextOff]}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.approveBtn, !done && s.btnOff]}
            onPress={handleApprove}
            disabled={!done}
            activeOpacity={0.7}
          >
            <Text style={[s.approveText, !done && s.btnTextOff]}>Approve</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 12,
    color: colors.bg,
    backgroundColor: colors.red,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },

  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  amount: {
    fontFamily: font.bold,
    fontSize: 64,
    color: colors.text,
    letterSpacing: -2,
  },
  merchant: {
    fontFamily: font.medium,
    fontSize: 18,
    color: colors.sub,
    marginTop: 4,
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

  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  approveBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.brand,
  },
  btnOff: {
    opacity: 0.3,
  },
  declineText: {
    fontFamily: font.semi,
    fontSize: 16,
    color: colors.text,
  },
  approveText: {
    fontFamily: font.semi,
    fontSize: 16,
    color: '#050506',
  },
  btnTextOff: {
    color: colors.muted,
  },
});
