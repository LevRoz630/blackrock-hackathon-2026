import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { decideTransaction } from '../api/client';
import { colors, font } from '../theme';

const USER_ID = 'demo-user';

export default function HighRiskPromptScreen({ route, navigation }) {
  const { transaction, runningTotal, budget } = route.params;
  const promptShownAt = useRef(Date.now());

  const overBy = runningTotal - budget;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const handleDecline = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.top}>
        <Text style={s.label}>Over budget</Text>
      </View>

      <View style={s.body}>
        <Text style={s.amount}>{'\u00A3'}{transaction.amount?.toFixed(2)}</Text>
        <Text style={s.merchant} numberOfLines={1}>{transaction.merchant || 'Unknown'}</Text>

        <View style={s.stats}>
          <View style={s.stat}>
            <Text style={s.statNum}>{'\u00A3'}{runningTotal.toFixed(2)}</Text>
            <Text style={s.statLabel}>spent so far</Text>
          </View>
          <View style={s.divider} />
          <View style={s.stat}>
            <Text style={[s.statNum, { color: colors.red }]}>{'\u00A3'}{overBy.toFixed(2)}</Text>
            <Text style={s.statLabel}>over budget</Text>
          </View>
        </View>
      </View>

      <View style={s.bottom}>
        <Text style={s.hint}>This transaction was automatically blocked.</Text>
        <TouchableOpacity
          style={s.dismissBtn}
          onPress={handleDecline}
          activeOpacity={0.7}
        >
          <Text style={s.dismissText}>OK</Text>
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
  },
  label: {
    fontFamily: font.medium,
    fontSize: 14,
    color: colors.red,
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

  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
  },
  stat: {
    flex: 1,
  },
  statNum: {
    fontFamily: font.bold,
    fontSize: 24,
    color: colors.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: colors.divider,
    marginHorizontal: 20,
  },

  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  hint: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.muted,
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
});
